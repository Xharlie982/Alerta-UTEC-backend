// src/server.js
import { env } from './config/env.js';
import app from './app.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  console.log(`AlertaUTEC backend escuchando en puerto ${PORT}`);
});


