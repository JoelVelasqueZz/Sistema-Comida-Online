const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// ============================================
// RUTAS SIN AUTENTICACIÓN (Para llamadas internas entre servicios)
// ============================================

// Obtener estadísticas de pedidos de un usuario (llamada desde auth-service)
router.get('/user/:userId/stats', orderController.getUserOrderStats);

// ============================================
// RUTAS CON AUTENTICACIÓN
// ============================================

// Todas las rutas siguientes requieren autenticación
router.use(authMiddleware);

// Crear orden
router.post('/', orderController.createOrder);

// Obtener órdenes del usuario
router.get('/', orderController.getUserOrders);

// Obtener orden específica
router.get('/:id', orderController.getOrderById);

// Actualizar estado de orden
router.patch('/:id/status', orderController.updateOrderStatus);

// Cancelar orden
router.patch('/:id/cancel', orderController.cancelOrder);

// Confirmar entrega
router.patch('/:id/confirm-delivery', orderController.confirmDelivery);

module.exports = router;