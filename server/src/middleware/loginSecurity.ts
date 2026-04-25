import User from '../models/User';

const LOCKOUT_DURATION = 15 * 60 * 1000;
const MAX_FAILED_ATTEMPTS = 5;

export async function trackFailedLogin(email: string): Promise<void> {
  const user = await User.findOne({ email }).select('failedLoginAttempts');
  if (!user) {
    return;
  }

  const failedAttempts = user.failedLoginAttempts + 1;

  await User.findByIdAndUpdate(user._id, {
    failedLoginAttempts: failedAttempts,
    lockUntil: failedAttempts >= MAX_FAILED_ATTEMPTS
      ? new Date(Date.now() + LOCKOUT_DURATION)
      : undefined,
  });
}

export async function resetFailedLogin(email: string): Promise<void> {
  await User.findOneAndUpdate(
    { email },
    {
      failedLoginAttempts: 0,
      lockUntil: undefined,
    }
  );
}

export async function isAccountLocked(email: string): Promise<{ locked: boolean; lockUntil?: Date }> {
  const user = await User.findOne({ email }).select('lockUntil failedLoginAttempts');

  if (!user) {
    return { locked: false };
  }

  if (user.lockUntil && user.lockUntil > new Date()) {
    return { locked: true, lockUntil: user.lockUntil };
  }


  if (user.lockUntil && user.lockUntil <= new Date()) {
    await User.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockUntil: undefined,
    });
  }

  return { locked: false };
}
