// services-websocket/handler-default.js
export const handler = async (event) => {
  console.log('Ruta default/desconocida invocada', JSON.stringify(event));
  return {
    statusCode: 404,
    body: 'Acción no encontrada.'
  };
};


