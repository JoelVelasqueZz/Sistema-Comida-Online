const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Rutas públicas (no requieren autenticación)
router.post('/request', passwordResetController.requestPasswordReset);
router.get('/verify/:token', passwordResetController.verifyToken);
router.post('/reset', passwordResetController.resetPassword);

module.exports = router;
