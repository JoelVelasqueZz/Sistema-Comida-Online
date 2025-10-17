const { Pool } = require('pg');
require('dotenv').config();

console.log('Intentando conectar a PostgreSQL...');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SistemaComida',
  password: '1234',
  port: 5432,
});

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error al conectar a PostgreSQL:', err.message);
  } else {
    console.log('Conectado a PostgreSQL');
    release();
  }
});

pool.on('error', (err) => {
  console.error('Error en PostgreSQL:', err);
});

module.exports = pool;