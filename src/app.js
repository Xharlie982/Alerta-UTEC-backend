// src/app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/auth.routes.js';
import incidentesRoutes from './routes/incidentes.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());

if (env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Healthcheck simple
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas
app.use('/auth', authRoutes);
app.use('/incidentes', incidentesRoutes);

// 404 para rutas no encontradas
app.use((req, res, next) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

// Middleware global de errores
app.use(errorHandler);

export default app;


