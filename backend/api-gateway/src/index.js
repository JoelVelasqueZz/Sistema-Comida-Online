const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
require('dotenv').config();

const authMiddleware = require('./middlewares/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet - Protección de headers HTTP
app.use(helmet());

// CORS - Permitir requests desde el frontend
app.use(cors({
  origin: 'http://localhost:5173', // URL de tu frontend React
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Prevenir ataques DDoS
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // límite de 100 requests por IP
  message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.'
});
app.use(limiter);

// Parser de JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================
// LOGGING DE REQUESTS
// ============================================
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Gateway',
    timestamp: new Date().toISOString() 
  });
});

// ============================================
// PROXY A MICROSERVICIOS
// ============================================

// AUTH SERVICE - Rutas públicas (sin autenticación)
app.use('/api/auth', createProxyMiddleware({
  target: process.env.AUTH_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/auth': '/api/auth'
  },
  onError: (err, req, res) => {
    console.error('Error en Auth Service:', err.message);
    res.status(503).json({ error: 'Auth Service no disponible' });
  }
}));

// MENU SERVICE - Rutas públicas
app.use('/api/menu', createProxyMiddleware({
  target: process.env.MENU_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/menu': '/api/menu'
  },
  onError: (err, req, res) => {
    console.error('Error en Menu Service:', err.message);
    res.status(503).json({ error: 'Menu Service no disponible' });
  }
}));

// ORDER SERVICE - Rutas protegidas (requieren autenticación)
app.use('/api/orders', authMiddleware, createProxyMiddleware({
  target: process.env.ORDER_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/orders': '/api/orders'
  },
  onProxyReq: (proxyReq, req, res) => {
    // Pasar el userId al microservicio
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
  onError: (err, req, res) => {
    console.error('Error en Order Service:', err.message);
    res.status(503).json({ error: 'Order Service no disponible' });
  }
}));

// PAYMENT SERVICE - Rutas protegidas
app.use('/api/payments', authMiddleware, createProxyMiddleware({
  target: process.env.PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: {
    '^/api/payments': '/api/payments'
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.user) {
      proxyReq.setHeader('X-User-Id', req.user.userId);
      proxyReq.setHeader('X-User-Role', req.user.role);
    }
  },
  onError: (err, req, res) => {
    console.error('Error en Payment Service:', err.message);
    res.status(503).json({ error: 'Payment Service no disponible' });
  }
}));

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
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Auth Service: ${process.env.AUTH_SERVICE_URL}`);
  console.log(`🔗 Menu Service: ${process.env.MENU_SERVICE_URL}`);
  console.log(`🔗 Order Service: ${process.env.ORDER_SERVICE_URL}`);
  console.log(`🔗 Payment Service: ${process.env.PAYMENT_SERVICE_URL}`);
});