const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');
const { isAdmin } = require('../middlewares/roleMiddleware');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN Y ROL DE ADMIN
// ============================================
router.use(authMiddleware);
router.use(isAdmin);

// Reporte de ventas
router.get('/sales', reportController.getSalesReport);

// Reporte de productos más vendidos
router.get('/top-products', reportController.getTopProductsReport);

// Reporte de clientes
router.get('/customers', reportController.getCustomersReport);

// Reporte financiero
router.get('/financial', reportController.getFinancialReport);

// Reporte de pedidos por estado
router.get('/orders-by-status', reportController.getOrdersByStatusReport);

// Obtener categorías (para filtros)
router.get('/categories', reportController.getCategories);

module.exports = router;
