import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, type TokenPayload } from '../utils/token';
import { READER, actorFrom, type Actor } from '../authz/actor';

export interface AuthRequest extends Request {
  user?: TokenPayload;
  actor?: Actor;
}

export const auth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {

  let token = req.cookies?.access_token;

  if (!token) {
    token = req.header('Authorization')?.replace('Bearer ', '');
  }

  if (!token) {
    res.status(401).json({ error: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    req.actor = actorFrom(decoded);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

export const optionalAuth = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  let token = req.cookies?.access_token;

  if (!token) {
    token = req.header('Authorization')?.replace('Bearer ', '');
  }

  req.actor = READER;
  if (token) {
    try {
      const decoded = verifyAccessToken(token);
      req.actor = actorFrom(decoded);
      req.user = decoded;
    } catch {
    }
  }

  next();
};
