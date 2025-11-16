# AlertaUTEC Backend

Backend para el proyecto **AlertaUTEC**, una plataforma para reporte y gestión de incidentes en UTEC.

## Stack

- Node.js 20+
- Express
- Amazon DynamoDB (AWS SDK v3)
- JWT (`jsonwebtoken`)
- Hash de contraseñas con `bcryptjs`

## Requisitos

- Node.js 20 o superior
- Credenciales de AWS configuradas (por ejemplo, variables de entorno o `~/.aws/credentials`)
- Acceso a las tablas DynamoDB definidas en `.env`

## Estructura del proyecto

```text
.
├─ Dockerfile
├─ package-lock.json
├─ package.json
├─ README.md
├─ serverless.yml
├─ .gitignore
└─ src/
   ├─ server.js
   ├─ app.js
   ├─ config/
   │  ├─ env.js
   │  └─ dynamoClient.js
   ├─ middleware/
   │  ├─ authMiddleware.js
   │  ├─ requireRole.js
   │  └─ errorHandler.js
   ├─ routes/
   │  ├─ auth.routes.js
   │  └─ incidentes.routes.js
   ├─ controllers/
   │  ├─ authController.js
   │  └─ incidentesController.js
   ├─ services/
   │  ├─ authService.js
   │  ├─ incidentesService.js
   │  ├─ historialService.js
   │  ├─ airflowService.js
   │  └─ websocketNotifyService.js
   ├─ repositories/
   │  ├─ usuariosRepository.js
   │  ├─ incidentesRepository.js
   │  └─ historialRepository.js
   └─ utils/
      ├─ jwt.js
      ├─ roles.js
      ├─ time.js
      └─ errors.js
```

## Configuración

1. Instalar dependencias:

   ```bash
   npm install
   ```

2. Crear un archivo `.env` en la raíz del proyecto con al menos estas variables:

   ```bash
   PORT=8080
   NODE_ENV=development
   AWS_REGION=us-east-1

   JWT_SECRET=CAMBIA_ESTE_SECRETO

   DDB_TABLE_USUARIOS=AlertaUTEC_Usuarios
   DDB_TABLE_INCIDENTES=AlertaUTEC_Incidentes
   DDB_TABLE_HISTORIAL=AlertaUTEC_Historial
   DDB_TABLE_CONEXIONES_WS=AlertaUTEC_ConexionesWS

   AIRFLOW_API_URL=http://airflow-service.internal/api
   WS_API_GATEWAY_URL=https://xxxxxx.execute-api.region.amazonaws.com/prod
   WS_API_REGION=us-east-1
   ```

3. Asegúrate de que las tablas DynamoDB existen con esos nombres.

## Ejecutar en local

- Modo desarrollo (con reinicio automático):

  ```bash
  npm run dev
  ```

- Modo producción:

  ```bash
  npm start
  ```

El servidor se levantará en `http://localhost:${PORT}` (por defecto `8080`).

## Endpoints principales

### Auth

- **POST** `/auth/login` (público)

  Body:

  ```json
  {
    "email": "usuario@utec.edu.pe",
    "password": "mypassword123"
  }
  ```

  Respuesta exitosa:

  ```json
  {
    "token": "<JWT>",
    "usuario": {
      "email": "usuario@utec.edu.pe",
      "rol": "usuario",
      "nombre": "Nombre Apellido"
    }
  }
  ```

### Incidentes

> Todos requieren `Authorization: Bearer <token>`.

- **POST** `/incidentes` (rol `usuario`): crear incidente.
- **GET** `/incidentes` (roles `usuario`, `trabajador`, `supervisor`): listar incidentes según rol.
- **PATCH** `/incidentes/:id/asignar` (rol `trabajador`): asignar incidente y marcarlo `en_atencion`.
- **PATCH** `/incidentes/:id/resolver` (rol `trabajador`): marcar incidente como `resuelto`.
- **GET** `/incidentes/:id/historial` (roles `usuario`, `trabajador`, `supervisor`):
  - `usuario`: solo puede ver historial de incidentes reportados por él.
  - `trabajador` / `supervisor`: pueden ver historial de cualquier incidente.

## Roles

- `usuario`: reporta incidentes y ve solo los suyos.
- `trabajador`: ve incidentes pendientes + los asignados a él, puede asignar y resolver.
- `supervisor`: puede ver todos los incidentes.

## Notas sobre tiempo real y Airflow

- **Fase 2 (WebSocket)**: `websocketNotifyService` contiene stubs que solo hacen `console.log`. En el futuro se integrará con **Amazon API Gateway WebSocket** y `ApiGatewayManagementApi`, usando la tabla `DDB_TABLE_CONEXIONES_WS`.
- **Fase 3 (Airflow)**: `airflowService` contiene un stub que solo hace `console.log`. En el futuro llamará al DAG `clasificar_y_notificar` en Airflow vía HTTP usando `AIRFLOW_API_URL`.