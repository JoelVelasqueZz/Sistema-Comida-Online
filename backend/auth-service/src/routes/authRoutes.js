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

// Refresh token - Renovar access token
router.post('/refresh-token', authController.refreshAccessToken);

// Logout - Revocar un refresh token específico
router.post('/logout', authController.logout);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, authController.getProfile);

// Actualizar perfil del usuario autenticado
router.patch('/profile', authMiddleware, authController.updateProfile);

// Logout All - Revocar todos los refresh tokens del usuario
router.post('/logout-all', authMiddleware, authController.logoutAll);

// ============================================
// RUTAS INTERNAS (para otros microservicios)
// ============================================

// Verificar si un usuario existe (usado por otros microservicios)
router.get('/users/:userId', authController.verifyUser);

// ============================================
// RUTAS DE ADMIN
// ============================================

// Obtener todos los usuarios (para admin)
router.get('/admin/users', authController.getAllUsers);

// Obtener conteo de usuarios (para admin)
router.get('/admin/users-count', authController.getUsersCount);

module.exports = router;