// src/config/env.js
import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = [
  'PORT',
  'NODE_ENV',
  'AWS_REGION',
  'JWT_SECRET',
  'DDB_TABLE_USUARIOS',
  'DDB_TABLE_INCIDENTES',
  'DDB_TABLE_HISTORIAL',
  'DDB_TABLE_CONEXIONES_WS',
  'AIRFLOW_API_URL',
  'WS_API_GATEWAY_URL',
  'WS_API_REGION',
  'AIRFLOW_AUTH_TOKEN'
];

const missing = requiredEnvVars.filter((key) => !process.env[key]);

if (missing.length > 0) {
  throw new Error(
    `Faltan variables de entorno requeridas: ${missing.join(', ')}`
  );
}

export const env = {
  PORT: Number(process.env.PORT) || 8080,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AWS_REGION: process.env.AWS_REGION,
  JWT_SECRET: process.env.JWT_SECRET,

  DDB_TABLE_USUARIOS: process.env.DDB_TABLE_USUARIOS,
  DDB_TABLE_INCIDENTES: process.env.DDB_TABLE_INCIDENTES,
  DDB_TABLE_HISTORIAL: process.env.DDB_TABLE_HISTORIAL,
  DDB_TABLE_CONEXIONES_WS: process.env.DDB_TABLE_CONEXIONES_WS,

  AIRFLOW_API_URL: process.env.AIRFLOW_API_URL,
  WS_API_GATEWAY_URL: process.env.WS_API_GATEWAY_URL,
  WS_API_REGION: process.env.WS_API_REGION,
  AIRFLOW_AUTH_TOKEN: process.env.AIRFLOW_AUTH_TOKEN,

  // Nombres de GSIs (asumimos estos nombres en la infraestructura)
  INCIDENTES_GSI_BY_ESTADO: 'IncidentesByEstado',
  INCIDENTES_GSI_BY_REPORTADO_POR: 'IncidentesByReportadoPor'
};


