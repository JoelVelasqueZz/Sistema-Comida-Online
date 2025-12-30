const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const twoFactorRoutes = require('./routes/twoFactorRoutes');
const totpRoutes = require('./routes/totpRoutes');
const passwordResetRoutes = require('./routes/passwordResetRoutes');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logging de requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await pool.query('SELECT 1');
    res.json({ 
      status: 'OK', 
      service: 'Auth Service',
      database: 'Connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      service: 'Auth Service',
      database: 'Disconnected',
      error: error.message 
    });
  }
});

// ============================================
// RUTAS
// ============================================
app.use('/api/auth', authRoutes);
app.use('/api/auth/2fa', twoFactorRoutes);
app.use('/api/auth/totp', totpRoutes);
app.use('/api/auth/password-reset', passwordResetRoutes);
app.use('/api/users', userRoutes);

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

// ============================================
// INICIAR SERVIDOR (solo después de conectar a BD)
// ============================================
const startServer = async () => {
  try {
    // 1. PRIMERO: Verificar conexión a PostgreSQL
    console.log('🔄 Verificando conexión a PostgreSQL...');
    await pool.query('SELECT NOW()');
    console.log('✅ CONECTADO A POSTGRESQL EXITOSAMENTE');

    // 2. LUEGO: Iniciar servidor
    app.listen(PORT, () => {
      console.log('');
      console.log('════════════════════════════════════════');
      console.log('🚀 AUTH SERVICE INICIADO CORRECTAMENTE');
      console.log('════════════════════════════════════════');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💾 Database: ${process.env.DATABASE_URL.split('@')[1]}`);
      console.log('════════════════════════════════════════');
      console.log('');
    });
  } catch (error) {
    console.error('❌ ERROR AL INICIAR SERVIDOR:', error);
    console.error('❌ No se pudo conectar a PostgreSQL');
    process.exit(1);
  }
};

// Iniciar servidor
startServer();

// Manejo de shutdown graceful
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});