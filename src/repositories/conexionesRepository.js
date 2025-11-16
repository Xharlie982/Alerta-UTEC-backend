// src/repositories/conexionesRepository.js
import { ScanCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from '../config/dynamoClient.js';
import { env } from '../config/env.js';

const TABLA_CONEXIONES = env.DDB_TABLE_CONEXIONES_WS;

/**
 * Busca conexiones activas filtrando por rol.
 * NOTE: Esto usa Scan, lo cual no es ideal para rendimiento en tablas grandes.
 * En una V2, esto debería optimizarse con un GSI sobre el 'rol'.
 */
export async function getConexionesByRol(rol) {
  const command = new ScanCommand({
    TableName: TABLA_CONEXIONES,
    FilterExpression: 'rol = :rol',
    ExpressionAttributeValues: {
      ':rol': rol
    },
    ProjectionExpression: 'connectionId'
  });

  try {
    const data = await dynamoDocClient.send(command);
    return data.Items || [];
  } catch (err) {
    console.error('Error al escanear conexiones por rol:', err);
    return [];
  }
}

/**
 * Busca conexiones activas filtrando por userId (email).
 * NOTE: Esto también usa Scan. Optimizar con un GSI si es necesario.
 */
export async function getConexionesByUserId(userId) {
  const command = new ScanCommand({
    TableName: TABLA_CONEXIONES,
    FilterExpression: 'userId = :userId',
    ExpressionAttributeValues: {
      ':userId': userId
    },
    ProjectionExpression: 'connectionId'
  });

  try {
    const data = await dynamoDocClient.send(command);
    return data.Items || [];
  } catch (err) {
    console.error('Error al escanear conexiones por userId:', err);
    return [];
  }
}


