import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
  }
}

// One identifier per request, echoed on the response and quoted in the failure
// body, so a Creator reporting "it broke" can be traced to the exact request.
// An upstream proxy's value wins so a trace survives the hop.
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const upstream = req.header('X-Request-Id');
  req.id = upstream && upstream.length <= 200 ? upstream : crypto.randomUUID();
  res.setHeader('X-Request-Id', req.id);
  next();
};
