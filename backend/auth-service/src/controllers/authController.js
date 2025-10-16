const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

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

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token
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

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      token
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

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  verifyUser
};