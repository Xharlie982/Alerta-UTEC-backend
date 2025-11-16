// src/utils/errors.js
export class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    if (details) {
      this.details = details;
    }
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export function createError(statusCode, message, details) {
  return new AppError(statusCode, message, details);
}


