// src/repositories/historialRepository.js
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from '../config/dynamoClient.js';
import { env } from '../config/env.js';

export async function putHistorialEntry(entry) {
  const params = {
    TableName: env.DDB_TABLE_HISTORIAL,
    Item: entry
  };

  await dynamoDocClient.send(new PutCommand(params));
  return entry;
}

export async function getHistorialByIncidente(idIncidente) {
  const params = {
    TableName: env.DDB_TABLE_HISTORIAL,
    KeyConditionExpression: 'idIncidente = :idIncidente',
    ExpressionAttributeValues: {
      ':idIncidente': idIncidente
    },
    ScanIndexForward: true // historial en orden cronológico ascendente
  };

  const result = await dynamoDocClient.send(new QueryCommand(params));
  return result.Items || [];
}


