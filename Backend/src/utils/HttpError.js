export class HttpError extends Error {
  constructor(status = 500, message = 'Internal Server Error', code = 'server_error', details = null) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, HttpError);
  }
}

export function badRequest(message = 'Bad Request', details = null) {
  return new HttpError(400, message, 'bad_request', details);
}

export function unauthorized(message = 'Unauthorized', details = null) {
  return new HttpError(401, message, 'unauthorized', details);
}

export function forbidden(message = 'Forbidden', details = null) {
  return new HttpError(403, message, 'forbidden', details);
}

export function notFound(message = 'Not Found', details = null) {
  return new HttpError(404, message, 'not_found', details);
}
