const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// ============================================
// RUTAS DE GESTIÓN DE USUARIOS (Solo Admin)
// ============================================

// Obtener estadísticas generales de usuarios
router.get('/stats', authMiddleware, isAdmin, userController.getUserStats);

// Obtener todos los usuarios (con filtros y paginación)
router.get('/', authMiddleware, isAdmin, userController.getAllUsers);

// Obtener usuario por ID (con estadísticas de pedidos)
router.get('/:id', authMiddleware, isAdmin, userController.getUserById);

// Obtener estadísticas de pedidos de un usuario
router.get('/:id/stats', authMiddleware, isAdmin, userController.getUserOrderStats);

// Cambiar rol de usuario
router.patch('/:id/role', authMiddleware, isAdmin, userController.changeUserRole);

// Activar/Desactivar usuario
router.patch('/:id/status', authMiddleware, isAdmin, userController.toggleUserStatus);

// Eliminar usuario
router.delete('/:id', authMiddleware, isAdmin, userController.deleteUser);

module.exports = router;
