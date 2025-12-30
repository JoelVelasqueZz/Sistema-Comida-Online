const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');

const passwordResetController = {
  /**
   * Solicitar recuperación de contraseña
   * POST /api/auth/password-reset/request
   * Body: { email }
   */
  requestPasswordReset: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'Email es requerido' });
      }

      console.log('🔐 [Password Reset] Solicitud de reset para:', email);

      // Buscar usuario
      const userResult = await pool.query(
        'SELECT id, email, name FROM users WHERE email = $1 AND is_active = true',
        [email.toLowerCase()]
      );

      // IMPORTANTE: Por seguridad, siempre retornar éxito aunque el usuario no exista
      if (userResult.rows.length === 0) {
        console.log('⚠️ [Password Reset] Usuario no encontrado, pero retornando éxito por seguridad');
        return res.json({
          success: true,
          message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
        });
      }

      const user = userResult.rows[0];

      // Generar token único
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // Expira en 1 hora

      console.log('🔑 [Password Reset] Token generado para usuario:', user.id);

      // Invalidar tokens anteriores del usuario
      await pool.query(
        'UPDATE password_reset_tokens SET is_used = true WHERE user_id = $1 AND is_used = false',
        [user.id]
      );

      // Guardar nuevo token
      await pool.query(
        `INSERT INTO password_reset_tokens (user_id, token, expires_at)
         VALUES ($1, $2, $3)`,
        [user.id, token, expiresAt]
      );

      console.log('💾 [Password Reset] Token guardado en BD');
      console.log('✅ [Password Reset] Token generado y listo para enviar');

      // Retornar token al frontend para que lo envíe con EmailJS
      res.json({
        success: true,
        token: token,
        email: user.email,
        name: user.name || 'Usuario'
      });

    } catch (error) {
      console.error('❌ [Password Reset] Error en request:', error);
      res.status(500).json({ error: 'Error al procesar solicitud' });
    }
  },

  /**
   * Verificar si un token es válido
   * GET /api/auth/password-reset/verify/:token
   */
  verifyToken: async (req, res) => {
    try {
      const { token } = req.params;

      console.log('🔍 [Password Reset] Verificando token...');

      const result = await pool.query(
        `SELECT prt.*, u.email
         FROM password_reset_tokens prt
         JOIN users u ON prt.user_id = u.id
         WHERE prt.token = $1 AND prt.is_used = false`,
        [token]
      );

      if (result.rows.length === 0) {
        console.log('❌ [Password Reset] Token inválido o ya usado');
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      const tokenData = result.rows[0];

      // Verificar si expiró
      if (new Date(tokenData.expires_at) < new Date()) {
        console.log('❌ [Password Reset] Token expirado');
        return res.status(400).json({ error: 'Token expirado' });
      }

      console.log('✅ [Password Reset] Token válido');

      res.json({
        success: true,
        email: tokenData.email
      });

    } catch (error) {
      console.error('❌ [Password Reset] Error verificando token:', error);
      res.status(500).json({ error: 'Error al verificar token' });
    }
  },

  /**
   * Restablecer contraseña
   * POST /api/auth/password-reset/reset
   * Body: { token, newPassword }
   */
  resetPassword: async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
      }

      console.log('🔐 [Password Reset] Restableciendo contraseña...');

      // Verificar token
      const tokenResult = await pool.query(
        `SELECT * FROM password_reset_tokens
         WHERE token = $1 AND is_used = false`,
        [token]
      );

      if (tokenResult.rows.length === 0) {
        console.log('❌ [Password Reset] Token inválido');
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      const tokenData = tokenResult.rows[0];

      // Verificar expiración
      if (new Date(tokenData.expires_at) < new Date()) {
        console.log('❌ [Password Reset] Token expirado');
        return res.status(400).json({ error: 'Token expirado' });
      }

      // Encriptar nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [passwordHash, tokenData.user_id]
      );

      // Marcar token como usado
      await pool.query(
        'UPDATE password_reset_tokens SET is_used = true WHERE id = $1',
        [tokenData.id]
      );

      console.log('✅ [Password Reset] Contraseña actualizada exitosamente');

      res.json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });

    } catch (error) {
      console.error('❌ [Password Reset] Error resetting password:', error);
      res.status(500).json({ error: 'Error al restablecer contraseña' });
    }
  }
};

module.exports = passwordResetController;
