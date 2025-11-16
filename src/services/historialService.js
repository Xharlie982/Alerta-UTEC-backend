// src/services/historialService.js
import * as historialRepository from '../repositories/historialRepository.js';
import { nowUnix } from '../utils/time.js';

export async function registrarHistorial({
  idIncidente,
  accion,
  realizadoPor,
  detalles
}) {
  const entry = {
    idIncidente,
    timestamp: nowUnix(),
    accion,
    realizadoPor
  };

  if (detalles) {
    entry.detalles = detalles;
  }

  await historialRepository.putHistorialEntry(entry);

  return entry;
}

export async function obtenerHistorialPorIncidente(idIncidente) {
  return historialRepository.getHistorialByIncidente(idIncidente);
}


