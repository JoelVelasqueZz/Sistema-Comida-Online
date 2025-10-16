const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
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
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`Auth Service corriendo en http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DATABASE_URL.split('@')[1]}`);
});

// Manejo de shutdown graceful
process.on('SIGTERM', async () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});