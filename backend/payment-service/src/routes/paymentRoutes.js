const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Webhook (sin autenticación)
router.post('/webhook', paymentController.paymentWebhook);

// Rutas protegidas
router.use(authMiddleware);

// Procesar pago
router.post('/', paymentController.processPayment);

// Obtener pago por order ID
router.get('/order/:orderId', paymentController.getPaymentByOrderId);

// Obtener historial de pagos del usuario
router.get('/user', paymentController.getUserPayments);

// Reembolsar pago (solo admin)
router.post('/:id/refund', paymentController.refundPayment);

module.exports = router;