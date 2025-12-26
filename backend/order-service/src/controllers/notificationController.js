const pool = require('../config/database');

// Obtener notificaciones del usuario
const getUserNotifications = async (req, res) => {
  try {
    // CRÍTICO: El token puede tener 'userId' o 'id'
    const user_id = req.user.userId || req.user.id;
    
    console.log('🔔 [Notifications] Buscando para user_id:', user_id);
    
    const { limit = 10, offset = 0, unread_only = false } = req.query;
    
    let query = `
      SELECT * FROM notifications 
      WHERE user_id = $1
    `;
    
    if (unread_only === 'true') {
      query += ` AND is_read = false`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
    
    const result = await pool.query(query, [user_id, limit, offset]);
    
    console.log('🔔 [Notifications] Notificaciones encontradas:', result.rows.length);
    
    // Contar no leídas
    const unreadResult = await pool.query(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND is_read = false',
      [user_id]
    );
    
    res.json({ 
      success: true, 
      notifications: result.rows,
      unread_count: parseInt(unreadResult.rows[0].count)
    });
  } catch (error) {
    console.error('❌ [Notifications] Error:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

// Marcar notificación como leída
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.userId || req.user.id; // ✅ CAMBIO 1
    
    console.log('[markAsRead] INICIO');
    console.log('[markAsRead] Notification ID:', id);
    console.log('[markAsRead] User ID del token:', user_id);
    console.log('[markAsRead] req.user completo:', req.user);
    
    // Primero verificar si la notificación existe
    const checkResult = await pool.query(
      'SELECT * FROM notifications WHERE id = $1',
      [id]
    );
    
    console.log('📋 [markAsRead] Notificación encontrada en BD:', checkResult.rows[0]);
    
    if (checkResult.rows.length === 0) {
      console.log('[markAsRead] Notificación NO existe en BD');
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    const notif = checkResult.rows[0];
    console.log('[markAsRead] user_id de la notificación:', notif.user_id);
    console.log('[markAsRead] ¿Coinciden?', notif.user_id === user_id);
    
    if (notif.user_id !== user_id) {
      console.log('[markAsRead] user_id NO coincide');
      console.log('   Esperado:', user_id);
      console.log('   En BD:', notif.user_id);
      return res.status(404).json({ error: 'Notificación no encontrada' });
    }
    
    // Actualizar
    const result = await pool.query(
      `UPDATE notifications 
       SET is_read = true 
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, user_id]
    );
    
    console.log('[markAsRead] Notificación marcada como leída');
    
    res.json({ success: true, notification: result.rows[0] });
  } catch (error) {
    console.error('[markAsRead] Error:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

// Marcar todas como leídas
const markAllAsRead = async (req, res) => {
  try {
    // CRÍTICO: Usar userId en lugar de id
    const user_id = req.user.userId || req.user.id;
    
    console.log('📋 Marcando todas como leídas para user_id:', user_id);

    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false',
      [user_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

// Crear notificación (función interna)
const createNotification = async (notificationData) => {
  try {
    console.log('📧 [createNotification] Recibiendo datos:', notificationData);

    const { user_id, type, title, message, related_order_id, action_url } = notificationData;

    if (!user_id) {
      console.error('❌ [createNotification] user_id es requerido');
      return null;
    }

    console.log('📧 [createNotification] Insertando en BD...');

    const result = await pool.query(
      `INSERT INTO notifications (user_id, type, title, message, related_order_id, action_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, type, title, message, related_order_id, action_url]
    );

    console.log('✅ [createNotification] Notificación insertada:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('❌ [createNotification] Error completo:', error);
    console.error('❌ [createNotification] Stack:', error.stack);
    return null;
  }
};

// Eliminar notificación
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [id, user_id]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al eliminar notificación' });
  }
};

module.exports = {
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification
};
