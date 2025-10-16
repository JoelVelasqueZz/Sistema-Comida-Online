const pool = require('../config/database');
const axios = require('axios');

// ============================================
// CREAR ORDEN
// ============================================
const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const { 
      address_id, 
      items, // [{ product_id, quantity, extras: [extra_id] }]
      payment_method,
      special_instructions 
    } = req.body;

    // Validaciones
    if (!address_id || !items || items.length === 0 || !payment_method) {
      return res.status(400).json({ 
        error: 'Dirección, items y método de pago son obligatorios' 
      });
    }

    await client.query('BEGIN');

    // 1. Obtener precios de productos desde Menu Service
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Consultar producto
      const productResult = await pool.query(
        'SELECT id, name, price, is_available FROM products WHERE id = $1',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        throw new Error(`Producto ${item.product_id} no encontrado`);
      }

      const product = productResult.rows[0];

      if (!product.is_available) {
        throw new Error(`Producto ${product.name} no está disponible`);
      }

      // Calcular subtotal del item
      let itemSubtotal = product.price * item.quantity;

      // Calcular extras
      const itemExtras = [];
      if (item.extras && item.extras.length > 0) {
        for (const extraId of item.extras) {
          const extraResult = await pool.query(
            'SELECT id, name, price FROM product_extras WHERE id = $1 AND is_available = true',
            [extraId]
          );

          if (extraResult.rows.length > 0) {
            const extra = extraResult.rows[0];
            itemExtras.push(extra);
            itemSubtotal += extra.price * item.quantity;
          }
        }
      }

      subtotal += itemSubtotal;

      orderItems.push({
        product,
        quantity: item.quantity,
        unit_price: product.price,
        subtotal: itemSubtotal,
        extras: itemExtras,
        special_instructions: item.special_instructions
      });
    }

    // 2. Calcular totales
    const delivery_fee = 2.50; // Puedes hacer esto dinámico
    const tax = subtotal * 0.12; // 12% IVA
    const total = subtotal + delivery_fee + tax;

    // 3. Crear la orden
    const orderResult = await client.query(
      `INSERT INTO orders 
       (user_id, address_id, status, subtotal, delivery_fee, tax, total, payment_method, special_instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, address_id, 'pending', subtotal, delivery_fee, tax, total, payment_method, special_instructions]
    );

    const order = orderResult.rows[0];

    // 4. Insertar items de la orden
    for (const item of orderItems) {
      const orderItemResult = await client.query(
        `INSERT INTO order_items 
         (order_id, product_id, product_name, quantity, unit_price, subtotal, special_instructions)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          order.id,
          item.product.id,
          item.product.name,
          item.quantity,
          item.unit_price,
          item.subtotal,
          item.special_instructions
        ]
      );

      const orderItem = orderItemResult.rows[0];

      // 5. Insertar extras del item
      for (const extra of item.extras) {
        await client.query(
          `INSERT INTO order_item_extras 
           (order_item_id, extra_id, name, price)
           VALUES ($1, $2, $3, $4)`,
          [orderItem.id, extra.id, extra.name, extra.price]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Orden creada exitosamente',
      order: {
        id: order.id,
        status: order.status,
        subtotal: parseFloat(order.subtotal),
        delivery_fee: parseFloat(order.delivery_fee),
        tax: parseFloat(order.tax),
        total: parseFloat(order.total),
        payment_method: order.payment_method,
        created_at: order.created_at
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al crear orden:', error);
    res.status(500).json({ error: error.message || 'Error al crear orden' });
  } finally {
    client.release();
  }
};

// ============================================
// OBTENER ÓRDENES DEL USUARIO
// ============================================
const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    let query = `
      SELECT o.id, o.status, o.subtotal, o.delivery_fee, o.tax, o.total,
             o.payment_method, o.created_at, o.estimated_delivery,
             a.street, a.city
      FROM orders o
      LEFT JOIN addresses a ON o.address_id = a.id
      WHERE o.user_id = $1
    `;
    const values = [userId];

    if (status) {
      query += ' AND o.status = $2';
      values.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const result = await pool.query(query, values);

    res.json({
      orders: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    res.status(500).json({ error: 'Error al obtener órdenes' });
  }
};

// ============================================
// OBTENER ORDEN POR ID (con items)
// ============================================
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Obtener orden
    const orderResult = await pool.query(
      `SELECT o.*, a.street, a.city, a.reference
       FROM orders o
       LEFT JOIN addresses a ON o.address_id = a.id
       WHERE o.id = $1 AND o.user_id = $2`,
      [id, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const order = orderResult.rows[0];

    // Obtener items de la orden
    const itemsResult = await pool.query(
      `SELECT oi.*, 
              (SELECT json_agg(json_build_object('id', oie.id, 'name', oie.name, 'price', oie.price))
               FROM order_item_extras oie
               WHERE oie.order_item_id = oi.id) as extras
       FROM order_items oi
       WHERE oi.order_id = $1`,
      [id]
    );

    order.items = itemsResult.rows;

    res.json({ order });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

// ============================================
// ACTUALIZAR ESTADO DE ORDEN (Solo admin)
// ============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'on_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

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

    res.json({
      message: 'Estado actualizado exitosamente',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};

// ============================================
// CANCELAR ORDEN
// ============================================
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Solo se pueden cancelar órdenes en estado 'pending' o 'confirmed'
    const result = await pool.query(
      `UPDATE orders 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status IN ('pending', 'confirmed')
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ 
        error: 'No se puede cancelar la orden. Ya está en proceso o no existe.' 
      });
    }

    res.json({
      message: 'Orden cancelada exitosamente',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error al cancelar orden:', error);
    res.status(500).json({ error: 'Error al cancelar orden' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder
};