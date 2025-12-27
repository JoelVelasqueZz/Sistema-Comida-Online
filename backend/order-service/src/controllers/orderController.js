const pool = require('../config/database');
const axios = require('axios');
const crypto = require('crypto');
const notificationController = require('./notificationController');

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

    // Guardar dirección automáticamente si no existe
    try {
      console.log('🏠 [Order] Verificando si guardar dirección...');

      // Verificar si ya existe una dirección idéntica
      const existingAddress = await pool.query(
        `SELECT id FROM addresses
         WHERE user_id = $1
         AND street = $2
         AND city = $3
         AND COALESCE(postal_code, '') = COALESCE($4, '')
         LIMIT 1`,
        [userId, delivery_address.street, delivery_address.city, delivery_address.postal_code || '']
      );

      if (existingAddress.rows.length === 0) {
        console.log('🏠 [Order] Guardando nueva dirección...');

        // Verificar si el usuario tiene direcciones
        const userAddressesCount = await pool.query(
          'SELECT COUNT(*) as count FROM addresses WHERE user_id = $1',
          [userId]
        );

        const isFirstAddress = parseInt(userAddressesCount.rows[0].count) === 0;

        await pool.query(
          `INSERT INTO addresses (user_id, street, city, postal_code, reference, is_default)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [userId, delivery_address.street, delivery_address.city, delivery_address.postal_code, delivery_address.reference, isFirstAddress]
        );

        console.log('✅ [Order] Dirección guardada automáticamente');
      } else {
        console.log('ℹ️  [Order] Dirección ya existe, no se guarda duplicado');
      }
    } catch (addressError) {
      // No fallar la orden si hay error al guardar la dirección
      console.error('⚠️  [Order] Error al guardar dirección (no crítico):', addressError);
    }

    // Crear notificación de pedido creado
    await notificationController.createNotification({
      user_id: userId,
      type: 'order_created',
      title: '✅ Pedido Creado',
      message: `Tu pedido #${order.id.substring(0, 8).toUpperCase()} ha sido creado exitosamente`,
      related_order_id: order.id,
      action_url: `/orders/${order.id}`
    });

    // Generar token de confirmación de pago si el método es 'transfer'
    let confirmationUrl = null;
    let paymentToken = null;

    if (payment_method === 'transfer') {
      paymentToken = crypto.randomBytes(32).toString('hex');

      // Actualizar orden con el token
      await pool.query(
        'UPDATE orders SET payment_token = $1, payment_status = $2 WHERE id = $3',
        [paymentToken, 'pending', order.id]
      );

      // Generar URL de confirmación
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      confirmationUrl = `${frontendUrl}/confirm-payment/${order.id}/${paymentToken}`;

      console.log('📱 QR generado:', confirmationUrl);
    }

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
      },
      confirmationUrl,
      paymentToken
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
      SELECT
        o.id, o.status, o.subtotal, o.delivery_fee, o.tax, o.total,
        o.payment_method, o.created_at, o.estimated_delivery,
        o.street, o.city, o.postal_code, o.reference,
        o.confirmed_at, o.preparing_at, o.ready_at, o.picked_up_at, o.delivered_at,
        u_delivery.name as delivery_person_name,
        u_delivery.phone as delivery_person_phone
      FROM orders o
      LEFT JOIN users u_delivery ON o.delivery_person_id = u_delivery.id
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
    const userRole = req.user.role;

    console.log(`📦 getOrderById - Usuario: ${userId}, Role: ${userRole}, OrderID: ${id}`);

    // Si es admin, puede ver cualquier pedido
    // Si es customer, solo puede ver sus propios pedidos
    const query = userRole === 'admin'
      ? `SELECT
          o.*,
          u_customer.name as user_name,
          u_customer.email as user_email,
          u_customer.phone as user_phone,
          u_delivery.name as delivery_person_name,
          u_delivery.phone as delivery_person_phone,
          u_delivery.email as delivery_person_email
         FROM orders o
         LEFT JOIN users u_customer ON o.user_id = u_customer.id
         LEFT JOIN users u_delivery ON o.delivery_person_id = u_delivery.id
         WHERE o.id = $1`
      : `SELECT
          o.*,
          u_customer.name as user_name,
          u_customer.email as user_email,
          u_customer.phone as user_phone,
          u_delivery.name as delivery_person_name,
          u_delivery.phone as delivery_person_phone,
          u_delivery.email as delivery_person_email
         FROM orders o
         LEFT JOIN users u_customer ON o.user_id = u_customer.id
         LEFT JOIN users u_delivery ON o.delivery_person_id = u_delivery.id
         WHERE o.id = $1 AND o.user_id = $2`;

    const params = userRole === 'admin' ? [id] : [id, userId];

    // Log de auditoría para admins
    if (userRole === 'admin') {
      console.log(`[AUDIT] Admin ${userId} accediendo al pedido ${id}`);
    }

    const orderResult = await pool.query(query, params);

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

    console.log(`✅ Orden ${id} obtenida exitosamente para ${userRole}`);

    res.json({ order });

  } catch (error) {
    console.error('Error al obtener orden:', error);
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

// ============================================
// ACTUALIZAR ESTADO DE ORDEN
// ============================================
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userRole = req.user.role;
    const userId = req.user.userId || req.user.id; // ✅ CAMBIO 1: Agregar fallback

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    // VALIDACIÓN: Admin puede cambiar a todos excepto 'delivering'
    if (userRole === 'admin') {
      const adminAllowedStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

      if (!adminAllowedStatuses.includes(status)) {
        return res.status(403).json({
          error: `Los administradores no pueden cambiar pedidos a "${status}"`,
          hint: 'El estado "En Camino" solo puede ser marcado por el repartidor al recoger el pedido'
        });
      }

      // Advertencia si marca como entregado sin repartidor
      if (status === 'delivered') {
        const orderCheck = await pool.query(
          'SELECT delivery_person_id FROM orders WHERE id = $1',
          [id]
        );

        if (orderCheck.rows.length > 0 && !orderCheck.rows[0].delivery_person_id) {
          console.log(`⚠️ Admin marcando pedido ${id} como entregado sin repartidor asignado`);
        }
      }
    }

    // VALIDACIÓN: Repartidor solo puede cambiar sus propios pedidos asignados
    if (userRole === 'delivery') {
      const orderCheck = await pool.query(
        'SELECT delivery_person_id FROM orders WHERE id = $1',
        [id]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Pedido no encontrado' });
      }

      if (orderCheck.rows[0].delivery_person_id !== userId) {
        return res.status(403).json({ error: 'Este pedido no está asignado a ti' });
      }
    }

    // Determinar qué columna de timestamp actualizar según el estado
    let timestampColumn = null;

    switch(status) {
      case 'confirmed':
        timestampColumn = 'confirmed_at';
        break;
      case 'preparing':
        timestampColumn = 'preparing_at';
        break;
      case 'ready':
        timestampColumn = 'ready_at';
        break;
      case 'delivering':
        timestampColumn = 'picked_up_at';
        break;
      case 'delivered':
        timestampColumn = 'delivered_at';
        break;
      default:
        timestampColumn = null;
    }

    // Construir query dinámicamente
    let query;
    if (timestampColumn) {
      query = `
        UPDATE orders
        SET status = $1,
            ${timestampColumn} = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    } else {
      query = `
        UPDATE orders
        SET status = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `;
    }

    // Ejecutar la actualización
    const result = await pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Obtener información completa del pedido con datos del repartidor
    const orderInfoQuery = await pool.query(
      `SELECT
        o.*,
        u_customer.name as customer_name,
        u_customer.phone as customer_phone,
        u_delivery.name as delivery_person_name,
        u_delivery.phone as delivery_person_phone
       FROM orders o
       LEFT JOIN users u_customer ON o.user_id = u_customer.id
       LEFT JOIN users u_delivery ON o.delivery_person_id = u_delivery.id
       WHERE o.id = $1`,
      [id]
    );

    // Crear notificación según el estado
    const orderData = orderInfoQuery.rows[0];

    console.log('🔍 DEBUG - orderData completo:', orderData);
    console.log('🔍 DEBUG - orderData.user_id:', orderData.user_id);
    console.log('🔍 DEBUG - status:', status);

    const statusMessages = {
      confirmed: {
        title: '✅ Pedido Confirmado',
        message: 'Tu pedido ha sido confirmado y está siendo preparado'
      },
      preparing: {
        title: '👨‍🍳 En Preparación',
        message: 'Los chefs están preparando tu pedido'
      },
      ready: {
        title: '📦 Listo para Entrega',
        message: 'Tu pedido está listo, un repartidor lo recogerá pronto'
      },
      delivering: {
        title: '🚚 En Camino',
        message: 'Tu pedido está en camino, llegará pronto'
      },
      delivered: {
        title: '🎉 Entregado',
        message: '¡Tu pedido ha sido entregado! Esperamos que lo disfrutes'
      },
      cancelled: {
        title: '❌ Pedido Cancelado',
        message: 'Tu pedido ha sido cancelado'
      }
    };

    const config = statusMessages[status];

    console.log('🔍 DEBUG - config encontrado:', config);
    console.log('🔍 DEBUG - Condición (config && orderData.user_id):', !!(config && orderData.user_id));

    if (config && orderData.user_id) {
      console.log(`📧 INTENTANDO crear notificación para user_id: ${orderData.user_id}`);
      console.log(`📧 Tipo: ${status} - ${config.title}`);

      try {
        const notifResult = await notificationController.createNotification({
          user_id: orderData.user_id,
          type: 'status_changed',
          title: config.title,
          message: config.message,
          related_order_id: id,
          action_url: `/orders/${id}`
        });

        console.log(`✅ Notificación creada EXITOSAMENTE:`, notifResult);
      } catch (notifError) {
        console.error(`❌ ERROR al crear notificación:`, notifError);
        console.error(`❌ Stack:`, notifError.stack);
      }
    } else {
      console.log('⚠️ NO se creará notificación - Razones:');
      console.log('   - config existe?', !!config);
      console.log('   - orderData.user_id existe?', !!orderData.user_id);
    }

    // Log para auditoría
    console.log(`📝 Pedido ${id} cambió a estado "${status}" por ${userRole} (${userId})`);
    if (timestampColumn) {
      console.log(`⏰ Timestamp guardado: ${timestampColumn} = NOW()`);
    }

    res.json({
      message: 'Estado actualizado exitosamente',
      order: orderInfoQuery.rows[0]
    });

  } catch (error) {
    console.error('❌ Error al actualizar estado:', error);
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

// ============================================
// OBTENER ESTADÍSTICAS DE PEDIDOS DE UN USUARIO
// ============================================
const getUserOrderStats = async (req, res) => {
  try {
    const { userId } = req.params;

    console.log('📊 getUserOrderStats - Usuario:', userId);

    // Obtener estadísticas generales
    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_orders,
        COALESCE(SUM(total), 0) as total_spent,
        COALESCE(AVG(total), 0) as average_order,
        MAX(created_at) as last_order_date
       FROM orders
       WHERE user_id = $1 AND status != 'cancelled'`,
      [userId]
    );

    const stats = statsResult.rows[0];

    res.json({
      success: true,
      stats: {
        totalOrders: parseInt(stats.total_orders),
        totalSpent: parseFloat(stats.total_spent),
        averageOrder: parseFloat(stats.average_order),
        lastOrderDate: stats.last_order_date
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas del usuario:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
};

// ============================================
// CONFIRMAR PAGO POR QR
// ============================================
const confirmPayment = async (req, res) => {
  try {
    const { orderId, token } = req.params;

    console.log(`💳 Confirmación de pago - Orden: ${orderId}`);

    // Verificar token
    const result = await pool.query(
      `SELECT id, payment_status, payment_token, total, payment_method
       FROM orders
       WHERE id = $1 AND payment_token = $2`,
      [orderId, token]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Orden no encontrada o token inválido'
      });
    }

    const order = result.rows[0];

    if (order.payment_status === 'completed') {
      return res.json({
        success: true,
        message: 'Esta orden ya fue pagada anteriormente',
        alreadyPaid: true
      });
    }

    // Validar que sea método de pago transfer
    if (order.payment_method !== 'transfer') {
      return res.status(400).json({
        success: false,
        error: 'Este método de confirmación solo es válido para pagos por transferencia'
      });
    }

    // Marcar como pagada
    await pool.query(
      `UPDATE orders
       SET payment_status = 'completed',
           payment_confirmed_at = NOW(),
           updated_at = NOW()
       WHERE id = $1`,
      [orderId]
    );

    console.log(`✅ Pago confirmado para orden ${orderId}`);

    res.json({
      success: true,
      message: 'Pago confirmado exitosamente',
      orderId,
      total: parseFloat(order.total)
    });
  } catch (error) {
    console.error('Error al confirmar pago:', error);
    res.status(500).json({
      success: false,
      error: 'Error al confirmar pago'
    });
  }
};

module.exports = {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  confirmDelivery,
  getUserOrderStats,
  confirmPayment
};