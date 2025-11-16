// src/repositories/incidentesRepository.js
import {
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
  UpdateCommand
} from '@aws-sdk/lib-dynamodb';
import { dynamoDocClient } from '../config/dynamoClient.js';
import { env } from '../config/env.js';

export async function createIncidente(incidente) {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    Item: incidente
  };

  await dynamoDocClient.send(new PutCommand(params));
  return incidente;
}

export async function getIncidenteById(id) {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    Key: { id }
  };

  const result = await dynamoDocClient.send(new GetCommand(params));
  return result.Item || null;
}

export async function queryIncidentesByReportadoPor(reportadoPor) {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    IndexName: env.INCIDENTES_GSI_BY_REPORTADO_POR,
    KeyConditionExpression: 'reportadoPor = :reportadoPor',
    ExpressionAttributeValues: {
      ':reportadoPor': reportadoPor
    },
    ScanIndexForward: false // más recientes primero
  };

  const result = await dynamoDocClient.send(new QueryCommand(params));
  return result.Items || [];
}

export async function queryIncidentesByEstado(estado) {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    IndexName: env.INCIDENTES_GSI_BY_ESTADO,
    KeyConditionExpression: 'estado = :estado',
    ExpressionAttributeValues: {
      ':estado': estado
    },
    ScanIndexForward: false // más recientes primero
  };

  const result = await dynamoDocClient.send(new QueryCommand(params));
  return result.Items || [];
}

export async function scanIncidentes() {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES
  };

  const result = await dynamoDocClient.send(new ScanCommand(params));
  // TODO: paginar y limitar resultados para grandes volúmenes
  return result.Items || [];
}

export async function scanIncidentesByAtendidoPor(atendidoPor) {
  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    FilterExpression: 'atendidoPor = :atendidoPor',
    ExpressionAttributeValues: {
      ':atendidoPor': atendidoPor
    }
  };

  // TODO: optimizar con nuevo GSI por atendidoPor
  const result = await dynamoDocClient.send(new ScanCommand(params));
  return result.Items || [];
}

export async function updateIncidente(id, updates) {
  const updateExpressions = [];
  const expressionAttributeNames = {};
  const expressionAttributeValues = {};

  Object.entries(updates).forEach(([key, value]) => {
    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionAttributeNames[attrName] = key;
    expressionAttributeValues[attrValue] = value;
  });

  const params = {
    TableName: env.DDB_TABLE_INCIDENTES,
    Key: { id },
    UpdateExpression: `SET ${updateExpressions.join(', ')}`,
    ExpressionAttributeNames: expressionAttributeNames,
    ExpressionAttributeValues: expressionAttributeValues,
    ReturnValues: 'ALL_NEW'
  };

  const result = await dynamoDocClient.send(new UpdateCommand(params));
  return result.Attributes;
}


