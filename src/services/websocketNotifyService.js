// src/services/websocketNotifyService.js
import { env } from '../config/env.js';

export async function notifyNuevoIncidente(incidente) {
  // Stub Fase 2: integración futura con API Gateway WebSocket
  console.log(
    '[WebSocket STUB] Nuevo incidente creado:',
    incidente.id,
    'estado:',
    incidente.estado
  );

  // TODO: En Fase 2, usar ApiGatewayManagementApiClient con endpoint env.WS_API_GATEWAY_URL
  // y leer conexiones desde la tabla env.DDB_TABLE_CONEXIONES_WS para enviar mensajes
}

export async function notifyActualizacionIncidente(incidente) {
  // Stub Fase 2: integración futura con API Gateway WebSocket
  console.log(
    '[WebSocket STUB] Incidente actualizado:',
    incidente.id,
    'nuevo estado:',
    incidente.estado
  );

  // TODO: En Fase 2, usar ApiGatewayManagementApiClient para notificar a las conexiones
}


