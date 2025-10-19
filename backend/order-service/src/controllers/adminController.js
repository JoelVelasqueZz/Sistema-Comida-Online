const pool = require('../config/database');
const axios = require('axios');

// ============================================
// OBTENER ESTADÍSTICAS DEL DASHBOARD
// ============================================
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas del dashboard...');

    // 1. Total de pedidos
    const totalOrdersResult = await pool.query(
      'SELECT COUNT(*) as total FROM orders'
    );
    const totalOrders = parseInt(totalOrdersResult.rows[0].total);

    // 2. Pedidos pendientes
    const pendingOrdersResult = await pool.query(
      "SELECT COUNT(*) as total FROM orders WHERE status = 'pending'"
    );
    const pendingOrders = parseInt(pendingOrdersResult.rows[0].total);

    // 3. Ingresos totales (pedidos confirmados, en proceso y entregados)
    const totalRevenueResult = await pool.query(
      `SELECT COALESCE(SUM(total), 0) as revenue
       FROM orders
       WHERE status IN ('confirmed', 'preparing', 'ready', 'on_delivery', 'delivered')`
    );
    const totalRevenue = parseFloat(totalRevenueResult.rows[0].revenue);

    // 4. Total de usuarios (consultar al auth service)
    let totalUsers = 0;
    try {
      const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
      const usersResponse = await axios.get(`${authServiceUrl}/api/auth/admin/users-count`);
      totalUsers = usersResponse.data.count;
    } catch (error) {
      console.warn('⚠️  No se pudo obtener el total de usuarios:', error.message);
      // Si falla, intentar contar desde la BD local si existe la tabla users
      try {
        const usersResult = await pool.query('SELECT COUNT(*) as total FROM users');
        totalUsers = parseInt(usersResult.rows[0].total);
      } catch (e) {
        console.warn('⚠️  Tabla users no disponible en este servicio');
      }
    }

    // 5. Pedidos recientes (últimos 5)
    const recentOrdersResult = await pool.query(
      `SELECT id, user_id, status, total, created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // 6. Distribución de estados de pedidos
    const statusDistributionResult = await pool.query(
      `SELECT status, COUNT(*) as count
       FROM orders
       GROUP BY status
       ORDER BY count DESC`
    );

    const stats = {
      totalOrders,
      pendingOrders,
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      totalUsers,
      recentOrders: recentOrdersResult.rows,
      statusDistribution: statusDistributionResult.rows
    };

    console.log('✅ Estadísticas obtenidas:', stats);

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas del dashboard',
      details: error.message
    });
  }
};

// ============================================
// OBTENER TODOS LOS PEDIDOS (ADMIN)
// ============================================
const getAllOrders = async (req, res) => {
  try {
    const { status, search, dateFrom, dateTo, limit = 50, offset = 0 } = req.query;

    console.log('📋 Obteniendo pedidos con filtros:', { status, search, dateFrom, dateTo });

    // Obtener información del usuario desde el auth service
    const authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
    let usersMap = {};

    try {
      const usersResponse = await axios.get(`${authServiceUrl}/api/auth/admin/users`);
      // Crear un mapa de userId -> user data
      if (usersResponse.data.users) {
        usersResponse.data.users.forEach(user => {
          usersMap[user.id] = {
            name: user.name,
            email: user.email
          };
        });
      }
    } catch (error) {
      console.warn('⚠️  No se pudo obtener información de usuarios:', error.message);
    }

    // Query principal
    let query = `
      SELECT o.id, o.user_id, o.status, o.subtotal, o.delivery_fee, o.tax, o.total,
             o.payment_method, o.created_at, o.street, o.city, o.postal_code, o.reference,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) as item_count
      FROM orders o
      WHERE 1=1
    `;

    const values = [];
    let paramCount = 1;

    // Filtro por estado
    if (status) {
      query += ` AND o.status = $${paramCount}`;
      values.push(status);
      paramCount++;
    }

    // Filtro por búsqueda (ID de orden)
    if (search) {
      query += ` AND (o.id::text ILIKE $${paramCount} OR o.user_id::text ILIKE $${paramCount})`;
      values.push(`%${search}%`);
      paramCount++;
    }

    // Filtro por fecha desde
    if (dateFrom) {
      query += ` AND o.created_at >= $${paramCount}`;
      values.push(dateFrom);
      paramCount++;
    }

    // Filtro por fecha hasta
    if (dateTo) {
      query += ` AND o.created_at <= $${paramCount}`;
      values.push(dateTo + ' 23:59:59');
      paramCount++;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, values);

    // Agregar información de usuario a cada orden
    const ordersWithUserInfo = result.rows.map(order => {
      const userInfo = usersMap[order.user_id] || { name: 'Usuario desconocido', email: 'N/A' };
      return {
        ...order,
        user_name: userInfo.name,
        user_email: userInfo.email,
        item_count: parseInt(order.item_count)
      };
    });

    // Contar total de pedidos para paginación
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE 1=1';
    const countValues = [];
    let countParamCount = 1;

    if (status) {
      countQuery += ` AND status = $${countParamCount}`;
      countValues.push(status);
      countParamCount++;
    }

    if (search) {
      countQuery += ` AND (id::text ILIKE $${countParamCount} OR user_id::text ILIKE $${countParamCount})`;
      countValues.push(`%${search}%`);
      countParamCount++;
    }

    if (dateFrom) {
      countQuery += ` AND created_at >= $${countParamCount}`;
      countValues.push(dateFrom);
      countParamCount++;
    }

    if (dateTo) {
      countQuery += ` AND created_at <= $${countParamCount}`;
      countValues.push(dateTo + ' 23:59:59');
    }

    const countResult = await pool.query(countQuery, countValues);

    console.log(`✅ Encontrados ${ordersWithUserInfo.length} pedidos`);

    res.json({
      success: true,
      orders: ordersWithUserInfo,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset)
      }
    });

  } catch (error) {
    console.error('❌ Error al obtener todos los pedidos:', error);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
};

// ============================================
// ACTUALIZAR ESTADO DE PEDIDO (ADMIN)
// ============================================
const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const adminId = req.user.userId;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'on_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // Actualizar el estado
    const result = await pool.query(
      `UPDATE orders
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Registrar en el historial (si tienes la tabla)
    try {
      await pool.query(
        `INSERT INTO order_status_history (order_id, status, changed_by, change_type, notes)
         VALUES ($1, $2, $3, 'manual', $4)`,
        [id, status, adminId, notes || 'Cambio manual por administrador']
      );
    } catch (e) {
      console.warn('⚠️  No se pudo registrar en historial:', e.message);
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

module.exports = {
  getDashboardStats,
  getAllOrders,
  updateOrderStatusAdmin
};
