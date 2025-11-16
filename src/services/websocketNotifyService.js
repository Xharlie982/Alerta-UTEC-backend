// src/services/websocketNotifyService.js
import {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand
} from '@aws-sdk/client-apigatewaymanagementapi';
import { env } from '../config/env.js';
import * as conexionesRepo from '../repositories/conexionesRepository.js';
import { ROLES } from '../utils/roles.js';

// --- CONFIGURACIÓN CLAVE ---
// El SDK necesita la URL en formato https://, no wss://
// Y necesita saber la región.
const apiGatewayClient = new ApiGatewayManagementApiClient({
  region: env.WS_API_REGION,
  endpoint: env.WS_API_GATEWAY_URL.replace('wss://', 'https://')
});

/**
 * Envía un payload JSON a una connectionId específica.
 * @param {string} connectionId
 * @param {object} payload
 */
async function _postToConnection(connectionId, payload) {
  const command = new PostToConnectionCommand({
    ConnectionId: connectionId,
    Data: JSON.stringify(payload)
  });

  try {
    await apiGatewayClient.send(command);
  } catch (err) {
    // Si la conexión ya no existe (ej. el usuario cerró el navegador),
    // AWS devuelve GoneException. La ignoramos para que el bucle continúe.
    if (err.name === 'GoneException') {
      console.warn(`Conexión no encontrada (GoneException): ${connectionId}`);
      // Opcional: Podríamos borrar esta connectionId "muerta" de DynamoDB
      // await conexionesRepo.deleteConexion(connectionId);
    } else {
      console.error(`Error al enviar a la conexión ${connectionId}:`, err);
    }
  }
}

/**
 * Notifica a todos los trabajadores y supervisores sobre un nuevo incidente.
 * @param {object} incidente
 */
export async function notifyNuevoIncidente(incidente) {
  console.log(`[WebSocket] Notificando nuevo incidente: ${incidente.id}`);

  const payload = {
    action: 'nuevo_incidente',
    data: incidente
  };

  try {
    // 1. Obtener todas las conexiones de trabajadores y supervisores
    const trabajadores = await conexionesRepo.getConexionesByRol(
      ROLES.TRABAJADOR
    );
    const supervisores = await conexionesRepo.getConexionesByRol(
      ROLES.SUPERVISOR
    );

    const conexiones = [...trabajadores, ...supervisores];
    const promesas = conexiones.map((conn) =>
      _postToConnection(conn.connectionId, payload)
    );

    await Promise.all(promesas);
    console.log(
      `[WebSocket] Notificaciones de nuevo incidente enviadas a ${conexiones.length} conexiones.`
    );
  } catch (err) {
    console.error('[WebSocket] Error al notificar nuevo incidente:', err);
  }
}

/**
 * Notifica al usuario que reportó y a los supervisores sobre una actualización.
 * @param {object} incidente
 */
export async function notifyActualizacionIncidente(incidente) {
  console.log(
    `[WebSocket] Notificando actualización de incidente: ${incidente.id}`
  );

  const payload = {
    action: 'actualizacion_incidente',
    data: incidente
  };

  try {
    // 1. Obtener conexiones del usuario que reportó
    const usuario = await conexionesRepo.getConexionesByUserId(
      incidente.reportadoPor
    );
    // 2. Obtener todas las conexiones de supervisores
    const supervisores = await conexionesRepo.getConexionesByRol(
      ROLES.SUPERVISOR
    );

    const conexiones = [...usuario, ...supervisores];
    const promesas = conexiones.map((conn) =>
      _postToConnection(conn.connectionId, payload)
    );

    await Promise.all(promesas);
    console.log(
      `[WebSocket] Notificaciones de actualización enviadas a ${conexiones.length} conexiones.`
    );
  } catch (err) {
    console.error('[WebSocket] Error al notificar actualización:', err);
  }
}



