// src/repositories/usuariosRepository.js
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from '../config/dynamoClient.js';
import { env } from '../config/env.js';

export async function getUsuarioByEmail(email) {
  const params = {
    TableName: env.DDB_TABLE_USUARIOS,
    Key: { email }
  };

  const result = await dynamoDocClient.send(new GetCommand(params));
  return result.Item || null;
}


