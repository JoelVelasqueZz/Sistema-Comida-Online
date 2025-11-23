const pool = require('../config/database');

// ============================================
// SCHEDULER PARA CAMBIOS AUTOMÁTICOS DE ESTADO
// ============================================

/**
 * Cambia órdenes de 'pending' a 'confirmed' después de 2 minutos
 */
const autoConfirmOrders = async () => {
  try {
    const result = await pool.query(
      `UPDATE orders
       SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
       WHERE status = 'pending'
         AND created_at < NOW() - INTERVAL '2 minutes'
       RETURNING id`
    );

    if (result.rows.length > 0) {
      console.log(`✅ Auto-confirmadas ${result.rows.length} órdenes`);

      // Registrar en historial
      for (const order of result.rows) {
        try {
          await pool.query(
            `INSERT INTO order_status_history (order_id, status, changed_by, change_type, notes)
             VALUES ($1, 'confirmed', NULL, 'automatic', 'Confirmación automática después de 2 minutos')`,
            [order.id]
          );
        } catch (e) {
          console.warn('⚠️ No se pudo registrar en historial:', e.message);
        }
      }
    }
  } catch (error) {
    console.error('❌ Error en auto-confirmación:', error);
  }
};

/**
 * Cambia órdenes de 'preparing' a 'ready' después del preparation_time
 * Usa el tiempo de preparación MÁS LARGO de los productos en la orden
 * El cambio a 'delivering' debe ser manual por el repartidor
 */
const autoMarkAsReady = async () => {
  try {
    // Obtener órdenes en 'preparing' con el tiempo máximo de preparación
    const ordersToUpdate = await pool.query(
      `SELECT o.id,
              o.updated_at,
              MAX(p.preparation_time) as max_prep_time
       FROM orders o
       JOIN order_items oi ON o.id = oi.order_id
       JOIN products p ON oi.product_id = p.id
       WHERE o.status = 'preparing'
       GROUP BY o.id, o.updated_at
       HAVING o.updated_at < NOW() - (MAX(p.preparation_time) || ' minutes')::INTERVAL`
    );

    for (const order of ordersToUpdate.rows) {
      // Actualizar a 'ready' (listo para entregar)
      await pool.query(
        `UPDATE orders
         SET status = 'ready', ready_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [order.id]
      );

      // Registrar en historial
      try {
        await pool.query(
          `INSERT INTO order_status_history (order_id, status, changed_by, change_type, notes)
           VALUES ($1, 'ready', NULL, 'automatic', $2)`,
          [order.id, `Pedido listo para entregar después de ${order.max_prep_time} minutos de preparación`]
        );
      } catch (e) {
        console.warn('⚠️ No se pudo registrar en historial:', e.message);
      }

      console.log(`✅ Orden ${order.id} marcada como 'ready' (tiempo de preparación: ${order.max_prep_time} min)`);
    }

    if (ordersToUpdate.rows.length > 0) {
      console.log(`✅ Total: ${ordersToUpdate.rows.length} órdenes marcadas como 'ready'`);
    }
  } catch (error) {
    console.error('❌ Error en auto-ready:', error);
  }
};

/**
 * Inicia los schedulers
 */
const startSchedulers = () => {
  console.log('🔄 Iniciando schedulers de órdenes...');

  // Auto-confirmar órdenes cada 1 minuto
  setInterval(autoConfirmOrders, 60 * 1000); // 1 minuto

  // Auto-marcar como 'ready' cada 1 minuto (después del tiempo de preparación)
  setInterval(autoMarkAsReady, 60 * 1000); // 1 minuto

  // Ejecutar inmediatamente al inicio
  autoConfirmOrders();
  autoMarkAsReady();

  console.log('✅ Schedulers iniciados:');
  console.log('   - Auto-confirmación (pending → confirmed): cada 1 minuto');
  console.log('   - Auto-listo (preparing → ready): cada 1 minuto');
};

module.exports = {
  startSchedulers,
  autoConfirmOrders,
  autoMarkAsReady
};
