// src/config/dynamoClient.js
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { env } from './env.js';

const client = new DynamoDBClient({
  region: env.AWS_REGION
});

const marshallOptions = {
  removeUndefinedValues: true,
  convertEmptyValues: true
};

const unmarshallOptions = {};

export const dynamoDocClient = DynamoDBDocumentClient.from(client, {
  marshallOptions,
  unmarshallOptions
});


