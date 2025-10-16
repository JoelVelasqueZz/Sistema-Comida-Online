const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

// ============================================
// RUTAS DE CATEGORÍAS
// ============================================
router.get('/categories', menuController.getCategories);
router.get('/categories/:id', menuController.getCategoryById);

// ============================================
// RUTAS DE PRODUCTOS
// ============================================
router.get('/products', menuController.getProducts);
router.get('/products/search', menuController.searchProducts);
router.get('/products/:id', menuController.getProductById);
router.get('/categories/:categoryId/products', menuController.getProductsByCategory);

module.exports = router;