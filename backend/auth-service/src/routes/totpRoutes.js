const express = require('express');
const router = express.Router();
const totpController = require('../controllers/totpController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas protegidas (requieren autenticación)
router.post('/setup', authMiddleware, totpController.setupTotp);
router.post('/enable', authMiddleware, totpController.enableTotp);
router.post('/disable', authMiddleware, totpController.disableTotp);

// Ruta pública (para login)
router.post('/verify', totpController.verifyTotp);

module.exports = router;
