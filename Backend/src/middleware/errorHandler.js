export default function errorHandler(err, req, res, next) {
  const requestId = req && req.requestId ? req.requestId : undefined;
  // Normalize some common error shapes (Joi, Mongoose, JsonWebToken)
  let status =
    err && (err.status || err.statusCode) ? err.status || err.statusCode : 500;
  let code = err && err.code ? err.code : "server_error";
  let message = err && err.message ? err.message : "Internal Server Error";
  let details = err && err.details ? err.details : undefined;

  // Joi validation errors
  if (err && err.isJoi) {
    status = 400;
    code = "validation_error";
    message = "Validation failed";
    details = err.details || err._original || err.message;
  }

  // Mongoose validation errors
  if (err && err.name === "ValidationError") {
    status = 400;
    code = "validation_error";
    message = err.message || "Validation error";
    details = err.errors || null;
  }

  // Mongo duplicate key
  if (err && err.code && String(err.code).includes("E11000")) {
    status = 409;
    code = "duplicate_key";
    message = "Duplicate key error";
    details = err.keyValue || null;
  }

  // JWT errors
  if (
    err &&
    (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError")
  ) {
    status = 401;
    code = "invalid_token";
    message = err.message || "Invalid token";
  }

  // Log with request id
  if (requestId) {
    console.error(`[${requestId}]`, err && err.stack ? err.stack : err);
  } else {
    console.error(err && err.stack ? err.stack : err);
  }

  const payload = { status, code, message };
  if (details && process.env.NODE_ENV !== "production")
    payload.details = details;
  if (requestId) payload.requestId = requestId;

  res.status(status).json(payload);
}
