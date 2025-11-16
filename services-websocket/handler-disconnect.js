// services-websocket/handler-disconnect.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, DeleteCommand } from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

const DDB_TABLE = process.env.DDB_TABLE_CONEXIONES_WS;

export const handler = async (event) => {
  const connectionId = event.requestContext.connectionId;

  const command = new DeleteCommand({
    TableName: DDB_TABLE,
    Key: {
      connectionId: connectionId
    }
  });

  try {
    await docClient.send(command);
    console.log(`Conexión eliminada: ${connectionId}`);
  } catch (err) {
    console.error('Error al eliminar de DynamoDB', err);
    return { statusCode: 500, body: 'Error al desconectar' };
  }

  return { statusCode: 200, body: 'Desconectado.' };
};


