// src/services/incidentesService.js
import { v4 as uuidv4 } from 'uuid';
import * as incidentesRepository from '../repositories/incidentesRepository.js';
import * as historialService from './historialService.js';
import * as airflowService from './airflowService.js';
import * as websocketNotifyService from './websocketNotifyService.js';
import { nowUnix } from '../utils/time.js';
import { createError } from '../utils/errors.js';
import { ROLES } from '../utils/roles.js';

export async function crearIncidente(data, usuario) {
  const { tipo, ubicacion, descripcion, urgencia } = data || {};

  if (!tipo || !ubicacion || !descripcion || !urgencia) {
    throw createError(
      400,
      'Faltan campos requeridos para crear el incidente'
    );
  }

  const id = uuidv4();
  const timestamp = nowUnix();

  const incidente = {
    id,
    estado: 'pendiente',
    reportadoPor: usuario.email,
    atendidoPor: null,
    tipo,
    ubicacion,
    descripcion,
    urgencia,
    creadoEn: timestamp,
    actualizadoEn: timestamp
  };

  await incidentesRepository.createIncidente(incidente);

  await historialService.registrarHistorial({
    idIncidente: id,
    accion: 'CREADO',
    realizadoPor: usuario.email,
    detalles: 'Incidente creado con estado pendiente'
  });

  // Stubs asíncronos para futuras fases
  airflowService
    .triggerClasificarYNotificar(id)
    .catch((err) => console.error('Error stub Airflow:', err));
  websocketNotifyService
    .notifyNuevoIncidente(incidente)
    .catch((err) => console.error('Error stub WebSocket:', err));

  return incidente;
}

export async function listarIncidentes(query, usuario) {
  const { estado, reportadoPor, tipo, urgencia } = query || {};
  let incidentes = [];

  if (usuario.rol === ROLES.USUARIO) {
    // Siempre solo los incidentes del propio usuario, usando GSI por reportadoPor
    incidentes = await incidentesRepository.queryIncidentesByReportadoPor(
      usuario.email
    );
  } else if (usuario.rol === ROLES.TRABAJADOR) {
    // Incidentes pendientes (cola global)
    const pendientes = await incidentesRepository.queryIncidentesByEstado(
      'pendiente'
    );

    // Incidentes asignados a este trabajador
    const asignados =
      await incidentesRepository.scanIncidentesByAtendidoPor(
        usuario.email
      );

    // Combinar sin duplicados
    const map = new Map();
    for (const inc of [...pendientes, ...asignados]) {
      if (inc && !map.has(inc.id)) {
        map.set(inc.id, inc);
      }
    }
    incidentes = Array.from(map.values());
  } else if (usuario.rol === ROLES.SUPERVISOR) {
    if (estado) {
      // Si hay filtro de estado, usar GSI estado/creadoEn
      incidentes = await incidentesRepository.queryIncidentesByEstado(
        estado
      );
    } else {
      // Puede ver todos los incidentes
      incidentes = await incidentesRepository.scanIncidentes();
      // TODO: paginar y limitar resultados
    }
  } else {
    throw createError(403, 'Acceso denegado');
  }

  // Filtros adicionales en memoria

  // reportadoPor=me (se respeta como filtro adicional)
  let filtered = incidentes;
  if (reportadoPor === 'me') {
    filtered = filtered.filter(
      (inc) => inc.reportadoPor === usuario.email
    );
  }

  if (estado) {
    filtered = filtered.filter((inc) => inc.estado === estado);
  }

  if (tipo) {
    filtered = filtered.filter((inc) => inc.tipo === tipo);
  }

  if (urgencia) {
    filtered = filtered.filter((inc) => inc.urgencia === urgencia);
  }

  return filtered;
}

export async function asignarIncidente(id, usuario) {
  const incidente = await incidentesRepository.getIncidenteById(id);

  if (!incidente) {
    throw createError(404, 'Incidente no encontrado');
  }

  if (incidente.estado === 'resuelto') {
    throw createError(
      400,
      'No se puede asignar un incidente que ya está resuelto'
    );
  }

  const updates = {
    estado: 'en_atencion',
    actualizadoEn: nowUnix()
  };

  if (!incidente.atendidoPor) {
    updates.atendidoPor = usuario.email;
  }

  const incidenteActualizado = await incidentesRepository.updateIncidente(
    id,
    updates
  );

  await historialService.registrarHistorial({
    idIncidente: id,
    accion: 'ASIGNADO',
    realizadoPor: usuario.email,
    detalles: `Incidente asignado al trabajador ${incidenteActualizado.atendidoPor}`
  });

  websocketNotifyService
    .notifyActualizacionIncidente(incidenteActualizado)
    .catch((err) => console.error('Error stub WebSocket:', err));

  return incidenteActualizado;
}

export async function resolverIncidente(id, usuario) {
  const incidente = await incidentesRepository.getIncidenteById(id);

  if (!incidente) {
    throw createError(404, 'Incidente no encontrado');
  }

  if (incidente.estado === 'resuelto') {
    throw createError(400, 'El incidente ya está resuelto');
  }

  const updates = {
    estado: 'resuelto',
    actualizadoEn: nowUnix()
  };

  // Si aún no tenía atendidoPor, se asigna al trabajador que lo resuelve
  if (!incidente.atendidoPor) {
    updates.atendidoPor = usuario.email;
  }

  const incidenteActualizado = await incidentesRepository.updateIncidente(
    id,
    updates
  );

  await historialService.registrarHistorial({
    idIncidente: id,
    accion: 'RESUELTO',
    realizadoPor: usuario.email,
    detalles: 'Incidente marcado como resuelto'
  });

  websocketNotifyService
    .notifyActualizacionIncidente(incidenteActualizado)
    .catch((err) => console.error('Error stub WebSocket:', err));

  return incidenteActualizado;
}

export async function obtenerHistorialIncidente(id, usuario) {
  const incidente = await incidentesRepository.getIncidenteById(id);

  if (!incidente) {
    throw createError(404, 'Incidente no encontrado');
  }

  if (
    usuario.rol === ROLES.USUARIO &&
    incidente.reportadoPor !== usuario.email
  ) {
    throw createError(403, 'Acceso denegado');
  }

  const historial = await historialService.obtenerHistorialPorIncidente(
    id
  );
  return historial;
}


