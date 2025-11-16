// src/routes/incidentes.routes.js
import { Router } from 'express';
import * as incidentesController from '../controllers/incidentesController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/requireRole.js';
import { ROLES } from '../utils/roles.js';

const router = Router();

// Crear incidente (rol: usuario)
router.post(
  '/',
  authMiddleware,
  requireRole(ROLES.USUARIO),
  incidentesController.crearIncidente
);

// Listar incidentes (roles: todos)
router.get(
  '/',
  authMiddleware,
  requireRole(ROLES.USUARIO, ROLES.TRABAJADOR, ROLES.SUPERVISOR),
  incidentesController.listarIncidentes
);

// Asignar incidente (rol: trabajador)
router.patch(
  '/:id/asignar',
  authMiddleware,
  requireRole(ROLES.TRABAJADOR),
  incidentesController.asignarIncidente
);

// Resolver incidente (rol: trabajador)
router.patch(
  '/:id/resolver',
  authMiddleware,
  requireRole(ROLES.TRABAJADOR),
  incidentesController.resolverIncidente
);

// Historial de incidente (roles: usuario, trabajador, supervisor)
router.get(
  '/:id/historial',
  authMiddleware,
  requireRole(ROLES.USUARIO, ROLES.TRABAJADOR, ROLES.SUPERVISOR),
  incidentesController.obtenerHistorialIncidente
);

export default router;


