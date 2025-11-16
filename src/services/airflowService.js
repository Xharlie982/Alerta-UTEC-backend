// src/services/airflowService.js
import { env } from '../config/env.js';

export async function triggerClasificarYNotificar(idIncidente) {
  // Stub Fase 3: integración futura con Airflow
  console.log(
    '[Airflow STUB] Trigger clasificar_y_notificar para incidente',
    idIncidente,
    'via',
    `${env.AIRFLOW_API_URL}/dags/clasificar_y_notificar/dagRuns`
  );

  // TODO: En Fase 3, realizar llamada HTTP POST a Airflow, por ejemplo:
  // await fetch(`${env.AIRFLOW_API_URL}/dags/clasificar_y_notificar/dagRuns`, {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({ conf: { idIncidente } }),
  // });
}


