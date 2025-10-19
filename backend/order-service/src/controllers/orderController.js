const pool = require('../config/database');
const axios = require('axios');

// ============================================
// CREAR ORDEN
// ============================================
const createOrder = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const { items, payment_method, special_instructions, delivery_address } = req.body;
    console.log('Creando orden para usuario:', userId);
    console.log('   Items:', items);
    console.log('   Dirección:', delivery_address);

    // Validaciones
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Debe incluir al menos un producto' });
    }

    if (!delivery_address || !delivery_address.street || !delivery_address.city) {
      return res.status(400).json({ error: 'Debe proporcionar una dirección de entrega válida' });
    }

    await client.query('BEGIN');

    // Calcular subtotal y validar productos
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      // Obtener información del producto
      const productResult = await client.query(
        'SELECT * FROM products WHERE id = $1 AND is_available = true',
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Producto ${item.product_id} no disponible` 
        });
      }

      const product = productResult.rows[0];
      let itemPrice = parseFloat(product.price);

      // Calcular precio de extras
      let extrasPrice = 0;
      const itemExtras = [];

      if (item.extras && item.extras.length > 0) {
        const extrasResult = await client.query(
          'SELECT * FROM product_extras WHERE id = ANY($1) AND product_id = $2',
          [item.extras, item.product_id]
        );

        for (const extra of extrasResult.rows) {
          extrasPrice += parseFloat(extra.price);
          itemExtras.push(extra);
        }
      }

      const itemTotal = (itemPrice + extrasPrice) * item.quantity;
      subtotal += itemTotal;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: itemPrice,
        extras: itemExtras,
        item_total: itemTotal
      });
    }

    // Calcular totales
    const deliveryFee = 2.50;
    const tax = subtotal * 0.12;
    const total = subtotal + deliveryFee + tax;

    console.log('Totales calculados:');
    console.log('   Subtotal:', subtotal);
    console.log('   Delivery:', deliveryFee);
    console.log('   Tax:', tax);
    console.log('   Total:', total);

    // Crear la orden (sin address_id)
    const orderResult = await client.query(
      `INSERT INTO orders 
       (user_id, status, subtotal, delivery_fee, tax, total, payment_method, special_instructions, 
        street, city, postal_code, reference)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        userId, 
        'pending', 
        subtotal, 
        deliveryFee, 
        tax, 
        total, 
        payment_method || 'cash',
        special_instructions || null,
        delivery_address.street,
        delivery_address.city,
        delivery_address.postal_code || '',
        delivery_address.reference || ''
      ]
    );

    const order = orderResult.rows[0];
    console.log('Orden creada con ID:', order.id);

    // Insertar items de la orden
    for (const item of validatedItems) {
    // Obtener el nombre del producto
    const productInfo = await client.query(
      'SELECT name FROM products WHERE id = $1',
      [item.product_id]
    );

      const itemSubtotal = item.unit_price * item.quantity;

      const orderItemResult = await client.query(
        `INSERT INTO order_items 
        (order_id, product_id, product_name, quantity, unit_price, subtotal)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id`,
        [order.id, item.product_id, productInfo.rows[0].name, item.quantity, item.unit_price, itemSubtotal]
      );

      const orderItemId = orderItemResult.rows[0].id;

      // Insertar extras del item
      if (item.extras.length > 0) {
        for (const extra of item.extras) {
          await client.query(
            `INSERT INTO order_item_extras (order_item_id, extra_id, name, price)
            VALUES ($1, $2, $3, $4)`,
            [orderItemId, extra.id, extra.name, extra.price]
          );
        }
      }
    }

    await client.query('COMMIT');
    console.log('Orden completada exitosamente');

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
        street: order.street,
        city: order.city,
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

    console.log('📋 getUserOrders - Usuario:', userId);
    console.log('📋 getUserOrders - Filtro status:', status);

    let query = `
      SELECT o.id, o.status, o.subtotal, o.delivery_fee, o.tax, o.total,
             o.payment_method, o.created_at, o.estimated_delivery,
             o.street, o.city, o.postal_code, o.reference
      FROM orders o
      WHERE o.user_id = $1
    `;

    const values = [userId];

    if (status) {
      query += ' AND o.status = $2';
      values.push(status);
      console.log('   Aplicando filtro de estado:', status);
    } else {
      console.log('   Sin filtro de estado (todos)');
    }

    query += ' ORDER BY o.created_at DESC';

    console.log('   Query SQL:', query);
    console.log('   Valores:', values);

    const result = await pool.query(query, values);

    console.log(`✅ Encontradas ${result.rows.length} órdenes`);
    if (result.rows.length > 0) {
      console.log('   Estados únicos:', [...new Set(result.rows.map(r => r.status))]);
    }

    res.json({
      orders: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('❌ Error al obtener órdenes:', error);
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
      `SELECT o.*
       FROM orders o
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

    const validStatuses = ['pending', 'confirmed', 'preparing', 'delivering', 'delivered', 'cancelled'];

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

// ============================================
// CONFIRMAR ENTREGA (CLIENTE)
// ============================================
const confirmDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    console.log(`📦 Cliente ${userId} confirmando entrega de orden ${id}`);

    // Solo se puede confirmar entrega si está en estado 'delivering'
    const result = await pool.query(
      `UPDATE orders
       SET status = 'delivered', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND status = 'delivering'
       RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({
        error: 'No se puede confirmar la entrega. El pedido no está en camino o no existe.'
      });
    }

    // Registrar en historial
    try {
      await pool.query(
        `INSERT INTO order_status_history (order_id, status, changed_by, change_type, notes)
         VALUES ($1, 'delivered', $2, 'manual', 'Entrega confirmada por el cliente')`,
        [id, userId]
      );
    } catch (e) {
      console.warn('⚠️ No se pudo registrar en historial:', e.message);
    }

    console.log(`✅ Entrega confirmada para orden ${id}`);

    res.json({
      message: 'Entrega confirmada exitosamente',
      order: result.rows[0]
    });

  } catch (error) {
    console.error('Error al confirmar entrega:', error);
    res.status(500).json({ error: 'Error al confirmar entrega' });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  confirmDelivery
};