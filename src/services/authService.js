// src/services/authService.js
import bcrypt from 'bcryptjs';
import * as usuariosRepository from '../repositories/usuariosRepository.js';
import { signToken } from '../utils/jwt.js';
import { createError } from '../utils/errors.js';

export async function login(email, password) {
  const usuario = await usuariosRepository.getUsuarioByEmail(email);

  if (!usuario) {
    throw createError(401, 'Credenciales inválidas');
  }

  const passwordOk = await bcrypt.compare(password, usuario.passwordHash);

  if (!passwordOk) {
    throw createError(401, 'Credenciales inválidas');
  }

  const payload = {
    email: usuario.email,
    rol: usuario.rol,
    nombre: usuario.nombre
  };

  const token = signToken(payload);

  return {
    token,
    usuario: payload
  };
}


