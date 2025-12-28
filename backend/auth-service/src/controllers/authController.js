const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const crypto = require('crypto');

// ============================================
// FUNCIONES AUXILIARES PARA TOKENS
// ============================================
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' } // Access token expira en 15 minutos
  );
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const saveRefreshToken = async (userId, refreshToken, deviceInfo, ipAddress) => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // Refresh token expira en 7 días

  await pool.query(
    `INSERT INTO refresh_tokens (user_id, token, expires_at, device_info, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, refreshToken, expiresAt, deviceInfo, ipAddress]
  );

  return expiresAt;
};

// ============================================
// REGISTRO DE USUARIO
// ============================================
const register = async (req, res) => {
  try {
    const { email, password, name, phone } = req.body;

    // Validaciones
    if (!email || !password || !name) {
      return res.status(400).json({ 
        error: 'Email, contraseña y nombre son obligatorios' 
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Email inválido' });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    // Verificar si el email ya existe
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'El email ya está registrado' 
      });
    }

    // Encriptar contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Crear usuario
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, phone, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, email, name, phone, role, created_at`,
      [email.toLowerCase(), passwordHash, name, phone || null, 'customer']
    );

    const user = result.rows[0];

    // Generar access token y refresh token
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Obtener info del dispositivo y IP
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    // Guardar refresh token en BD
    await saveRefreshToken(user.id, refreshToken, deviceInfo, ipAddress);

    console.log('✅ Registro exitoso - Token generado para:', user.email);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token: accessToken, // Alias para compatibilidad
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// ============================================
// LOGIN DE USUARIO
// ============================================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validaciones
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son obligatorios' 
      });
    }

    // Buscar usuario
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        error: 'Email o contraseña incorrectos' 
      });
    }

    const user = result.rows[0];

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Email o contraseña incorrectos'
      });
    }

    // Verificar si el usuario tiene 2FA habilitado
    if (user.two_factor_enabled && user.two_factor_method === 'email') {
      console.log('🔐 [Auth] Usuario tiene 2FA habilitado, verificando códigos recientes...');

      // Verificar si hay un código verificado recientemente (últimos 2 minutos)
      const recentVerification = await pool.query(
        `SELECT id, code, created_at
         FROM two_factor_codes
         WHERE user_id = $1
         AND is_used = true
         AND created_at > NOW() - INTERVAL '2 minutes'
         ORDER BY created_at DESC
         LIMIT 1`,
        [user.id]
      );

      if (recentVerification.rows.length > 0) {
        console.log('✅ [Auth] Código 2FA verificado recientemente, permitiendo login directo');
        console.log('📊 [Auth] Código verificado hace:', recentVerification.rows[0].created_at);
        console.log('🔐 [Auth] Continuando con login normal sin solicitar 2FA de nuevo...');
        // NO hacer return, continuar con el login normal (generar tokens)
      } else {
        console.log('🔐 [Auth] No hay verificación reciente, solicitando código 2FA');
        return res.json({
          requiresTwoFactor: true,
          userId: user.id,
          email: user.email,
          twoFactorMethod: 'email',
          message: 'Se requiere verificación de dos factores'
        });
      }
    } else {
      // Si NO tiene 2FA, continuar con login normal (generar tokens)
      console.log('🔐 [Auth] Usuario SIN 2FA, login normal');
    }

    // Actualizar último login
    console.log('📝 [Auth] Actualizando último login del usuario...');
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generar access token y refresh token
    console.log('🔑 [Auth] Generando access token y refresh token...');
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();

    // Obtener info del dispositivo y IP
    const deviceInfo = req.headers['user-agent'] || 'Unknown';
    const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

    // Guardar refresh token en BD
    console.log('💾 [Auth] Guardando refresh token en base de datos...');
    await saveRefreshToken(user.id, refreshToken, deviceInfo, ipAddress);

    console.log('✅ [Auth] Login exitoso - Tokens generados para:', user.email);
    console.log('📤 [Auth] Enviando respuesta con tokens al cliente...');

    res.json({
      success: true,
      message: 'Login exitoso',
      token: accessToken, // Alias para compatibilidad
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// ============================================
// OBTENER PERFIL DE USUARIO
// ============================================
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT id, email, name, phone, role, created_at 
       FROM users 
       WHERE id = $1 AND is_active = true`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
};

// ============================================
// ACTUALIZAR PERFIL
// ============================================
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { name, phone } = req.body;

    if (!name && !phone) {
      return res.status(400).json({ 
        error: 'Debes proporcionar al menos un campo para actualizar' 
      });
    }

    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const values = [];
    let paramCount = 1;

    if (name) {
      query += `, name = $${paramCount}`;
      values.push(name);
      paramCount++;
    }

    if (phone) {
      query += `, phone = $${paramCount}`;
      values.push(phone);
      paramCount++;
    }

    query += ` WHERE id = $${paramCount} RETURNING id, email, name, phone, role`;
    values.push(userId);

    const result = await pool.query(query, values);

    res.json({
      message: 'Perfil actualizado exitosamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
};

// ============================================
// VERIFICAR SI USUARIO EXISTE (Para otros microservicios)
// ============================================
const verifyUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id, email, name, role FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Error al verificar usuario:', error);
    res.status(500).json({ error: 'Error al verificar usuario' });
  }
};

// ============================================
// REFRESH TOKEN - Obtener nuevo access token
// ============================================
const refreshAccessToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token es requerido' });
    }

    // Buscar refresh token en BD
    const result = await pool.query(
      `SELECT rt.*, u.id, u.email, u.role, u.name, u.phone
       FROM refresh_tokens rt
       JOIN users u ON rt.user_id = u.id
       WHERE rt.token = $1 AND rt.is_revoked = false AND u.is_active = true`,
      [refreshToken]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido o revocado' });
    }

    const tokenData = result.rows[0];

    // Verificar si el token expiró
    if (new Date(tokenData.expires_at) < new Date()) {
      return res.status(401).json({ error: 'Refresh token expirado' });
    }

    // Generar nuevo access token
    const user = {
      id: tokenData.id,
      email: tokenData.email,
      role: tokenData.role,
      name: tokenData.name,
      phone: tokenData.phone
    };

    const newAccessToken = generateAccessToken(user);

    res.json({
      message: 'Token renovado exitosamente',
      accessToken: newAccessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Error al renovar token:', error);
    res.status(500).json({ error: 'Error al renovar token' });
  }
};

// ============================================
// LOGOUT - Revocar refresh token
// ============================================
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token es requerido' });
    }

    // Revocar el refresh token
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
      [refreshToken]
    );

    res.json({ message: 'Logout exitoso' });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};

// ============================================
// LOGOUT ALL - Revocar todos los tokens del usuario
// ============================================
const logoutAll = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Revocar todos los refresh tokens del usuario
    await pool.query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'Todas las sesiones cerradas exitosamente' });

  } catch (error) {
    console.error('Error en logout all:', error);
    res.status(500).json({ error: 'Error al cerrar todas las sesiones' });
  }
};

// ============================================
// ADMIN - Obtener todos los usuarios
// ============================================
const getAllUsers = async (req, res) => {
  try {
    console.log('👥 Obteniendo todos los usuarios...');

    const result = await pool.query(
      `SELECT id, email, name, phone, role, is_active, created_at, last_login
       FROM users
       ORDER BY created_at DESC`
    );

    res.json({
      success: true,
      users: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ============================================
// ADMIN - Obtener conteo de usuarios
// ============================================
const getUsersCount = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE is_active = true'
    );

    res.json({
      success: true,
      count: parseInt(result.rows[0].count)
    });

  } catch (error) {
    console.error('Error al contar usuarios:', error);
    res.status(500).json({ error: 'Error al contar usuarios' });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyUser,
  refreshAccessToken,
  logout,
  logoutAll,
  getAllUsers,
  getUsersCount
};