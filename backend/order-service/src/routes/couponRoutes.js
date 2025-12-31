const express = require('express');
const router = express.Router();
const couponController = require('../controllers/couponController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los cupones activos
router.get('/', couponController.getAllCoupons);

// Obtener cupones disponibles para el usuario
router.get('/available', couponController.getAvailableCoupons);

// Validar cupón
router.post('/validate', couponController.validateCoupon);

// Registrar uso de cupón
router.post('/use', couponController.useCoupon);

// Historial de cupones
router.get('/history', couponController.getCouponHistory);

module.exports = router;
