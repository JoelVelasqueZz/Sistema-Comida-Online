const pool = require('../config/database');
const axios = require('axios');

// ============================================
// PROCESAR PAGO
// ============================================
const processPayment = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.userId;
    const { order_id, payment_method, payment_data } = req.body;

    // Validaciones
    if (!order_id || !payment_method) {
      return res.status(400).json({ 
        error: 'Order ID y método de pago son obligatorios' 
      });
    }

    await client.query('BEGIN');

    // 1. Verificar que la orden existe y pertenece al usuario
    const orderResult = await client.query(
      'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
      [order_id, userId]
    );

    if (orderResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    const order = orderResult.rows[0];

    // 2. Verificar que la orden no haya sido pagada ya
    const existingPayment = await client.query(
      'SELECT * FROM payments WHERE order_id = $1 AND status = $2',
      [order_id, 'completed']
    );

    if (existingPayment.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Esta orden ya ha sido pagada' });
    }

    // 3. Simular procesamiento de pago según el método
    let paymentStatus = 'pending';
    let transactionId = null;
    let errorMessage = null;

    if (payment_method === 'cash') {
      // Pago en efectivo - se marca como pendiente hasta la entrega
      paymentStatus = 'pending';
      transactionId = `CASH-${Date.now()}`;
    } else if (payment_method === 'card' || payment_method === 'online') {
      // Simular procesamiento de tarjeta/online
      // En producción, aquí integrarías con Stripe, PayPal, etc.
      try {
        // Simulación de éxito (90% de probabilidad)
        const isSuccess = Math.random() > 0.1;
        
        if (isSuccess) {
          paymentStatus = 'completed';
          transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        } else {
          paymentStatus = 'failed';
          errorMessage = 'Fondos insuficientes o tarjeta rechazada';
        }
      } catch (error) {
        paymentStatus = 'failed';
        errorMessage = error.message;
      }
    }

    // 4. Crear registro de pago
    const paymentResult = await client.query(
      `INSERT INTO payments 
       (order_id, amount, status, payment_method, transaction_id, payment_data, error_message)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        order_id,
        order.total,
        paymentStatus,
        payment_method,
        transactionId,
        JSON.stringify(payment_data || {}),
        errorMessage
      ]
    );

    const payment = paymentResult.rows[0];

    // 5. Actualizar estado de la orden si el pago fue exitoso
    if (paymentStatus === 'completed') {
      await client.query(
        `UPDATE orders 
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order_id]
      );
    }

    await client.query('COMMIT');

    // 6. Enviar respuesta
    if (paymentStatus === 'completed') {
      res.status(201).json({
        message: 'Pago procesado exitosamente',
        payment: {
          id: payment.id,
          order_id: payment.order_id,
          amount: parseFloat(payment.amount),
          status: payment.status,
          payment_method: payment.payment_method,
          transaction_id: payment.transaction_id,
          created_at: payment.created_at
        }
      });
    } else if (paymentStatus === 'pending') {
      res.status(201).json({
        message: 'Pago registrado, pendiente de confirmación',
        payment: {
          id: payment.id,
          order_id: payment.order_id,
          amount: parseFloat(payment.amount),
          status: payment.status,
          payment_method: payment.payment_method,
          created_at: payment.created_at
        }
      });
    } else {
      res.status(400).json({
        error: 'Pago rechazado',
        message: errorMessage,
        payment: {
          id: payment.id,
          status: payment.status,
          error_message: payment.error_message
        }
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error al procesar pago:', error);
    res.status(500).json({ error: 'Error al procesar pago' });
  } finally {
    client.release();
  }
};

// ============================================
// OBTENER PAGO POR ORDER ID
// ============================================
const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Verificar que la orden pertenece al usuario
    const orderResult = await pool.query(
      'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
      [orderId, userId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Obtener el pago
    const paymentResult = await pool.query(
      `SELECT id, order_id, amount, status, payment_method, 
              transaction_id, created_at, updated_at
       FROM payments
       WHERE order_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [orderId]
    );

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pago no encontrado' });
    }

    res.json({ payment: paymentResult.rows[0] });

  } catch (error) {
    console.error('Error al obtener pago:', error);
    res.status(500).json({ error: 'Error al obtener pago' });
  }
};

// ============================================
// OBTENER HISTORIAL DE PAGOS DEL USUARIO
// ============================================
const getUserPayments = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT p.id, p.order_id, p.amount, p.status, p.payment_method,
              p.transaction_id, p.created_at,
              o.status as order_status
       FROM payments p
       INNER JOIN orders o ON p.order_id = o.id
       WHERE o.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      payments: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({ error: 'Error al obtener pagos' });
  }
};

// ============================================
// REEMBOLSAR PAGO (Solo admin)
// ============================================
const refundPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el pago existe y está completado
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1 AND status = $2',
      [id, 'completed']
    );

    if (paymentResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Pago no encontrado o no puede ser reembolsado' 
      });
    }

    // Actualizar estado a refunded
    const result = await pool.query(
      `UPDATE payments 
       SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    // Actualizar estado de la orden
    const payment = result.rows[0];
    await pool.query(
      `UPDATE orders 
       SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [payment.order_id]
    );

    res.json({
      message: 'Reembolso procesado exitosamente',
      payment: result.rows[0]
    });

  } catch (error) {
    console.error('Error al reembolsar pago:', error);
    res.status(500).json({ error: 'Error al reembolsar pago' });
  }
};

// ============================================
// WEBHOOK PARA PASARELAS DE PAGO (Ejemplo)
// ============================================
const paymentWebhook = async (req, res) => {
  try {
    // En producción, aquí verificarías la firma del webhook
    const { transaction_id, status, order_id } = req.body;

    if (!transaction_id || !status) {
      return res.status(400).json({ error: 'Datos inválidos' });
    }

    // Actualizar estado del pago
    await pool.query(
      `UPDATE payments 
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE transaction_id = $2`,
      [status, transaction_id]
    );

    // Si el pago fue completado, actualizar orden
    if (status === 'completed' && order_id) {
      await pool.query(
        `UPDATE orders 
         SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order_id]
      );
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Error en webhook:', error);
    res.status(500).json({ error: 'Error al procesar webhook' });
  }
};

module.exports = {
  processPayment,
  getPaymentByOrderId,
  getUserPayments,
  refundPayment,
  paymentWebhook
};