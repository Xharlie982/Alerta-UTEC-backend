// src/repositories/usuariosRepository.js
import { GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from '../config/dynamoClient.js';
import { env } from '../config/env.js';
import { createError } from '../utils/errors.js'; // <-- ¡Asegúrate de importar esto!

export async function getUsuarioByEmail(email) {
  const params = {
    TableName: env.DDB_TABLE_USUARIOS,
    Key: { email }
  };

  const result = await dynamoDocClient.send(new GetCommand(params));
  return result.Item || null;
}

// --- VERSIÓN CORREGIDA ---
export async function crearUsuario(usuario) {
  const params = new PutCommand({
    TableName: env.DDB_TABLE_USUARIOS,
    Item: usuario,
    ConditionExpression: 'attribute_not_exists(email)' // Evita sobrescribir
  });

  try {
    await dynamoDocClient.send(params);
    return usuario;
  } catch (err) {
    if (err.name === 'ConditionalCheckFailedException') {
      // Esto se activa si el email ya existe
      throw createError(409, 'El email ya está registrado');
    }
    // Otro error
    console.error('Error al crear usuario en DynamoDB:', err);
    throw createError(500, 'Error de base de datos', err.message);
  }
}