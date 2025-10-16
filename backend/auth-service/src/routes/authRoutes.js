const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// Registro de usuario
router.post('/register', authController.register);

// Login de usuario
router.post('/login', authController.login);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, authController.getProfile);

// Actualizar perfil del usuario autenticado
router.patch('/profile', authMiddleware, authController.updateProfile);

// ============================================
// RUTAS INTERNAS (para otros microservicios)
// ============================================

// Verificar si un usuario existe (usado por otros microservicios)
router.get('/users/:userId', authController.verifyUser);

module.exports = router;