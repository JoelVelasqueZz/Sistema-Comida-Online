const pool = require('../config/database');
const axios = require('axios');

// ============================================
// OBTENER ESTADÍSTICAS GENERALES DE USUARIOS
// ============================================
const getUserStats = async (req, res) => {
  try {
    // Total de usuarios
    const totalResult = await pool.query('SELECT COUNT(*) as total FROM users');
    const totalUsers = parseInt(totalResult.rows[0].total);

    // Clientes activos
    const customersResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'customer' AND is_active = true"
    );
    const activeCustomers = parseInt(customersResult.rows[0].total);

    // Administradores
    const adminsResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE role = 'admin'"
    );
    const totalAdmins = parseInt(adminsResult.rows[0].total);

    // Nuevos usuarios (últimos 7 días)
    const newUsersResult = await pool.query(
      "SELECT COUNT(*) as total FROM users WHERE created_at >= NOW() - INTERVAL '7 days'"
    );
    const newUsers = parseInt(newUsersResult.rows[0].total);

    res.json({
      success: true,
      stats: {
        totalUsers,
        activeCustomers,
        totalAdmins,
        newUsers
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas de usuarios:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// OBTENER TODOS LOS USUARIOS (con filtros y paginación)
// ============================================
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    let query = `
      SELECT id, name, email, phone, role, is_active, created_at, last_login
      FROM users
      WHERE 1=1
    `;
    const values = [];
    let paramCount = 1;

    // Filtro por rol
    if (role && role !== 'all') {
      query += ` AND role = $${paramCount}`;
      values.push(role);
      paramCount++;
    }

    // Filtro por estado
    if (status === 'active') {
      query += ` AND is_active = true`;
    } else if (status === 'inactive') {
      query += ` AND is_active = false`;
    }

    // Búsqueda por nombre o email
    if (search && search.trim().length > 0) {
      query += ` AND (LOWER(name) LIKE $${paramCount} OR LOWER(email) LIKE $${paramCount})`;
      values.push(`%${search.toLowerCase()}%`);
      paramCount++;
    }

    // Contar total
    const countQuery = query.replace(
      'SELECT id, name, email, phone, role, is_active, created_at, last_login',
      'SELECT COUNT(*) as total'
    );
    const countResult = await pool.query(countQuery, values);
    const totalUsers = parseInt(countResult.rows[0].total);

    // Paginación
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), offset);

    const result = await pool.query(query, values);

    res.json({
      success: true,
      users: result.rows,
      pagination: {
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

// ============================================
// OBTENER USUARIO POR ID (con estadísticas)
// ============================================
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener información del usuario
    const userResult = await pool.query(
      'SELECT id, name, email, phone, role, is_active, created_at, last_login FROM users WHERE id = $1',
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const user = userResult.rows[0];

    // Si es cliente, obtener estadísticas de pedidos del order-service
    let orderStats = null;
    if (user.role === 'customer') {
      try {
        const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
        const statsResponse = await axios.get(`${orderServiceUrl}/api/orders/user/${id}/stats`, {
          headers: {
            Authorization: req.headers.authorization
          }
        });
        orderStats = statsResponse.data.stats || null;
      } catch (error) {
        console.warn('No se pudieron obtener estadísticas de pedidos:', error.message);
      }
    }

    res.json({
      success: true,
      user,
      orderStats
    });

  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

// ============================================
// CAMBIAR ROL DE USUARIO
// ============================================
const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, notes } = req.body;
    const adminId = req.user.userId;

    // Validar que el rol sea válido
    const validRoles = ['customer', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    // Prevenir que un admin se cambie su propio rol a customer
    if (id === adminId && role !== 'admin') {
      return res.status(403).json({
        error: 'No puedes cambiar tu propio rol de administrador'
      });
    }

    // Si está cambiando de admin a otro rol, verificar que no sea el último admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userResult.rows[0].role === 'admin' && role !== 'admin') {
      const adminCountResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = true"
      );
      const adminCount = parseInt(adminCountResult.rows[0].count);

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'No puedes quitar el rol de admin al último administrador activo'
        });
      }
    }

    // Actualizar rol
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, name, email, role',
      [role, id]
    );

    // TODO: Registrar cambio en tabla de auditoría si existe
    console.log(`Admin ${adminId} cambió el rol de usuario ${id} a ${role}. Notas: ${notes || 'N/A'}`);

    res.json({
      success: true,
      message: 'Rol actualizado exitosamente',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
};

// ============================================
// ACTIVAR/DESACTIVAR USUARIO
// ============================================
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    const adminId = req.user.userId;

    // Prevenir que un admin se desactive a sí mismo
    if (id === adminId && is_active === false) {
      return res.status(403).json({
        error: 'No puedes desactivar tu propia cuenta'
      });
    }

    // Si está desactivando un admin, verificar que no sea el último
    const userResult = await pool.query('SELECT role, is_active FROM users WHERE id = $1', [id]);
    if (userResult.rows[0].role === 'admin' && is_active === false) {
      const adminCountResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = true"
      );
      const adminCount = parseInt(adminCountResult.rows[0].count);

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'No puedes desactivar al último administrador activo'
        });
      }
    }

    // Actualizar estado
    const result = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, name, email, is_active',
      [is_active, id]
    );

    res.json({
      success: true,
      message: `Usuario ${is_active ? 'activado' : 'desactivado'} exitosamente`,
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Error al cambiar estado:', error);
    res.status(500).json({ error: 'Error al cambiar estado' });
  }
};

// ============================================
// ELIMINAR USUARIO
// ============================================
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    // Prevenir que un admin se elimine a sí mismo
    if (id === adminId) {
      return res.status(403).json({
        error: 'No puedes eliminar tu propia cuenta'
      });
    }

    // Verificar que no sea el último admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (userResult.rows[0].role === 'admin') {
      const adminCountResult = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = true"
      );
      const adminCount = parseInt(adminCountResult.rows[0].count);

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'No puedes eliminar al último administrador'
        });
      }
    }

    // Eliminar usuario
    await pool.query('DELETE FROM users WHERE id = $1', [id]);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS DE UN USUARIO
// ============================================
const getUserOrderStats = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario existe
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Obtener estadísticas del order-service
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://localhost:3003';
      const statsResponse = await axios.get(`${orderServiceUrl}/api/orders/user/${id}/stats`, {
        headers: {
          Authorization: req.headers.authorization
        }
      });

      res.json({
        success: true,
        stats: statsResponse.data.stats || {}
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de pedidos:', error);
      res.json({
        success: true,
        stats: {
          totalOrders: 0,
          totalSpent: 0,
          averageOrder: 0,
          lastOrderDate: null
        }
      });
    }

  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

module.exports = {
  getUserStats,
  getAllUsers,
  getUserById,
  changeUserRole,
  toggleUserStatus,
  deleteUser,
  getUserOrderStats
};
