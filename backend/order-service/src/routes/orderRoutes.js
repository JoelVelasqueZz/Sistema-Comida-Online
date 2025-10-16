const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
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

module.exports = router;