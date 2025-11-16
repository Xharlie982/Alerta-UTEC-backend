// src/utils/jwt.js
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export function signToken(payload) {
  return jwt.sign(payload, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '8h'
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.JWT_SECRET);
}


