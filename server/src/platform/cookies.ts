import { Response } from 'express';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

const REFRESH_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const ACCESS_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000,
};

const REMEMBER_ME_COOKIE_OPTIONS = {
  ...COOKIE_OPTIONS,
  maxAge: 30 * 24 * 60 * 60 * 1000,
};

export function setAccessTokenCookie(res: Response, token: string): void {
  res.cookie('access_token', token, ACCESS_COOKIE_OPTIONS);
}

export function setRefreshTokenCookie(res: Response, token: string, rememberMe: boolean): void {
  const options = rememberMe ? REMEMBER_ME_COOKIE_OPTIONS : REFRESH_COOKIE_OPTIONS;
  res.cookie('refresh_token', token, options);
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('access_token', COOKIE_OPTIONS);
  res.clearCookie('refresh_token', COOKIE_OPTIONS);
}

export function getRefreshTokenFromCookie(req: { cookies?: { refresh_token?: string } }): string | undefined {
  return req.cookies?.refresh_token;
}
