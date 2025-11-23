const pool = require('../config/database');

// Ver pedidos disponibles (estado "ready" sin asignar)
const getAvailableOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        o.created_at,
        o.total,
        o.street,
        o.city,
        o.postal_code,
        o.reference,
        o.ready_at,
        u.name as customer_name,
        u.phone as customer_phone,
        EXTRACT(EPOCH FROM (NOW() - COALESCE(o.ready_at, o.created_at))) / 60 AS minutes_waiting
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status = 'ready'
        AND o.delivery_person_id IS NULL
      ORDER BY o.ready_at ASC NULLS LAST, o.created_at ASC
    `);

    res.json({ success: true, orders: result.rows });
  } catch (error) {
    console.error('Error al obtener pedidos disponibles:', error);
    res.status(500).json({ error: 'Error al obtener pedidos disponibles' });
  }
};

// Aceptar un pedido
const acceptOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.userId;

    // Verificar que el pedido está disponible
    const orderCheck = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND status = $2 AND delivery_person_id IS NULL',
      [orderId, 'ready']
    );

    if (orderCheck.rows.length === 0) {
      return res.status(400).json({ error: 'Pedido no disponible o ya fue asignado' });
    }

    // Asignar repartidor al pedido
    const result = await pool.query(
      `UPDATE orders
       SET delivery_person_id = $1, accepted_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [deliveryPersonId, orderId]
    );

    console.log(`✅ Pedido ${orderId} asignado al repartidor ${deliveryPersonId}`);
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error al aceptar pedido:', error);
    res.status(500).json({ error: 'Error al aceptar pedido' });
  }
};

// Marcar pedido como "en camino" (cuando el repartidor lo recoge)
const markAsDelivering = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.userId;

    const result = await pool.query(
      `UPDATE orders
       SET status = 'delivering', picked_up_at = NOW()
       WHERE id = $1 AND delivery_person_id = $2 AND status = 'ready'
       RETURNING *`,
      [orderId, deliveryPersonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado o no asignado a ti' });
    }

    console.log(`🚚 Pedido ${orderId} en camino`);
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error al marcar como en camino:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// Confirmar entrega del pedido
const confirmDelivery = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deliveryPersonId = req.user.userId;

    const result = await pool.query(
      `UPDATE orders
       SET status = 'delivered', delivered_at = NOW()
       WHERE id = $1 AND delivery_person_id = $2 AND status = 'delivering'
       RETURNING *`,
      [orderId, deliveryPersonId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido no encontrado o no está en camino' });
    }

    console.log(`🎉 Pedido ${orderId} entregado`);
    res.json({ success: true, order: result.rows[0] });
  } catch (error) {
    console.error('Error al confirmar entrega:', error);
    res.status(500).json({ error: 'Error al confirmar entrega' });
  }
};

// Ver entregas activas del repartidor
const getMyDeliveries = async (req, res) => {
  try {
    const deliveryPersonId = req.user.userId;

    const result = await pool.query(`
      SELECT
        o.*,
        u.name as customer_name,
        u.phone as customer_phone,
        u.email as customer_email
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.delivery_person_id = $1
        AND o.status IN ('ready', 'delivering')
      ORDER BY
        CASE
          WHEN o.status = 'delivering' THEN 1
          WHEN o.status = 'ready' THEN 2
        END,
        o.accepted_at DESC
    `, [deliveryPersonId]);

    res.json({ success: true, deliveries: result.rows });
  } catch (error) {
    console.error('Error al obtener mis entregas:', error);
    res.status(500).json({ error: 'Error al obtener entregas' });
  }
};

// Historial de entregas del repartidor
const getDeliveryHistory = async (req, res) => {
  try {
    const deliveryPersonId = req.user.userId;
    const { startDate, endDate } = req.query;

    let query = `
      SELECT
        o.id,
        o.total,
        o.delivered_at,
        o.accepted_at,
        u.name as customer_name,
        EXTRACT(EPOCH FROM (o.delivered_at - o.accepted_at)) / 60 AS delivery_time_minutes
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.delivery_person_id = $1
        AND o.status = 'delivered'
    `;

    const params = [deliveryPersonId];

    if (startDate && endDate) {
      query += ` AND o.delivered_at BETWEEN $2 AND $3`;
      params.push(startDate, endDate);
    }

    query += ` ORDER BY o.delivered_at DESC LIMIT 50`;

    const result = await pool.query(query, params);

    // Estadísticas del día
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total_deliveries,
        COALESCE(SUM(total), 0) as total_earned,
        COALESCE(AVG(EXTRACT(EPOCH FROM (delivered_at - accepted_at)) / 60), 0) as avg_delivery_time
      FROM orders
      WHERE delivery_person_id = $1
        AND status = 'delivered'
        AND delivered_at >= CURRENT_DATE
    `, [deliveryPersonId]);

    res.json({
      success: true,
      history: result.rows,
      stats: statsResult.rows[0]
    });
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
};

module.exports = {
  getAvailableOrders,
  acceptOrder,
  markAsDelivering,
  confirmDelivery,
  getMyDeliveries,
  getDeliveryHistory
};
