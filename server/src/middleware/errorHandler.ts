import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors';

interface BodyParserError extends Error {
  status?: number;
  statusCode?: number;
  type?: string;
}

// Registered after the routes: an unmatched path is a failure like any other and
// answers in the same JSON shape, rather than falling through to the framework's
// HTML page.
export const notFoundHandler = (
  _req: Request,
  res: Response
): void => {
  res.status(404).json({ error: 'No such route' });
};

// The only place an unhandled throw becomes a response. Handlers keep a local
// catch only when they have something specific to say — the Excerpt Suggestion
// fallback is the model: it catches because it has a better answer.
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const requestId = req.id;

  if (err instanceof HttpError) {
    res.status(err.status).json({
      error: err.message,
      ...(err.details ? { details: err.details } : {}),
      requestId,
    });
    return;
  }

  // A body the parser could not read is the caller's mistake, not the
  // server's, so it must not inflate the server error rate.
  const parserError = err as BodyParserError;
  const parserStatus = parserError?.status ?? parserError?.statusCode;
  if (parserStatus && parserStatus >= 400 && parserStatus < 500) {
    res.status(parserStatus).json({ error: 'Malformed request', requestId });
    return;
  }

  // Internal detail is logged, never returned.
  console.error('Unhandled error', {
    requestId,
    method: req.method,
    path: req.originalUrl,
    error: err instanceof Error ? err.stack : String(err),
  });

  res.status(500).json({ error: 'Server error', requestId });
};
