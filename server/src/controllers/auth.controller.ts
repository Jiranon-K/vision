import { Request, Response } from 'express';
import crypto from 'crypto';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken, hashToken } from '../utils/token';
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
  const tokenPayload = { id: user._id.toString(), email: user.email, name: user.profile.name };
  const accessToken = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload, rememberMe);


  user.refreshToken = refreshToken;
  user.refreshTokenExpiry = new Date(
    Date.now() + (rememberMe ? REMEMBER_ME_COOKIE_MAX_AGE : REFRESH_COOKIE_MAX_AGE)
  );
  await user.save();


  setAccessTokenCookie(res, accessToken);
  setRefreshTokenCookie(res, refreshToken, rememberMe);
}

function sanitizeUser(user: InstanceType<typeof User>) {
  return {
    id: user._id,
    email: user.email,
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
      profile: { name: name || '' },
      verificationToken: hashToken(verificationToken),
      verificationTokenExpiry,
    });

    await user.save();

    try {
      await sendVerificationEmail(user.email, verificationToken, user.profile?.name);
    } catch (sendErr) {
      console.error('Failed to send verification email:', sendErr);
      // Registration still succeeds; user can request resend later
    }


    await respondWithTokens(res, user, false);

    res.status(201).json({
      user: sanitizeUser(user),
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error) {
    console.error('Register error:', error);
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


    await respondWithTokens(res, user, rememberMe || false);

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies?.refresh_token;
    const accessToken = req.cookies?.access_token;

    if (refreshToken) {
      await User.findOneAndUpdate({ refreshToken }, {
        refreshToken: undefined,
        refreshTokenExpiry: undefined,
      });
    } else if (accessToken) {
      try {
        const payload = verifyAccessToken(accessToken);
        await User.findByIdAndUpdate(payload.id, {
          refreshToken: undefined,
          refreshTokenExpiry: undefined,
        });
      } catch {

      }
    }


    clearAuthCookies(res);

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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


    const user = await User.findOne({
      _id: payload.id,
      refreshToken: refreshToken,
    }).select('+refreshToken');

    if (!user) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }


    if (user.refreshTokenExpiry && user.refreshTokenExpiry < new Date()) {
      clearAuthCookies(res);
      res.status(401).json({ error: 'Refresh token expired. Please login again.' });
      return;
    }


    const tokenPayload = { 
      id: user._id.toString(), 
      email: user.email,
      name: user.profile.name 
    };
    const accessToken = generateAccessToken(tokenPayload);

    setAccessTokenCookie(res, accessToken);

    res.json({
      user: sanitizeUser(user),
    });
  } catch (error) {
    console.error('Refresh error:', error);
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
      console.error('Failed to send reset email:', sendErr);
      // Intentionally do NOT reveal send failure to client (no enumeration)
    }

    res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
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
    user.refreshToken = undefined;
    user.refreshTokenExpiry = undefined;
    await user.save();

    res.json({ message: 'Password has been reset successfully. Please login with your new password.' });
  } catch (error) {
    console.error('Reset password error:', error);
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
    console.error('Verify email error:', error);
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
      console.error('Failed to send verification email:', sendErr);
      res.status(500).json({ error: 'Could not send verification email. Please try again later.' });
      return;
    }

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
