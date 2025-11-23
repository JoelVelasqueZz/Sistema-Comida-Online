const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/deliveryController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isDelivery } = require('../middlewares/roleMiddleware');

// Proteger todas las rutas - solo repartidores
router.use(authMiddleware);
router.use(isDelivery);

// Rutas
router.get('/available-orders', deliveryController.getAvailableOrders);
router.post('/accept-order/:orderId', deliveryController.acceptOrder);
router.patch('/mark-delivering/:orderId', deliveryController.markAsDelivering);
router.patch('/confirm-delivery/:orderId', deliveryController.confirmDelivery);
router.get('/my-deliveries', deliveryController.getMyDeliveries);
router.get('/history', deliveryController.getDeliveryHistory);

module.exports = router;
