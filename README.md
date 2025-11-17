# 🚨 AlertaUTEC Backend - Piglets

Este repositorio contiene el backend de microservicios para la plataforma **AlertaUTEC**. Es una solución integral para el reporte, monitoreo y orquestación de incidentes dentro del campus universitario, diseñada bajo una arquitectura **Cloud-Native, Elástica y 100% Serverless** en AWS.

**Estado del Proyecto:** Completado y Desplegado 🚀

---

## 🏗️ Arquitectura Final (ECS Fargate + Serverless)

La arquitectura es una solución híbrida que cumple con los requisitos de escalabilidad y utiliza los siguientes servicios de AWS:

| Componente | Servicio AWS | Despliegue | Responsabilidad |
| :--- | :--- | :--- | :--- |
| **Backend API** | **ECS Fargate** | Contenedor Node.js | Autenticación, Lógica de Negocio, Disparo de WebSockets/Airflow. |
| **Orquestación** | **ECS Fargate** | Cluster Airflow (6 Contenedores) | Clasificación automática de incidentes y gestión de flujos. |
| **Base de Datos** | **DynamoDB** | Serverless | Almacenamiento de Incidentes, Usuarios, Historial y ConexionesWS. |
| **Tiempo Real** | **API Gateway + Lambda** | Serverless | Gestión de WebSockets para notificaciones instantáneas en frontend. |

---

## 📜 Historia de la Migración: De EC2 a Fargate

Uno de los mayores desafíos técnicos de este proyecto fue lograr una arquitectura verdaderamente serverless para el componente de orquestación (Airflow), dadas las restricciones de AWS Academy.

1.  **Fase Inicial (IaaS):** Originalmente, desplegamos Airflow en una máquina virtual **EC2 (t2.large)**. El backend en Fargate se comunicaba con esta VM. Aunque funcional, esto presentaba un "punto único de fallo" y no era serverless.
2.  **El Desafío:** Intentamos usar *Amazon MWAA* (Managed Airflow), pero estaba bloqueado en el laboratorio.
3.  **La Solución (Containerización Total):** Diseñamos una arquitectura personalizada en **ECS Fargate**.
    * Creamos una "Tarea Multi-Contenedor" compleja que ejecuta 6 servicios en paralelo: Postgres (metadata), Redis (cola), Airflow Webserver, Scheduler, Worker e Init.
    * Asignamos 8GB de RAM y 2 vCPU para soportar la carga.
    * Implementamos *Health Checks* personalizados para orquestar el orden de arranque (Postgres primero, luego Airflow).
4.  **Resultado:** Eliminamos la dependencia de la EC2. Ahora todo el sistema escala y se gestiona como contenedores serverless.

---

## 🌎 URLs de Acceso y Pruebas

Estas son las URLs activas del despliegue actual:

| Servicio | Tipo | URL | Credenciales / Uso |
| :--- | :--- | :--- | :--- |
| **Backend API** | HTTP | `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com` | Login, Reporte, Trazabilidad. |
| **Airflow UI** | HTTP | `http://alerta-utec-airflow-alb-1231101991.us-east-1.elb.amazonaws.com:8081` | User: `airflow` / Pass: `airflow` |
| **WebSocket** | WSS | `wss://ufs7epfg85.execute-api.us-east-1.amazonaws.com/dev` | Usado por el Frontend. |

---

## 📂 Guía de Infraestructura (IaC)

Este proyecto utiliza **Infraestructura como Código** para desplegar todos sus componentes de manera automatizada.

### Raíz del Proyecto
* **`deploy_fargate.sh`**: Script maestro para desplegar el Backend. Construye la imagen Docker de Node.js, la sube a ECR y actualiza el stack de CloudFormation en Fargate.
* **`fargate-stack.yml`**: Plantilla CloudFormation del Backend. Define la Tarea ECS, Servicio, ALB y variables de entorno.
* **`serverless.yml`**: Define y despliega las tablas de **DynamoDB** (`Usuarios`, `Incidentes`, `Historial`, `ConexionesWS`).

### Carpeta `airflow-deployment/`
* **`deploy_airflow_fargate.sh`**: Script maestro para desplegar Airflow. Gestiona el bucket S3 (para artefactos), construye la imagen personalizada y despliega el stack en Fargate.
* **`airflow-fargate-stack.yml`**: Define la Tarea Fargate de Airflow. Aquí está la lógica compleja de los 6 contenedores y los volúmenes efímeros.
* **`airflow.Dockerfile`**: Imagen personalizada que inyecta el código del DAG y las librerías necesarias (`aws-providers`, `postgres`).
* **`clasificar_incidente_dag.py`**: El código Python del flujo de trabajo que clasifica los incidentes recibidos.

### Carpeta `services-websocket/`
* **`serverless.yml`**: Configuración para desplegar la API WebSocket y sus funciones Lambda (`connect`, `disconnect`, `default`) que gestionan las conexiones en tiempo real.

---

## 🔐 Seguridad y Roles

El sistema implementa registro seguro basado en códigos secretos y JWT.

| Rol | Email (Ejemplo) | Password | Código Secreto (Para Registro) |
| :--- | :--- | :--- | :--- |
| **Usuario** | `estudiante.demo@utec.edu.pe` | `password123` | N/A |
| **Trabajador** | `trabajador.demo@utec.edu.pe` | `password123` | `UTEC-STAFF-2025` |
| **Supervisor** | `supervisor.demo@utec.edu.pe` | `password123` | `UTEC-ADMIN-SUPER-SECRET` |

---

## 🔗 Endpoints de API

**URL Base:** `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com`

### Autenticación (Público)

| Endpoint | Método | Descripción | Cuerpo Ejemplo |
| :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Iniciar sesión | `{"email": "...", "password": "..."}` |
| `/auth/register` | `POST` | Registrar usuario | `{"email": "...", "password": "...", "nombre": "...", "rol": "...", "registrationCode": "..."}` |

### Incidentes (Requiere `Authorization: Bearer <token>`)

| Endpoint | Método | Rol | Descripción |
| :--- | :--- | :--- | :--- |
| `/incidentes` | `POST` | `usuario` | Crea incidente. Dispara Airflow y WebSocket. |
| `/incidentes` | `GET` | Todos | Lista incidentes (filtrado por rol). |
| `/incidentes/:id/asignar` | `PATCH` | `trabajador` | Asigna el incidente al trabajador. |
| `/incidentes/:id/resolver` | `PATCH` | `trabajador` | Marca como `resuelto`. |
| `/incidentes/:id/historial` | `GET` | Todos | Muestra la trazabilidad completa (Req. 7). |

---

## 🧪 Guía de Pruebas (Postman)

### A. Disparo de Orquestación (Requisito 5)
1.  Acción: `POST /incidentes` (con token de usuario).
    ```json
    {
      "tipo": "seguridad",
      "ubicacion": "Sótano 2",
      "descripcion": "Prueba de integración Fargate.",
      "urgencia": "alta"
    }
    ```
2.  **Verificación:**
    * Postman devuelve `201 Created`.
    * En la **UI de Airflow**, el DAG `clasificar_incidente` muestra un círculo verde (Success).

### B. Flujo de Tiempo Real (Requisito 3)
1.  Conecta un cliente WebSocket a la URL WSS.
2.  Crea un incidente mediante la API REST.
3.  **Verificación:** El cliente WebSocket recibe instantáneamente un mensaje JSON `action: "nuevo_incidente"`.

### C. Historial y Trazabilidad (Requisito 7)
1.  Acción: `GET /incidentes/:id/historial` (usando el ID generado).
2.  **Verificación:** Recibes un array con todos los eventos (CREADO, ASIGNADO, RESUELTO) con fecha y responsable.

---

## ⚙️ Proceso de Despliegue Realizado

1.  **Dependencias:** `npm install`.
2.  **Base de Datos:** `sls deploy` (Crea tablas DynamoDB).
3.  **WebSockets:** `cd services-websocket && sls deploy`.
4.  **Airflow (Fargate):** `./deploy_airflow_fargate.sh` (Construye imagen, sube a ECR, despliega stack complejo en ECS).
    * *Nota:* Requiere una máquina con al menos 4GB de RAM para construir la imagen Docker (usamos una `t3.large` temporal).
5.  **Backend (Fargate):** `./deploy_fargate.sh` (Conecta el backend con la URL de Airflow generada).