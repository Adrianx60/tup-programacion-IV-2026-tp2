import 'dotenv/config';
import mysql from 'mysql2/promise';

// Todas las credenciales salen del archivo .env (nada hardcodeado)
const requeridas = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const faltantes = requeridas.filter((k) => process.env[k] === undefined);
if (faltantes.length > 0) {
  console.error(`Faltan variables en el archivo .env: ${faltantes.join(', ')}`);
  process.exit(1);
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Prueba de conexión para evitar que falle en silencio
try {
  const connection = await pool.getConnection();
  console.log('¡Conexión exitosa a la base de datos MySQL!');
  connection.release();
} catch (error) {
  console.error('Error al conectar con la base de datos:', error.message);
}

export default pool;