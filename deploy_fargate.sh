#!/usr/bin/env bash
set -euo pipefail
# set -x # Descomenta esto (quita el #) para ver cada comando en detalle

# --- 1. CONFIGURACIÓN (¡Todo listo!) ---
AWS_REGION="us-east-1"
STACK_NAME="alerta-utec-fargate"
REPO_NAME="alerta-utec-backend"
IMAGE_TAG="latest"

# Datos de Red (Recolectados)
VPC_ID="vpc-01ca41df3938a43d0"
SUBNET_IDS="subnet-07faeabfbd92cf773,subnet-043b0ddb38c8c44b4,subnet-0fb755b639e662042,subnet-0c52b65256305a50b,subnet-09ee1cd3fefabaa26,subnet-09cd3086124d184b4"
SECURITY_GROUP="sg-0a1b5b40b49d1e6e0"

# ARN del Rol (El que SÍ funciona)
LAB_ROLE_ARN="arn:aws:iam::263323339622:role/LabRole"

# Variables de Entorno (Tomadas de tu .env)
JWT_SECRET="mi-secreto-para-la-hackathon-utec-2025-es-increible"
AIRFLOW_API_URL="http://alerta-utec-airflow-alb-1231101991.us-east-1.elb.amazonaws.com:8081/api/v1"
WS_API_URL="wss://ufs7epfg85.execute-api.us-east-1.amazonaws.com/dev"
WS_API_REGION="us-east-1"
AIRFLOW_AUTH_TOKEN="YWlyZmxvdzphaXJmbG93"
REG_CODE_TRABAJADOR="UTEC-STAFF-2025"
REG_CODE_SUPERVISOR="UTEC-ADMIN-SUPER-SECRET"

# --- 2. SCRIPT DE DESPLIEGUE ---

echo "[1/7] Obteniendo ID de Cuenta de AWS..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"
echo "ECR URI: ${ECR_URI}"

echo "[2/7] Creando repositorio ECR (o ignorando si ya existe)..."
aws ecr create-repository --repository-name "${REPO_NAME}" --region "${AWS_REGION}" || true

echo "[3/7] Iniciando sesión de Docker en ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

echo "[4Z/7] Construyendo imagen de Docker (esto puede tardar)..."
docker build -t "${REPO_NAME}:${IMAGE_TAG}" .

echo "[5/7] Etiquetando y subiendo imagen a ECR..."
docker tag "${REPO_NAME}:${IMAGE_TAG}" "${ECR_URI}:${IMAGE_TAG}"
docker push "${ECR_URI}:${IMAGE_TAG}"
echo "¡Imagen subida!"

echo "[6/7] Desplegando Stack de Fargate (esto es lo que más tarda)..."
aws cloudformation deploy \
  --template-file fargate-stack.yml \
  --stack-name "${STACK_NAME}" \
  --capabilities CAPABILITY_IAM \
  --region "${AWS_REGION}" \
  --parameter-overrides \
    VpcId="${VPC_ID}" \
    SubnetIds="${SUBNET_IDS}" \
    SecurityGroupId="${SECURITY_GROUP}" \
    ImageUri="${ECR_URI}:${IMAGE_TAG}" \
    TaskRoleArn="${LAB_ROLE_ARN}" \
    ExecutionRoleArn="${LAB_ROLE_ARN}" \
    JwtSecret="${JWT_SECRET}" \
    AirflowApiUrl="${AIRFLOW_API_URL}" \
    WsApiUrl="${WS_API_URL}" \
    WsApiRegion="${WS_API_REGION}" \
    AirflowAuthToken="${AIRFLOW_AUTH_TOKEN}" \
    RegCodeTrabajador="${REG_CODE_TRABAJADOR}" \
    RegCodeSupervisor="${REG_CODE_SUPERVISOR}"

echo "[7/7] ¡Éxito! Obteniendo la URL de tu nuevo servicio..."
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='ALBDNS'].OutputValue" \
  --output text