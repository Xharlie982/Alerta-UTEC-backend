// src/utils/roles.js
export const ROLES = {
  USUARIO: 'usuario',
  TRABAJADOR: 'trabajador',
  SUPERVISOR: 'supervisor'
};

export function isUsuario(rol) {
  return rol === ROLES.USUARIO;
}

export function isTrabajador(rol) {
  return rol === ROLES.TRABAJADOR;
}

export function isSupervisor(rol) {
  return rol === ROLES.SUPERVISOR;
}


