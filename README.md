# AlertaUTEC Backend - Piglets

Este repositorio contiene el backend de microservicios para la plataforma AlertaUTEC. La solución es elástica, segura y serverless, con gestión de incidentes en tiempo real.

Estado del Proyecto: Completado y Desplegado.

## 🚀 Arquitectura Final (ECS Fargate + Serverless)

La arquitectura es una solución híbrida que cumple con los requisitos de escalabilidad y utiliza los siguientes servicios de AWS:

| Componente | Servicio AWS | Despliegue | Responsabilidad |
| :--- | :--- | :--- | :--- |
| Backend API | ECS Fargate | Contenedor Node.js | Autenticación, Lógica de Negocio, Disparo de WebSockets/Airflow. |
| Base de Datos | DynamoDB | Serverless | Almacenamiento de Incidentes, Usuarios, Historial y ConexionesWS. |
| Tiempo Real | API Gateway WS + Lambda | Serverless | Gestión y envío de notificaciones instantáneas (PostToConnection). |
| Orquestación | Apache Airflow | Docker en EC2 | Clasificación automática y avisos a áreas responsables. |

## 🌎 URLs de acceso y pruebas

| Servicio | Tipo | URL | Credenciales / Uso |
| :--- | :--- | :--- | :--- |
| Backend API (Fargate) | HTTP | `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com` | Login, Reporte, Trazabilidad. |
| WebSocket | WSS | `wss://ufs7epfg85.execute-api.us-east-1.amazonaws.com/dev` | Usado por el Frontend. |
| Airflow UI | HTTP | `http://3.236.149.2:8081` | Usuario/Contraseña: `airflow` / `airflow`. |

## 🔗 Endpoints de API

URL Base de la API (Fargate): `http://alerta-utec-alb-1269448375.us-east-1.elb.amazonaws.com`

### Autenticación y Registro (Rutas Públicas)

| Endpoint | Método | Rol | Requisito | Cuerpo de Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `/auth/login` | `POST` | Todos | N/A | `{"email": "usuario.demo@utec.edu.pe", "password": "password123"}` |
| `/auth/register` | `POST` | Todos | `registrationCode` para roles `trabajador` o `supervisor` | `{"email": "nuevo@utec.edu.pe", "password": "pwd", "nombre": "Nombre", "rol": "usuario"}` |

### Incidentes (Requiere `Authorization: Bearer <token>`)

| Endpoint | Método | Rol | Cuerpo/Query de Ejemplo | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `/incidentes` | `POST` | `usuario` | `{"tipo": "infraestructura", "ubicacion": "B-3", "descripcion": "Falla de luz.", "urgencia": "media"}` | Crea un incidente. Dispara Airflow y notifica por WebSocket. |
| `/incidentes` | `GET` | `usuario` `trabajador` `supervisor` | `/incidentes?estado=pendiente&tipo=seguridad` | Lista incidentes. Filtrado automático según el rol. |
| `/incidentes/:id/asignar` | `PATCH` | `trabajador` | (vacío) | Asigna el incidente al trabajador que hace la petición. Estado: `en_atencion`. |
| `/incidentes/:id/resolver` | `PATCH` | `trabajador` | (vacío) | Marca incidente como `resuelto`. Notifica al usuario reportante. |
| `/incidentes/:id/historial` | `GET` | `usuario` `trabajador` `supervisor` | (vacío) | Trazabilidad completa del incidente. |

## 🔒 Lógica de roles y seguridad

Registro seguro basado en códigos:
- Rol usuario (Estudiante): registro libre.
- Rol trabajador (Personal Administrativo): requiere código de registro.
- Rol supervisor (Autoridad): requiere código de registro.

| Rol | Email (Ejemplo) | Password (Ejemplo) | Código Secreto |
| :--- | :--- | :--- | :--- |
| Usuario | `estudiante.demo@utec.edu.pe` | `password123` | N/A |
| Trabajador | `trabajador.demo@utec.edu.pe` | `password123` | `EL_CODIGO_SECRETO_DE_TRABAJADOR` |
| Supervisor | `supervisor.demo@utec.edu.pe` | `password123` | `EL_CODIGO_SECRETO_DE_SUPERVISOR` |

Los códigos reales se gestionan mediante variables de entorno y no se publican en el repositorio.

## 🧪 Guías de prueba (Postman/Thunder Client)

Usa la URL Base de la API (Fargate) para todas las pruebas y recuerda enviar el Token en el header: `Authorization: Bearer <token>`.

### A. Disparo de Orquestación (Requisito 5)
1) Acción: `POST /incidentes` (con token JWT).  
2) Resultado: el backend llama a la API de Airflow.  
3) Verificación: el DAG `clasificar_incidente` se ejecuta en `http://3.236.149.2:8081`.

Ejemplo de body:
```json
{
  "tipo": "infraestructura",
  "ubicacion": "Pabellón B, Piso 3",
  "descripcion": "La luz del pasillo parpadea.",
  "urgencia": "media"
}
```

### B. Flujo de Tiempo Real (Requisito 3)
1) Conecta dos clientes WebSocket (uno con token de usuario, otro con token de trabajador) al endpoint WSS.  
2) Ejecuta `POST /incidentes` con el token de usuario.  
3) Verificación: el cliente de trabajador recibe `action: "nuevo_incidente"`.

### C. Registro Seguro (Requisito 1)
1) Acción: `POST /auth/register`.  
2) Verificación (éxito): registra un trabajador con el `registrationCode` correcto.  
3) Verificación (fallo): intenta registrar un supervisor sin código o con código incorrecto; la API debe responder `401 Unauthorized`.

Ejemplos:
```json
{
  "email": "trabajador.demo@utec.edu.pe",
  "password": "password123",
  "nombre": "Trabajador Demo",
  "rol": "trabajador",
  "registrationCode": "EL_CODIGO_SECRETO_DE_TRABAJADOR"
}
```
```json
{
  "email": "supervisor.demo@utec.edu.pe",
  "password": "password123",
  "nombre": "Supervisor Demo",
  "rol": "supervisor",
  "registrationCode": "EL_CODIGO_SECRETO_DE_SUPERVISOR"
}
```

## ⚙️ Guía de despliegue (completado)

El despliegue se orquesta con CloudFormation (ECS Fargate) y Serverless Framework (API WebSocket).

1) Clonar e instalar dependencias: `npm install`.  
2) Configurar credenciales de AWS Academy en `~/.aws/credentials`.  
3) Desplegar Serverless:
   - En la raíz (infra principal) y en `services-websocket/`: `sls deploy`.  
4) Desplegar Fargate:
   ```bash
   chmod +x deploy_fargate.sh
   ./deploy_fargate.sh
   ```
Este script construye la imagen Docker, la sube a ECR y crea/actualiza el Cluster, ALB y Servicio ECS.


