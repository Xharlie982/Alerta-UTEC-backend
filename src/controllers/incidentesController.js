// src/controllers/incidentesController.js
import * as incidentesService from '../services/incidentesService.js';

export async function crearIncidente(req, res, next) {
  try {
    const incidente = await incidentesService.crearIncidente(req.body, req.user);
    res.status(201).json(incidente);
  } catch (err) {
    next(err);
  }
}

export async function listarIncidentes(req, res, next) {
  try {
    const incidentes = await incidentesService.listarIncidentes(
      req.query,
      req.user
    );
    // Sin paginación por ahora, pero idealmente paginar en futuras fases
    res.status(200).json(incidentes);
  } catch (err) {
    next(err);
  }
}

export async function asignarIncidente(req, res, next) {
  try {
    const { id } = req.params;
    const incidente = await incidentesService.asignarIncidente(id, req.user);
    res.status(200).json(incidente);
  } catch (err) {
    next(err);
  }
}

export async function resolverIncidente(req, res, next) {
  try {
    const { id } = req.params;
    const incidente = await incidentesService.resolverIncidente(id, req.user);
    res.status(200).json(incidente);
  } catch (err) {
    next(err);
  }
}

export async function obtenerHistorialIncidente(req, res, next) {
  try {
    const { id } = req.params;
    const historial = await incidentesService.obtenerHistorialIncidente(
      id,
      req.user
    );
    res.status(200).json(historial);
  } catch (err) {
    next(err);
  }
}


