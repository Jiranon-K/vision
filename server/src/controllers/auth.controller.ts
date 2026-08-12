import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { logger } from '../logger';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, hashToken, newSessionId } from '../utils/token';
import { setAccessTokenCookie, setRefreshTokenCookie, clearAuthCookies } from '../utils/cookies';
import { validatePasswordStrength } from '../utils/password';
import { trackFailedLogin, resetFailedLogin, isAccountLocked } from '../middleware/loginSecurity';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../schemas/auth';
import { sendResetPasswordEmail, sendVerificationEmail } from '../emails/send';
import { isAdminEmail } from '../utils/roles';

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const REMEMBER_ME_COOKIE_MAX_AGE = 30 * 24 * 60 * 60 * 1000;


function getValidationIssues(validationError: { issues: Array<{ path: Array<string | number>; message: string }> }) {
  return validationError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

async function respondWithTokens(
  res: Response,
  user: InstanceType<typeof User>,
  rememberMe: boolean
): Promise<void> {
  const tokenPayload = {
    id: user._id.toString(),
    email: user.email,
    name: user.profile.name,
    role: user.role,
  };
  const sid = newSessionId();
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload, rememberMe, sid);

  const expiresAt = new Date(
    Date.now() + (rememberMe ? REMEMBER_ME_COOKIE_MAX_AGE : REFRESH_COOKIE_MAX_AGE)
  );

  // Written as two atomic updates rather than by assigning the array: the
  // session list is select:false, so a document loaded without it would carry
  // an empty array and saving would sign out every other device. Pruning
  // expired entries here bounds the list to the devices actually in use.
  await User.updateOne(
    { _id: user._id },
    { $pull: { sessions: { expiresAt: { $lte: new Date() } } } }
  );
  await User.updateOne(
    { _id: user._id },
    { $push: { sessions: { sid, tokenHash: hashToken(refreshToken), expiresAt } } }
  );

  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken, rememberMe);
}

// Sign-in and password change both need the Creator's session list loaded, and
// it is select:false so it never rides along on an ordinary read.
async function loadWithSessions(id: string) {
  return User.findById(id).select('+sessions');
}

/**
 * Drop every session and issue a fresh one for the device making the request.
 * Lives here rather than in the settings controller because issuing a session
 * is this module's job, and two places that mint refresh tokens is one too many.
 */
export async function reissueSessionAfterPasswordChange(
  req: Request,
  res: Response,
  userId: string
): Promise<void> {
  const user = await loadWithSessions(userId);
  if (!user) return;

  // Whether this device asked to be remembered is recorded in the refresh
  // token it is holding; re-issuing without reading it would silently downgrade
  // a remembered session to a short one.
  let rememberMe = false;
  const current = req.cookies?.refresh_token;
  if (current) {
    try {
      const payload = verifyRefreshToken(current);
      const existing = user.sessions?.find((s) => s.sid === payload.sid);
      if (existing) {
        rememberMe =
          existing.expiresAt.getTime() - Date.now() > REFRESH_COOKIE_MAX_AGE;
      }
    } catch {
      // Unreadable: fall through with the default session length.
    }
  }

  await User.updateOne({ _id: user._id }, { $set: { sessions: [] } });
  await respondWithTokens(res, user, rememberMe);
}

function sanitizeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    emailVerified: user.emailVerified,
  };
}

export const register = async (req: Request, res: Response): Promise<void> => {
  try {

    const validation = registerSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { email, password, name } = validation.data;


    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.isValid) {
      res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordCheck.errors,
      });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }


    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const user = new User({
      email,
      password,
      role: isAdminEmail(email) ? 'admin' : 'author',
      profile: { name: name || '' },
      verificationToken: hashToken(verificationToken),
      verificationTokenExpiry,
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.name);
    } catch (sendErr) {
      logger.error({ err: sendErr }, 'Failed to send verification email');
      // Registration still succeeds; user can request resend later
    }


    await respondWithTokens(res, user, false);

    res.status(201).json({
      user: sanitizeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    logger.error({ err: error }, 'Register error');
    res.status(500).json({ error: 'Server error' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {

    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { email, password, rememberMe } = validation.data;


    const lockStatus = await isAccountLocked(email);
    if (lockStatus.locked) {
      res.status(423).json({
        error: 'Account is temporarily locked due to too many failed login attempts.',
        lockUntil: lockStatus.lockUntil,
      });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await trackFailedLogin(email);
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }


    await resetFailedLogin(email);


    // Self-heal admin role from ADMIN_EMAILS so promotions take effect on next
    // login without a manual DB edit. Only persist when the role actually changes.
    if (isAdminEmail(user.email) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    await respondWithTokens(res, user, rememberMe || false);

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error({ err: error }, 'Login error');
    res.status(500).json({ error: 'Server error' });
  }
};

// Signing out revokes the session on this device and leaves the Creator's other
// devices alone. Clearing the cookies alone would leave a captured token valid
// for as long as it had left to live.
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        await User.updateOne(
          { _id: payload.id },
          { $pull: { sessions: { sid: payload.sid } } }
        );
      } catch {
        // An unreadable token identifies no session to revoke; clearing the
        // cookies below is all that is left to do.
      }
    }

    clearAuthCookies(res);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Logout error');
    res.status(500).json({ error: 'Server error' });
  }
};

// The action a Creator needs when they have left themselves signed in somewhere
// they no longer control.
export const logoutEverywhere = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  await User.updateOne({ _id: req.user!.id }, { $set: { sessions: [] } });
  clearAuthCookies(res);
  res.json({ message: 'Signed out on every device' });
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }


    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }


    const user = await loadWithSessions(payload.id);
    const session = user?.sessions?.find(
      (s) => s.sid === payload.sid && s.tokenHash === hashToken(refreshToken)
    );

    if (!user || !session) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    if (session.expiresAt < new Date()) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Refresh token expired. Please login again.' });
      return;
    }


    const tokenPayload = {
      id: user._id.toString(),
      email: user.email,
      name: user.profile.name,
      role: user.role,
    };
    const accessToken = generateAccessToken(tokenPayload);

    setAccessTokenCookie(res, accessToken);

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    logger.error({ err: error }, 'Refresh error');
    res.status(500).json({ error: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(sanitizeUser(user));
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = forgotPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { email } = validation.data;

    const user = await User.findOne({ email });


    if (!user) {
      res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
      return;
    }


    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

    user.resetPasswordToken = hashToken(resetToken);
    user.resetPasswordExpiry = resetExpiry;
    await user.save();

    try {
      await sendResetPasswordEmail(user.email, resetToken, user.profile?.name);
    } catch (sendErr) {
      logger.error({ err: sendErr }, 'Failed to send reset email');
      // Intentionally do NOT reveal send failure to client (no enumeration)
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    logger.error({ err: error }, 'Forgot password error');
    res.status(500).json({ error: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = resetPasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { token, newPassword } = validation.data;
    const hashedToken = hashToken(token);

    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordCheck.errors,
      });
      return;
    }

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired reset token' });
      return;
    }


    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    // A reset is the flow a Creator reaches for when they believe someone else
    // has their account, so every device loses its session.
    await User.updateOne({ _id: user._id }, { $set: { sessions: [] } });

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    logger.error({ err: error }, 'Reset password error');
    res.status(500).json({ error: 'Server error' });
  }
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = verifyEmailSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: getValidationIssues(validation.error),
      });
      return;
    }

    const { token } = validation.data;
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      verificationToken: hashedToken,
      verificationTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ error: 'Invalid or expired verification token' });
      return;
    }

    user.emailVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error({ err: error }, 'Verify email error');
    res.status(500).json({ error: 'Server error' });
  }
};

export const resendVerification = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.emailVerified) {
      res.status(400).json({ error: 'Email already verified' });
      return;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationToken = hashToken(verificationToken);
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.name);
    } catch (sendErr) {
      logger.error({ err: sendErr }, 'Failed to send verification email');
      res.status(500).json({ error: 'Could not send verification email. Please try again later.' });
      return;
    }

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    logger.error({ err: error }, 'Resend verification error');
    res.status(500).json({ error: 'Server error' });
  }
};
