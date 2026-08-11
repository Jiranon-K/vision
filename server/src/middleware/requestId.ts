import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

// `id` is declared on http.IncomingMessage by pino-http, so Express's Request
// already carries it and augmenting the interface here would redeclare it with
// a narrower type — which breaks every app.use() overload. Reading it through
// one accessor keeps the coercion in a single place instead.
type WithId = { id?: unknown };

export const getRequestId = (req: Request): string | undefined => {
  const id = (req as WithId).id;
  return typeof id === 'string' ? id : undefined;
};

// One identifier per request, echoed on the response and quoted in the failure
// body, so a Creator reporting "it broke" can be traced to the exact request.
// An upstream proxy's value wins so a trace survives the hop.
export const requestId = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const upstream = req.header('X-Request-Id');
  const id =
    upstream && upstream.length <= 200 ? upstream : crypto.randomUUID();
  (req as WithId).id = id;
  res.setHeader('X-Request-Id', id);
  next();
};
