const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// ============================================
// RUTAS DE ADMIN (Todas requieren autenticación y rol admin)
// ============================================

// Aplicar middlewares a todas las rutas
router.use(authMiddleware);
router.use(isAdmin);

// Obtener estadísticas del dashboard
router.get('/stats', adminController.getDashboardStats);

// Obtener todos los pedidos (con filtros y paginación)
router.get('/orders', adminController.getAllOrders);

// Actualizar estado de pedido (admin)
router.patch('/orders/:id/status', adminController.updateOrderStatusAdmin);

module.exports = router;
