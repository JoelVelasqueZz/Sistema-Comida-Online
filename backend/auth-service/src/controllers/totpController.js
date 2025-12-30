const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const pool = require('../config/database');

const totpController = {
  /**
   * Genera un nuevo SECRET y QR Code para TOTP
   * POST /api/auth/totp/setup
   */
  setupTotp: async (req, res) => {
    try {
      const userId = req.user.userId;

      console.log('🔐 [TOTP] Configurando TOTP para usuario:', userId);

      // Obtener datos del usuario
      const userResult = await pool.query(
        'SELECT email, name FROM users WHERE id = $1',
        [userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = userResult.rows[0];

      // Generar SECRET único para este usuario
      const secret = speakeasy.generateSecret({
        name: `Tu Comida Online (${user.email})`,
        issuer: 'Tu Comida Online',
        length: 32
      });

      console.log('✅ [TOTP] SECRET generado:', secret.base32);

      // Generar QR Code
      const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

      console.log('✅ [TOTP] QR Code generado');

      // Devolver SECRET y QR (el SECRET se guardará cuando el usuario verifique)
      res.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntry: secret.base32 // Por si no puede escanear QR
      });

    } catch (error) {
      console.error('❌ [TOTP] Error en setup:', error);
      res.status(500).json({ error: 'Error al configurar TOTP' });
    }
  },

  /**
   * Verifica un código TOTP y activa TOTP para el usuario
   * POST /api/auth/totp/enable
   * Body: { code, secret }
   */
  enableTotp: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { code, secret } = req.body;

      console.log('🔐 [TOTP] Activando TOTP para usuario:', userId);

      // Verificar el código con el SECRET temporal
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code,
        window: 2 // Permite 1 minuto de margen (2 ventanas de 30s)
      });

      if (!verified) {
        console.log('❌ [TOTP] Código inválido');
        return res.status(400).json({ error: 'Código inválido' });
      }

      console.log('✅ [TOTP] Código verificado correctamente');

      // Guardar SECRET y activar TOTP
      await pool.query(
        `UPDATE users
         SET totp_secret = $1,
             two_factor_enabled = true,
             two_factor_method = 'totp'
         WHERE id = $2`,
        [secret, userId]
      );

      console.log('✅ [TOTP] TOTP activado exitosamente');

      res.json({
        success: true,
        message: 'TOTP activado correctamente'
      });

    } catch (error) {
      console.error('❌ [TOTP] Error al activar:', error);
      res.status(500).json({ error: 'Error al activar TOTP' });
    }
  },

  /**
   * Verifica un código TOTP durante el login
   * POST /api/auth/totp/verify
   * Body: { user_id, code }
   */
  verifyTotp: async (req, res) => {
    try {
      const { user_id, code } = req.body;

      console.log('🔍 [TOTP] Verificando código para usuario:', user_id);

      // Obtener el SECRET del usuario
      const result = await pool.query(
        'SELECT totp_secret FROM users WHERE id = $1',
        [user_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const { totp_secret } = result.rows[0];

      if (!totp_secret) {
        return res.status(400).json({ error: 'TOTP no configurado' });
      }

      // Verificar el código
      const verified = speakeasy.totp.verify({
        secret: totp_secret,
        encoding: 'base32',
        token: code,
        window: 2 // Permite 1 minuto de margen
      });

      if (!verified) {
        console.log('❌ [TOTP] Código inválido');
        return res.status(400).json({ error: 'Código inválido' });
      }

      console.log('✅ [TOTP] Código verificado correctamente');

      // Guardar verificación en two_factor_codes para que el segundo login la detecte
      console.log('💾 [TOTP] Guardando verificación en BD...');
      await pool.query(
        `INSERT INTO two_factor_codes (user_id, code, is_used, expires_at, created_at)
        VALUES ($1, $2, true, NOW() + INTERVAL '5 minutes', NOW())`,
        [user_id, code]
      );
      console.log('✅ [TOTP] Verificación guardada');

      res.json({
        success: true,
        message: 'Código verificado correctamente'
      });

    } catch (error) {
      console.error('❌ [TOTP] Error al verificar:', error);
      res.status(500).json({ error: 'Error al verificar código' });
    }
  },

  /**
   * Desactiva TOTP para el usuario
   * POST /api/auth/totp/disable
   */
  disableTotp: async (req, res) => {
    try {
      const userId = req.user.userId;

      console.log('🔐 [TOTP] Desactivando TOTP para usuario:', userId);

      await pool.query(
        `UPDATE users
         SET totp_secret = NULL,
             two_factor_enabled = false,
             two_factor_method = NULL
         WHERE id = $1`,
        [userId]
      );

      console.log('✅ [TOTP] TOTP desactivado');

      res.json({
        success: true,
        message: 'TOTP desactivado correctamente'
      });

    } catch (error) {
      console.error('❌ [TOTP] Error al desactivar:', error);
      res.status(500).json({ error: 'Error al desactivar TOTP' });
    }
  }
};

module.exports = totpController;
