import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// Carga el .env desde la carpeta del proyecto (Ejercicio3/), sin importar
// desde dónde se ejecute "node index.js"
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(raiz, '.env') });

// Devuelve el primer valor definido entre varios nombres posibles
const env = (...nombres) => {
  for (const n of nombres) {
    if (process.env[n] !== undefined && process.env[n] !== '') return process.env[n];
  }
  return undefined;
};

const config = {
  host: env('DB_HOST', 'MYSQL_HOST') || 'localhost',
  port: Number(env('DB_PORT', 'MYSQL_PORT')) || 3306,
  user: env('DB_USER', 'MYSQL_USER') || 'root',
  password: env('DB_PASSWORD', 'DB_PASS', 'MYSQL_PASSWORD') ?? '',
  database: env('DB_NAME', 'DB_DATABASE', 'MYSQL_DATABASE'),
};

const pool = mysql.createPool({
  ...config,
  waitForConnections: true,
  connectionLimit: 10,
  decimalNumbers: true, // DECIMAL llega como número y no como string
});

// Verifica la conexión al iniciar y explica el motivo si falla
export async function verificarConexion() {
  if (!config.database) {
    console.error('Falta el nombre de la base de datos en .env (DB_NAME=calificaciones_db).');
    process.exit(1);
  }
  try {
    await pool.query('SELECT 1');
    console.log(`Conexión a MySQL OK (${config.user}@${config.host}:${config.port}/${config.database})`);
  } catch (e) {
    const ayudas = {
      ER_ACCESS_DENIED_ERROR: 'Usuario o contraseña incorrectos: revisá DB_USER y DB_PASSWORD en .env.',
      ER_BAD_DB_ERROR: `La base "${config.database}" no existe: ejecutá database.sql o corregí DB_NAME.`,
      ECONNREFUSED: 'MySQL no responde: iniciá el servicio o revisá DB_HOST y DB_PORT.',
      ENOTFOUND: 'No se encontró el host: revisá DB_HOST.',
    };
    console.error(`No se pudo conectar a MySQL [${e.code}]: ${e.message}`);
    if (ayudas[e.code]) console.error('→', ayudas[e.code]);
    process.exit(1);
  }
}

export default pool;