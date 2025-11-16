
// src/services/airflowService.js
import { env } from '../config/env.js';

const DAG_ID = 'clasificar_incidente'; // El DAG que queremos disparar
const AIRFLOW_URL = `${env.AIRFLOW_API_URL}/dags/${DAG_ID}/dagRuns`;
const AIRFLOW_AUTH_HEADER = `Basic ${env.AIRFLOW_AUTH_TOKEN}`;

/**
 * Dispara un DAG en Airflow para clasificar un nuevo incidente.
 * Se ejecuta de forma asíncrona (fire-and-forget) para no bloquear la API.
 * @param {string} idIncidente El ID del incidente a clasificar.
 */
export async function triggerClasificarYNotificar(idIncidente) {
  console.log(
    `[Airflow] Disparando DAG ${DAG_ID} para incidente ${idIncidente}`
  );

  try {
    // Usamos fetch (nativo en Node 20)
    const response = await fetch(AIRFLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: AIRFLOW_AUTH_HEADER
      },
      body: JSON.stringify({
        // Pasamos el ID del incidente en la configuración del DAG
        conf: {
          incidente_id: idIncidente
        }
      })
    });

    if (!response.ok) {
      // Si falla, solo logueamos el error, no detenemos la API
      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = await response.text();
      }
      console.error(
        `[Airflow] Error al disparar DAG: ${response.status}`,
        typeof errorBody === 'string'
          ? errorBody
          : JSON.stringify(errorBody, null, 2)
      );
    } else {
      const data = await response.json();
      console.log(
        `[Airflow] DAG disparado exitosamente. Run ID: ${data.dag_run_id}`
      );
    }
  } catch (err) {
    // Error de red (ej. Airflow está caído)
    console.error(
      '[Airflow] Error de red al contactar Airflow:',
      err.message
    );
  }
}

