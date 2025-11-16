#!/usr/bin/env bash
set -euo pipefail
# set -x # Descomenta para depurar

echo "--- Iniciando Despliegue de Airflow en Fargate ---"

# --- 1. CONFIGURACIÓN ---
AWS_REGION="us-east-1"
STACK_NAME="alerta-utec-airflow-stack"
REPO_NAME="alerta-utec-airflow"

# ¡Nombre de bucket único con tu prefijo!
S3_BUCKET_NAME="piglets-airflow-dags-utec-2025"

# --- Rutas a los nuevos archivos ---
SCRIPT_DIR="airflow-deployment"
DAG_FILE="${SCRIPT_DIR}/clasificar_incidente_dag.py"
DOCKERFILE="${SCRIPT_DIR}/airflow.Dockerfile"
STACK_FILE="${SCRIPT_DIR}/airflow-fargate-stack.yml"

# --- Reutilizamos la configuración de red del backend ---
echo "[1/7] Extrayendo configuración de red de deploy_fargate.sh..."
VPC_ID=$(grep -oP 'VPC_ID="\K[^"]+' deploy_fargate.sh)
SUBNET_IDS=$(grep -oP 'SUBNET_IDS="\K[^"]+' deploy_fargate.sh)
SECURITY_GROUP=$(grep -oP 'SECURITY_GROUP="\K[^"]+' deploy_fargate.sh)
LAB_ROLE_ARN=$(grep -oP 'LAB_ROLE_ARN="\K[^"]+' deploy_fargate.sh)

if [ -z "$VPC_ID" ] || [ -z "$SUBNET_IDS" ]; then
  echo "ERROR: No se pudieron encontrar VPC_ID o SUBNET_IDS en deploy_fargate.sh"
  exit 1
fi
echo "VPC, Subnets, y Security Group cargados."

# --- 2. PREPARAR S3 ---
echo "[2/7] Creando bucket S3 ($S3_BUCKET_NAME)..."
aws s3 mb "s3://${S3_BUCKET_NAME}" --region "${AWS_REGION}" || echo "Bucket S3 ya existe, continuando."

echo "[3/7] Subiendo DAG a S3..."
aws s3 cp "${DAG_FILE}" "s3://${S3_BUCKET_NAME}/dags/"
S3_DAGS_PATH="s3://${S3_BUCKET_NAME}/dags"

# --- 3. PREPARAR ECR ---
echo "[4/7] Construyendo y subiendo imagen de Airflow a ECR..."
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_URI="${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com/${REPO_NAME}"

aws ecr create-repository --repository-name "${REPO_NAME}" --region "${AWS_REGION}" || true
aws ecr get-login-password --region "${AWS_REGION}" | docker login --username AWS --password-stdin "${ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Usamos el Dockerfile específico de Airflow
docker build -t "${REPO_NAME}:latest" -f "${DOCKERFILE}" .
docker tag "${REPO_NAME}:latest" "${ECR_URI}:latest"
docker push "${ECR_URI}:latest"
echo "Imagen ECR lista: ${ECR_URI}:latest"

# --- 4. DESPLEGAR STACK DE CLOUDFORMATION ---
echo "[5/7] Desplegando Stack de Fargate... (Esto puede tardar ~10-15 minutos)"
aws cloudformation deploy \
  --template-file "${STACK_FILE}" \
  --stack-name "${STACK_NAME}" \
  --capabilities CAPABILITY_IAM \
  --region "${AWS_REGION}" \
  --parameter-overrides \
    VpcId="${VPC_ID}" \
    SubnetIds="${SUBNET_IDS}" \
    SecurityGroupId="${SECURITY_GROUP}" \
    TaskRoleArn="${LAB_ROLE_ARN}" \
    ExecutionRoleArn="${LAB_ROLE_ARN}" \
    ImageUri="${ECR_URI}:latest" \
    S3DagsPath="${S3_DAGS_PATH}"

echo "[6/7] ¡Éxito! Obteniendo la nueva URL de Airflow..."
AIRFLOW_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --region "${AWS_REGION}" \
  --query "Stacks[0].Outputs[?OutputKey=='AirflowALBDNS'].OutputValue" \
  --output text)

echo "[7/7] --- ¡Despliegue de Airflow Completado! ---"
echo "La UI y API de tu Airflow en Fargate está en:"
echo "http://${AIRFLOW_URL}:8081"
echo ""
echo "--- ACCIÓN REQUERIDA (PASO FINAL) ---"
echo "Copia la URL de arriba (ej: http://${AIRFLOW_URL}:8081/api/v1)"
echo "Y pégala en la variable 'AIRFLOW_API_URL' de tu archivo 'deploy_fargate.sh' (el del backend)."
echo "Luego, ejecuta './deploy_fargate.sh' una última vez para conectar tu backend al nuevo Airflow."