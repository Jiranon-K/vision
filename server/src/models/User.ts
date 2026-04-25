import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  profile: {
    name: string;
    bio: string;
    avatar: string;
  };
  notifications: {
    email: {
      newComments: boolean;
      newFollowers: boolean;
      weeklyDigest: boolean;
      marketingEmails: boolean;
    };
    push: {
      enabled: boolean;
      postUpdates: boolean;
      systemAlerts: boolean;
    };
    frequency: 'daily' | 'weekly' | 'monthly';
  };

  refreshToken?: string;
  refreshTokenExpiry?: Date;
  emailVerified: boolean;
  verificationToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  failedLoginAttempts: number;
  lockUntil?: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    profile: {
      name: { type: String, default: '' },
      bio: { type: String, default: '' },
      avatar: { type: String, default: '' },
    },
    notifications: {
      email: {
        newComments: { type: Boolean, default: true },
        newFollowers: { type: Boolean, default: true },
        weeklyDigest: { type: Boolean, default: false },
        marketingEmails: { type: Boolean, default: false },
      },
      push: {
        enabled: { type: Boolean, default: true },
        postUpdates: { type: Boolean, default: true },
        systemAlerts: { type: Boolean, default: true },
      },
      frequency: {
        type: String,
        enum: ['daily', 'weekly', 'monthly'],
        default: 'weekly',
      },
    },

    refreshToken: { type: String, select: false },
    refreshTokenExpiry: { type: Date },
    emailVerified: { type: Boolean, default: false },
    verificationToken: { type: String, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpiry: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

export default mongoose.model<IUser>('User', UserSchema);
