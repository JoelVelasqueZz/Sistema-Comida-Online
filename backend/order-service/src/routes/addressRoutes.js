const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/addresses - Obtener todas las direcciones del usuario
router.get('/', addressController.getUserAddresses);

// POST /api/addresses - Crear nueva dirección
router.post('/', addressController.createAddress);

// PATCH /api/addresses/:id - Actualizar dirección
router.patch('/:id', addressController.updateAddress);

// PATCH /api/addresses/:id/default - Marcar como predeterminada
router.patch('/:id/default', addressController.setDefaultAddress);

// DELETE /api/addresses/:id - Eliminar dirección
router.delete('/:id', addressController.deleteAddress);

module.exports = router;
