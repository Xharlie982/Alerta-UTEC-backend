// src/services/authService.js
import bcrypt from 'bcryptjs';
import * as usuariosRepository from '../repositories/usuariosRepository.js';
import { signToken } from '../utils/jwt.js';
import { createError } from '../utils/errors.js';
import { ROLES } from '../utils/roles.js';
import { env } from '../config/env.js';

// --- SERVICIO DE LOGIN ---
export async function login(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const usuario = await usuariosRepository.getUsuarioByEmail(normalizedEmail);

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
  return { token, usuario: payload };
}

// --- SERVICIO DE REGISTRO CON CÓDIGOS DE SEGURIDAD ---
export async function register(
  email,
  password,
  nombre,
  rol,
  registrationCode
) {
  const normalizedEmail = String(email).trim().toLowerCase();

  // Validar rol
  if (!Object.values(ROLES).includes(rol)) {
    throw createError(400, 'Rol inválido');
  }

  // Validar códigos por rol
  if (rol === ROLES.TRABAJADOR) {
    if (registrationCode !== env.REG_CODE_TRABAJADOR) {
      throw createError(401, 'Código de registro de trabajador inválido');
    }
  } else if (rol === ROLES.SUPERVISOR) {
    if (registrationCode !== env.REG_CODE_SUPERVISOR) {
      throw createError(401, 'Código de registro de supervisor inválido');
    }
  }
  // Para rol USUARIO no se requiere código

  // Verificar no duplicado
  const existente = await usuariosRepository.getUsuarioByEmail(normalizedEmail);
  if (existente) {
    throw createError(409, 'El email ya está registrado');
  }

  // Hash de contraseña
  const passwordHash = await bcrypt.hash(password, 10);

  // Guardar
  const nuevoUsuario = {
    email: normalizedEmail,
    passwordHash,
    nombre,
    rol,
    creadoEn: Math.floor(Date.now() / 1000)
  };

  const guardado = await usuariosRepository.crearUsuario(nuevoUsuario);

  const usuarioResponse = {
    email: guardado.email,
    nombre: guardado.nombre,
    rol: guardado.rol,
    creadoEn: guardado.creadoEn
  };

  const token = signToken({
    email: usuarioResponse.email,
    nombre: usuarioResponse.nombre,
    rol: usuarioResponse.rol
  });

  return { token, usuario: usuarioResponse };
}

