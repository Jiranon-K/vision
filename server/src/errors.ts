// An expected failure a handler can name without writing a response. The edge
// decides how it is rendered; anything it does not recognise becomes a server
// error with a generic message.
export class HttpError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.details = details;
  }
}

export const notFound = (message = 'Not found'): HttpError =>
  new HttpError(404, message);

export const forbidden = (message: string): HttpError =>
  new HttpError(403, message);

export const badRequest = (message: string, details?: unknown): HttpError =>
  new HttpError(400, message, details);

// The field-level shape the auth and editor forms consume. It predates this
// module and is preserved exactly: changing it would break every form at once.
export const validationFailed = (
  issues: { path: (string | number)[]; message: string }[]
): HttpError =>
  new HttpError(
    400,
    'Validation failed',
    issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }))
  );
