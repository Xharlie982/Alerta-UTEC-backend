# Usamos la imagen oficial de Airflow del Taller 1
FROM apache/airflow:2.10.3

# Instalar las librerías Python para AWS (S3) y Postgres
USER airflow
RUN pip install --no-cache-dir \
    "apache-airflow-providers-amazon" \
    "apache-airflow-providers-postgres" \
    "psycopg2-binary"