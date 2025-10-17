const jwt = require('jsonwebtoken');
const express = require('express');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configuración de servicios
const SERVICES = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  menu: process.env.MENU_SERVICE_URL || 'http://localhost:3002',
  orders: process.env.ORDER_SERVICE_URL || 'http://localhost:3003',
  payments: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004'
};

// CORS
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Middleware para verificar y decodificar JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('⚠️  No token provided');
    return next(); // Continuar sin autenticación para rutas públicas
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mi_super_secreto_seguro_2024_cambiame');
    console.log('✅ Token válido para usuario:', decoded.userId);
    
    // Agregar headers para los microservicios
    req.headers['x-user-id'] = decoded.userId;
    req.headers['x-user-role'] = decoded.role;
    
    next();
  } catch (error) {
    console.error('❌ Token inválido:', error.message);
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
};

// Aplicar middleware solo a rutas protegidas
app.use((req, res, next) => {
  const publicRoutes = ['/health', '/api/auth/login', '/api/auth/register'];
  const isMenuRoute = req.path.startsWith('/api/menu');
  
  // Rutas públicas y de menú no requieren autenticación
  if (publicRoutes.includes(req.path) || isMenuRoute) {
    return next();
  }
  
  // Rutas protegidas requieren token
  authenticateToken(req, res, next);
});

// Health check del gateway
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'API Gateway',
    timestamp: new Date().toISOString() 
  });
});

// Función helper para hacer proxy
const proxyRequest = async (req, res, serviceUrl) => {
  try {
    console.log(`📤 Enviando request a: ${serviceUrl}${req.path}`);
    console.log(`   Method: ${req.method}`);
    console.log(`   Body:`, req.body);
    console.log(`   Headers:`, req.headers.authorization ? 'Authorization present' : 'No auth');

    const response = await axios({
      method: req.method,
      url: `${serviceUrl}${req.path}`,
      data: req.body,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization && { 'Authorization': req.headers.authorization }),
        ...(req.headers['x-user-id'] && { 'x-user-id': req.headers['x-user-id'] }),
        ...(req.headers['x-user-role'] && { 'x-user-role': req.headers['x-user-role'] })
      }, // 👈 AQUÍ ESTABA EL ERROR - FALTABA LA COMA
      params: req.query
    });

    console.log(`✅ Respuesta recibida: ${response.status}`);
    res.status(response.status).json(response.data);

  } catch (error) {
    console.error(`❌ Error en proxy:`, error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Data:`, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error(`   No response from service`);
      res.status(503).json({ 
        error: 'Servicio no disponible',
        details: error.message 
      });
    }
  }
};

// ==========================================
// RUTAS DE AUTH SERVICE
// ==========================================
app.post('/api/auth/register', (req, res) => {
  console.log('🔵 Register request recibida');
  proxyRequest(req, res, SERVICES.auth);
});

app.post('/api/auth/login', (req, res) => {
  console.log('🔵 Login request recibida');
  proxyRequest(req, res, SERVICES.auth);
});

app.get('/api/auth/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.auth);
});

app.patch('/api/auth/profile', (req, res) => {
  proxyRequest(req, res, SERVICES.auth);
});

// ==========================================
// RUTAS DE MENU SERVICE
// ==========================================
app.get('/api/menu/*', (req, res) => {
  proxyRequest(req, res, SERVICES.menu);
});

app.post('/api/menu/*', (req, res) => {
  proxyRequest(req, res, SERVICES.menu);
});

app.patch('/api/menu/*', (req, res) => {
  proxyRequest(req, res, SERVICES.menu);
});

app.delete('/api/menu/*', (req, res) => {
  proxyRequest(req, res, SERVICES.menu);
});

// ==========================================
// RUTAS DE ORDER SERVICE
// ==========================================
app.get('/api/orders*', (req, res) => {
  proxyRequest(req, res, SERVICES.orders);
});

app.post('/api/orders*', (req, res) => {
  proxyRequest(req, res, SERVICES.orders);
});

app.patch('/api/orders*', (req, res) => {
  proxyRequest(req, res, SERVICES.orders);
});

app.delete('/api/orders*', (req, res) => {
  proxyRequest(req, res, SERVICES.orders);
});

// ==========================================
// RUTAS DE PAYMENT SERVICE
// ==========================================
app.get('/api/payments*', (req, res) => {
  proxyRequest(req, res, SERVICES.payments);
});

app.post('/api/payments*', (req, res) => {
  proxyRequest(req, res, SERVICES.payments);
});

// 404 Handler
app.use((req, res) => {
  console.log(`❌ Ruta no encontrada: ${req.method} ${req.path}`);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API Gateway corriendo en http://localhost:${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Auth Service: ${SERVICES.auth}`);
  console.log(`🔗 Menu Service: ${SERVICES.menu}`);
  console.log(`🔗 Order Service: ${SERVICES.orders}`);
  console.log(`🔗 Payment Service: ${SERVICES.payments}`);
});