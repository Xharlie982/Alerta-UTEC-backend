# Usamos la imagen oficial de Airflow
FROM apache/airflow:2.10.3

# Cambiamos a root para instalar dependencias y copiar archivos
USER root

# Instalar librerías del sistema si fueran necesarias (opcional)
# RUN apt-get update && apt-get install -y ...

# Copiamos el DAG dentro de la imagen
COPY clasificar_incidente_dag.py /opt/airflow/dags/clasificar_incidente_dag.py

# Cambiamos al usuario airflow para instalar paquetes de Python
USER airflow
RUN pip install --no-cache-dir \
    "apache-airflow-providers-amazon" \
    "apache-airflow-providers-postgres" \
    "psycopg2-binary"