// services-websocket/handler-connect.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import jwt from 'jsonwebtoken';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const DDB_TABLE = process.env.DDB_TABLE_CONEXIONES_WS;
const JWT_SECRET = process.env.JWT_SECRET;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const token = event.queryStringParameters?.token;

  if (!token) {
    console.error('Falta token de autenticación');
    return { statusCode: 401, body: 'Token requerido' };
  }

  let payload;
  try {
    // 1. Validar el token JWT
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('Token inválido', err.message);
    return { statusCode: 401, body: 'Token inválido' };
  }

  // 2. Guardar la conexión en DynamoDB
  const command = new PutCommand({
    TableName: DDB_TABLE,
    Item: {
      connectionId: connectionId,
      userId: payload.email,
      rol: payload.rol
    }
  });

  try {
    await docClient.send(command);
    console.log(
      `Conexión registrada: ${connectionId} para usuario ${payload.email}`
    );
  } catch (err) {
    console.error('Error al guardar en DynamoDB', err);
    return { statusCode: 500, body: 'Error al registrar conexión' };
  }

  return { statusCode: 200, body: 'Conectado.' };
};


