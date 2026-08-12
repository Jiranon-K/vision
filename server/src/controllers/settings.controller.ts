import { Response } from 'express';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { validatePasswordStrength } from '../utils/password';
import { changePasswordSchema } from '../schemas/auth';
import { reissueSessionAfterPasswordChange } from './auth.controller';

// `profile` is a nested path, so Mongoose hands back a subdocument on some
// query shapes and a plain object on others. Normalize before spreading.
function plainProfile(profile: unknown): Record<string, unknown> {
  const maybeDoc = profile as { toObject?: () => Record<string, unknown> };
  return maybeDoc?.toObject?.() ?? (profile as Record<string, unknown>);
}

export const getProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select('-password');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      ...plainProfile(user.profile),
      email: user.email,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { name, bio, avatar } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      {
        'profile.name': name,
        'profile.bio': bio,
        'profile.avatar': avatar,
      },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      ...plainProfile(user.profile),
      email: user.email,
    });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {

    const validation = changePasswordSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: validation.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      });
      return;
    }

    const { currentPassword, newPassword } = validation.data;


    const passwordCheck = validatePasswordStrength(newPassword);
    if (!passwordCheck.isValid) {
      res.status(400).json({
        error: 'Password does not meet requirements',
        details: passwordCheck.errors,
      });
      return;
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    user.password = newPassword;
    await user.save();

    // Changing a password is a meaningful response to a suspected compromise
    // only if it takes the other devices with it. The device making the change
    // is re-issued so the safe action does not punish the Creator making it.
    await reissueSessionAfterPasswordChange(req, res, user._id.toString());

    res.json({ message: 'Password changed successfully' });
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const getNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).select(
      'notifications -_id'
    );
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user.notifications);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};

export const updateNotifications = async (
  req: AuthRequest,
  res: Response
): Promise<void> => {
  try {
    const { notifications } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { notifications },
      { new: true }
    ).select('-password');

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(user.notifications);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
};
