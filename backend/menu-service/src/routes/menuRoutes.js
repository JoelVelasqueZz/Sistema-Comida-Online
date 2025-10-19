const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// ============================================
// RUTAS PÚBLICAS - CATEGORÍAS
// ============================================
router.get('/categories', menuController.getCategories);
router.get('/categories/:id', menuController.getCategoryById);

// ============================================
// RUTAS PÚBLICAS - PRODUCTOS
// ============================================
router.get('/products', menuController.getProducts);
router.get('/products/search', menuController.searchProducts);
router.get('/products/:id', menuController.getProductById);
router.get('/categories/:categoryId/products', menuController.getProductsByCategory);

// ============================================
// RUTAS ADMIN - CATEGORÍAS
// (Requieren autenticación y rol de admin)
// ============================================
router.get('/admin/categories', authMiddleware, adminMiddleware, menuController.getAllCategoriesAdmin);
router.post('/admin/categories', authMiddleware, adminMiddleware, menuController.createCategory);
router.put('/admin/categories/:id', authMiddleware, adminMiddleware, menuController.updateCategory);
router.delete('/admin/categories/:id', authMiddleware, adminMiddleware, menuController.deleteCategory);

// ============================================
// RUTAS ADMIN - PRODUCTOS
// (Requieren autenticación y rol de admin)
// ============================================
router.get('/admin/products', authMiddleware, adminMiddleware, menuController.getAllProductsAdmin);
router.post('/admin/products', authMiddleware, adminMiddleware, menuController.createProduct);
router.put('/admin/products/:id', authMiddleware, adminMiddleware, menuController.updateProduct);
router.delete('/admin/products/:id', authMiddleware, adminMiddleware, menuController.deleteProduct);
router.patch('/admin/products/:id/availability', authMiddleware, adminMiddleware, menuController.toggleProductAvailability);

// ============================================
// RUTAS ADMIN - EXTRAS
// (Requieren autenticación y rol de admin)
// ============================================
router.get('/admin/products/:productId/extras', authMiddleware, adminMiddleware, menuController.getProductExtrasAdmin);
router.post('/admin/products/:productId/extras', authMiddleware, adminMiddleware, menuController.createExtra);
router.put('/admin/extras/:id', authMiddleware, adminMiddleware, menuController.updateExtra);
router.delete('/admin/extras/:id', authMiddleware, adminMiddleware, menuController.deleteExtra);

module.exports = router;