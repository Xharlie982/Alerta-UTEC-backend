from __future__ import annotations
import pendulum
from airflow.decorators import dag, task

@dag(
    dag_id="clasificar_incidente",
    schedule=None,
    start_date=pendulum.datetime(2024, 1, 1, tz="UTC"),
    catchup=False,
    tags=["alerta_utec", "clasificacion"],
)
def clasificar_incidente_dag():
    
    @task
    def clasificar(dag_run=None, **kwargs):
        
        incidente_id = dag_run.conf.get("incidente_id")
        
        if not incidente_id:
            print("ERROR: No se recibió incidente_id en la configuración.")
            raise ValueError("Falta el incidente_id en la configuración del DAG")

        print(f"--- ¡Iniciando clasificación para el incidente: {incidente_id}! ---")
        
        # Aquí puedes añadir la lógica de SNS
        print(f"...(Simulando lógica de clasificación para {incidente_id})...")
        print(f"--- ¡Clasificación completada para: {incidente_id}! ---")
        return incidente_id

    clasificar()

clasificar_incidente_dag()