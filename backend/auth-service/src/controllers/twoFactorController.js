const pool = require('../config/database');

// Generar código de 6 dígitos
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Crear y guardar código 2FA
const createTwoFactorCode = async (req, res) => {
  try {
    const { user_id, email } = req.body;

    console.log('🔐 [2FA] Generando código para user_id:', user_id);

    // Invalidar códigos anteriores no usados
    await pool.query(
      'UPDATE two_factor_codes SET is_used = true WHERE user_id = $1 AND is_used = false',
      [user_id]
    );

    // Generar nuevo código
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // Guardar en BD
    await pool.query(
      `INSERT INTO two_factor_codes (user_id, code, expires_at)
       VALUES ($1, $2, $3)`,
      [user_id, code, expiresAt]
    );

    console.log('✅ [2FA] Código generado:', code);
    console.log('✅ [2FA] Expira en:', expiresAt);

    // Retornar código y email
    res.json({
      success: true,
      code, // En desarrollo se retorna, en producción solo se envía por email
      email,
      expiresAt
    });

  } catch (error) {
    console.error('❌ [2FA] Error al generar código:', error);
    res.status(500).json({ error: 'Error al generar código de verificación' });
  }
};

// Verificar código 2FA
const verifyTwoFactorCode = async (req, res) => {
  try {
    const { user_id, code } = req.body;

    console.log('🔐 [2FA] Verificando código para user_id:', user_id);
    console.log('🔐 [2FA] Código ingresado:', code);

    // Buscar código válido
    const result = await pool.query(
      `SELECT * FROM two_factor_codes
       WHERE user_id = $1
       AND code = $2
       AND is_used = false
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [user_id, code]
    );

    if (result.rows.length === 0) {
      console.log('❌ [2FA] Código inválido o expirado');

      // Incrementar intentos fallidos en todos los códigos activos del usuario
      await pool.query(
        `UPDATE two_factor_codes
         SET attempts = attempts + 1
         WHERE user_id = $1 AND is_used = false`,
        [user_id]
      );

      return res.status(400).json({
        error: 'Código inválido o expirado',
        success: false
      });
    }

    const codeData = result.rows[0];

    // Verificar intentos
    if (codeData.attempts >= 3) {
      console.log('❌ [2FA] Máximo de intentos alcanzado');

      // Invalidar código
      await pool.query(
        'UPDATE two_factor_codes SET is_used = true WHERE id = $1',
        [codeData.id]
      );

      return res.status(400).json({
        error: 'Máximo de intentos alcanzado. Solicita un nuevo código.',
        success: false
      });
    }

    // Marcar código como usado
    await pool.query(
      'UPDATE two_factor_codes SET is_used = true WHERE id = $1',
      [codeData.id]
    );

    console.log('✅ [2FA] Código verificado correctamente');

    res.json({
      success: true,
      message: 'Código verificado correctamente'
    });

  } catch (error) {
    console.error('❌ [2FA] Error al verificar código:', error);
    res.status(500).json({ error: 'Error al verificar código' });
  }
};

// Habilitar/deshabilitar 2FA para un usuario
const toggleTwoFactor = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;
    const { enabled, method } = req.body; // method: 'email' o 'totp'

    console.log(`🔐 [2FA] ${enabled ? 'Habilitando' : 'Deshabilitando'} 2FA para user_id:`, user_id);
    console.log(`🔐 [2FA] Método:`, method);

    await pool.query(
      `UPDATE users
       SET two_factor_enabled = $1, two_factor_method = $2
       WHERE id = $3`,
      [enabled, method || 'email', user_id]
    );

    console.log('✅ [2FA] Configuración actualizada');

    res.json({
      success: true,
      message: enabled ? '2FA habilitado correctamente' : '2FA deshabilitado',
      enabled,
      method: method || 'email'
    });

  } catch (error) {
    console.error('❌ [2FA] Error al actualizar configuración:', error);
    res.status(500).json({ error: 'Error al actualizar configuración de 2FA' });
  }
};

// Obtener estado de 2FA del usuario
const getTwoFactorStatus = async (req, res) => {
  try {
    const user_id = req.user.userId || req.user.id;

    console.log('🔐 [2FA] Obteniendo estado para user_id:', user_id);

    const result = await pool.query(
      'SELECT two_factor_enabled, two_factor_method FROM users WHERE id = $1',
      [user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = result.rows[0];

    console.log('✅ [2FA] Estado:', {
      enabled: user.two_factor_enabled,
      method: user.two_factor_method
    });

    res.json({
      success: true,
      enabled: user.two_factor_enabled || false,
      method: user.two_factor_method || null
    });

  } catch (error) {
    console.error('❌ [2FA] Error al obtener estado:', error);
    res.status(500).json({ error: 'Error al obtener estado de 2FA' });
  }
};

module.exports = {
  createTwoFactorCode,
  verifyTwoFactorCode,
  toggleTwoFactor,
  getTwoFactorStatus
};
