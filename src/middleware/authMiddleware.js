// src/middleware/authMiddleware.js
import { verifyToken } from '../utils/jwt.js';

export function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({ message: 'Token inválido o ausente' });
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'Token inválido o ausente' });
  }

  try {
    const payload = verifyToken(token.trim());

    req.user = {
      email: payload.email,
      rol: payload.rol,
      nombre: payload.nombre
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Token inválido o ausente' });
  }
}


