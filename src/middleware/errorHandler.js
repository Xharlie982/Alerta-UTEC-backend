// src/middleware/errorHandler.js
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // Log básico del error en servidor
  // eslint-disable-next-line no-console
  console.error(err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';

  const response = { message };

  if (env.NODE_ENV !== 'production') {
    if (err.details) {
      response.details = err.details;
    } else if (err.stack) {
      response.details = err.stack;
    }
  }

  res.status(statusCode).json(response);
}


