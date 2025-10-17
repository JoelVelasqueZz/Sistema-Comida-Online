const { Pool } = require('pg');
require('dotenv').config();

console.log('Intentando conectar a PostgreSQL...');
console.log('Configuración:');
console.log('   - User: postgres');
console.log('   - Host: localhost');
console.log('   - Database: SistemaComida');
console.log('   - Port: 5432');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'SistemaComida',
  password: '1234',
  port: 5432,
});

// Test de conexión inmediato
pool.connect((err, client, release) => {
  if (err) {
    console.error('ERROR AL CONECTAR A POSTGRESQL:');
    console.error('   Mensaje:', err.message);
    console.error('   Código:', err.code);
    console.error('');
    console.error('Posibles soluciones:');
    console.error('   1. Verifica que PostgreSQL esté corriendo (services.msc)');
    console.error('   2. Verifica la contraseña en el .env (debe ser: 1234)');
    console.error('   3. Verifica que la BD "SistemaComida" exista en pgAdmin');
    console.error('');
  } else {
    console.log('✅ CONECTADO A POSTGRESQL EXITOSAMENTE');
    console.log('   Base de datos: SistemaComida');
    console.log('');
    release();
  }
});

pool.on('error', (err) => {
  console.error('Error inesperado en PostgreSQL:', err);
});

module.exports = pool;