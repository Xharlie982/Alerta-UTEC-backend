// src/controllers/authController.js
import * as authService from '../services/authService.js';
import { createError } from '../utils/errors.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      throw createError(400, 'Email y password son requeridos');
    }

    const result = await authService.login(email, password);

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}


