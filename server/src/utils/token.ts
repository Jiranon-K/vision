import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET: string = process.env.JWT_SECRET ?? (() => {
  throw new Error('JWT_SECRET is required');
})();

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

const ACCESS_TOKEN_EXPIRY = (process.env.JWT_ACCESS_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
const REFRESH_TOKEN_EXPIRY = (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
const REMEMBER_ME_EXPIRY = (process.env.JWT_REMEMBER_ME_EXPIRES_IN || '30d') as SignOptions['expiresIn'];

export interface TokenPayload {
  id: string;
  email: string;
  name: string;
}

export interface RefreshTokenPayload {
  id: string;
  email: string;
  name: string;
  type: 'refresh';
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: TokenPayload, rememberMe: boolean): string {
  const expiry = rememberMe ? REMEMBER_ME_EXPIRY : REFRESH_TOKEN_EXPIRY;
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: expiry });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as unknown as TokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as unknown as RefreshTokenPayload;
  if (decoded.type !== 'refresh') {
    throw new Error('Invalid token type');
  }
  return decoded;
}
