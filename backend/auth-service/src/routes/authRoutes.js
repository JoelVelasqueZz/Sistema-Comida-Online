const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');
const passport = require('../config/passport');
const pool = require('../config/database');
const jwt = require('jsonwebtoken');
// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// Registro de usuario
router.post('/register', authController.register);

// Login de usuario
router.post('/login', authController.login);

// Refresh token - Renovar access token
router.post('/refresh-token', authController.refreshAccessToken);

// Logout - Revocar un refresh token específico
router.post('/logout', authController.logout);

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// Obtener perfil del usuario autenticado
router.get('/profile', authMiddleware, authController.getProfile);

// Actualizar perfil del usuario autenticado
router.patch('/profile', authMiddleware, authController.updateProfile);

// Logout All - Revocar todos los refresh tokens del usuario
router.post('/logout-all', authMiddleware, authController.logoutAll);

// ============================================
// RUTAS INTERNAS (para otros microservicios)
// ============================================

// Verificar si un usuario existe (usado por otros microservicios)
router.get('/users/:userId', authController.verifyUser);

// ============================================
// RUTAS DE ADMIN
// ============================================

// Obtener todos los usuarios (para admin)
router.get('/admin/users', authController.getAllUsers);

// Obtener conteo de usuarios (para admin)
router.get('/admin/users-count', authController.getUsersCount);

// Ruta para iniciar autenticación con Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Callback de Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  async (req, res) => {
    try {
      const user = req.user;

      // Generar tokens JWT
      const accessToken = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '15m' }
      );

      const refreshToken = jwt.sign(
        { userId: user.id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Guardar refresh token en BD
      await pool.query(
        `INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address)
         VALUES ($1, $2, NOW() + INTERVAL '7 days', $3, $4)`,
        [user.id, refreshToken, req.headers['user-agent'] || 'unknown', req.ip || 'unknown']
      );

      // Redirigir al frontend con tokens en URL
      const redirectUrl = `${process.env.FRONTEND_URL}/auth/google/success?token=${accessToken}&refreshToken=${refreshToken}`;
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Error en Google callback:', error);
      res.redirect(
        `${process.env.FRONTEND_URL}/login?error=google_callback_error`
      );
    }
  }
);


module.exports = router;