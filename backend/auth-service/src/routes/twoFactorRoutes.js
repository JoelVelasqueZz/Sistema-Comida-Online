const express = require('express');
const router = express.Router();
const twoFactorController = require('../controllers/twoFactorController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rutas públicas (para login)
router.post('/generate', twoFactorController.createTwoFactorCode);
router.post('/verify', twoFactorController.verifyTwoFactorCode);

// Rutas protegidas (para configuración en perfil)
router.get('/status', authMiddleware, twoFactorController.getTwoFactorStatus);
router.post('/toggle', authMiddleware, twoFactorController.toggleTwoFactor);

module.exports = router;
