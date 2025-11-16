# AlertaUTEC Backend (Versión Fargate)

Este es el backend para el proyecto de la hackathon **AlertaUTEC**. Provee una API RESTful para la gestión de incidentes, un endpoint de autenticación seguro y se integra con servicios de AWS para notificaciones en tiempo real y orquestación.

El backend está desplegado en **ECS Fargate** y es accesible públicamente.

**URL Base de la API (Fargate):** `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com`

---

## 🚀 Arquitectura

Este proyecto utiliza una arquitectura de microservicios híbrida desplegada en AWS:

1.  **Backend (Node.js/Express):**
    * **Despliegue:** Contenedor de Docker corriendo en **ECS Fargate**.
    * **Acceso:** Expuesto públicamente a través de un **Application Load Balancer (ALB)**.
    * **Responsabilidades:** Maneja el `login`, `register`, y toda la lógica de negocio de los incidentes.

2.  **Notificaciones en Tiempo Real (Serverless):**
    * **Servicio:** **API Gateway WebSocket** (`wss://ufs7epfg85.execute-api.us-east-1.amazonaws.com/dev`).
    * **Lógica:** 3 **AWS Lambdas** (`$connect`, `$disconnect`, `$default`) que gestionan las conexiones de los usuarios.
    * **Flujo:** El backend de Fargate envía notificaciones a esta API, que las retransmite a los clientes conectados.

3.  **Orquestación de Tareas (EC2):**
    * **Servicio:** **Apache Airflow** corriendo en una instancia EC2 (`t3.medium`) en `http://3.236.149.2:8081`.
    * **Flujo:** El backend de Fargate llama a la API REST de Airflow para disparar DAGs (como `clasificar_incidente`) después de que se crea un incidente.

4.  **Base de Datos (Serverless):**
    * **Servicio:** **Amazon DynamoDB**.
    * **Tablas:** `AlertaUTEC_Usuarios`, `AlertaUTEC_Incidentes`, `AlertaUTEC_Historial`, `AlertaUTEC_ConexionesWS`.

---

## 🛠️ Despliegue

El despliegue del backend en ECS Fargate se automatiza usando un script y una plantilla de CloudFormation.

1.  **Configurar Credenciales:** Asegurarse de que `~/.aws/credentials` tenga credenciales válidas.
2.  **Configurar Variables:** Asegurarse de que las variables en `deploy_fargate.sh` (como `VPC_ID`, `SUBNET_IDS`, etc.) sean correctas.
3.  **Ejecutar:**
    ```bash
    chmod +x deploy_fargate.sh
    ./deploy_fargate.sh
    ```
Este script construye la imagen de Docker, la sube a ECR y despliega el stack de Fargate.

---

## 📖 Guía de API y Pruebas (para TAs y Jueces)

Use Postman o cualquier cliente API para probar los siguientes endpoints.

**URL Base:** `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com`

### 1. Autenticación

#### `POST /auth/register`
Registra un nuevo usuario.

* **Rol `usuario` (Estudiante):** No necesita código.
    ```json
    {
      "email": "estudiante.demo@utec.edu.pe",
      "password": "password123",
      "nombre": "Estudiante Demo",
      "rol": "usuario"
    }
    ```
* **Rol `trabajador` (Personal Administrativo):** Requiere código de registro.
    ```json
    {
      "email": "trabajador.demo@utec.edu.pe",
      "password": "password123",
      "nombre": "Trabajador Demo",
      "rol": "trabajador",
      "registrationCode": "EL_CODIGO_SECRETO_DE_TRABAJADOR"
    }
    ```
* **Rol `supervisor` (Autoridad):** Requiere código de registro.
    ```json
    {
      "email": "supervisor.demo@utec.edu.pe",
      "password": "password123",
      "nombre": "Supervisor Demo",
      "rol": "supervisor",
      "registrationCode": "EL_CODIGO_SECRETO_DE_SUPERVISOR"
    }
    ```
* **Respuesta Exitosa (201):**
    ```json
    {
      "token": "eyJhbGciOi...",
      "usuario": { ... }
    }
    ```

#### `POST /auth/login`
Inicia sesión y obtiene un token JWT.

* **Body:**
    ```json
    {
      "email": "estudiante.demo@utec.edu.pe",
      "password": "password123"
    }
    ```
* **Respuesta Exitosa (200):**
    ```json
    {
      "token": "eyJhbGciOi...",
      "usuario": { ... }
    }
    ```

### 2. Incidentes (Requiere Token)

**¡Recuerda poner el Token JWT en la cabecera `Authorization: Bearer <token>`!**

#### `POST /incidentes`
* **Rol Requerido:** `usuario`
* **Descripción:** Crea un nuevo reporte de incidente. Dispara notificaciones a WebSockets y a Airflow.
* **Body:**
    ```json
    {
      "tipo": "infraestructura",
      "ubicacion": "Pabellón B, Piso 3",
      "descripcion": "La luz del pasillo parpadea.",
      "urgencia": "media"
    }
    ```
* **Respuesta Exitosa (201):** El objeto del incidente creado.

#### `GET /incidentes`
* **Rol Requerido:** `usuario`, `trabajador`, `supervisor`
* **Descripción:** Lista incidentes.
    * Si eres `usuario`, solo ves tus propios reportes.
    * Si eres `trabajador`, ves todos los "pendientes" y los que te asignaste.
    * Si eres `supervisor`, ves todo.
* **Respuesta Exitosa (200):** `[ ...lista de incidentes... ]`

#### `PATCH /incidentes/:id/resolver`
* **Rol Requerido:** `trabajador`
* **Descripción:** Marca un incidente como "resuelto". Dispara una notificación de actualización al `usuario` que lo reportó.
* **Body:** (Vacío)
* **Respuesta Exitosa (200):** El objeto del incidente actualizado.

#### `GET /incidentes/:id/historial`
* **Rol Requerido:** `usuario`, `trabajador`, `supervisor`
* **Descripción:** Muestra el historial completo de un incidente (creado, asignado, resuelto).
* **Respuesta Exitosa (200):** `[ ...lista de eventos del historial... ]`

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