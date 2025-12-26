import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import notificationService from '../../services/notificationService';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();

    // Polling cada 30 segundos
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
  try {
    const data = await notificationService.getNotifications();
    
    console.log('🔔 Notificaciones recibidas:', data.notifications?.length);
    
    // CRÍTICO: Solo actualizar si realmente cambió algo
    setNotifications(prev => {
      const newNotifs = data.notifications || [];
      
      // Si es la misma cantidad y mismos IDs, mantener estado local
      if (prev.length === newNotifs.length && prev.length > 0) {
        const sameIds = prev.every((p, i) => p.id === newNotifs[i]?.id);
        const sameReadStatus = prev.every((p, i) => p.is_read === newNotifs[i]?.is_read);
        
        if (sameIds && sameReadStatus) {
          console.log('🔔 Sin cambios, manteniendo estado local');
          return prev;
        }
      }
      
      return newNotifs;
    });
    
    setUnreadCount(data.unread_count || 0);
  } catch (error) {
    console.error('❌ Error cargando notificaciones:', error);
  }
};

  const handleNotificationClick = async (notification) => {
  try {
    console.log('🔔 Click en notificación:', notification);
    
    // Marcar como leída si no lo está
    if (!notification.is_read) {
      await notificationService.markAsRead(notification.id);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    
    // Cerrar dropdown
    setIsOpen(false);
    
    // Redirigir si tiene action_url
    if (notification.action_url) {
      console.log('🔔 Redirigiendo a:', notification.action_url);
      navigate(notification.action_url);
    } else if (notification.related_order_id) {
      // Fallback: si no tiene action_url pero tiene related_order_id
      console.log('🔔 Redirigiendo a orden:', notification.related_order_id);
      navigate(`/order/${notification.related_order_id}`);
    }
  } catch (error) {
    console.error('❌ Error al procesar notificación:', error);
  }
};

  const handleMarkAllRead = async () => {
  try {
    setLoading(true);
    
    console.log('📋 Marcando todas como leídas...');
    
    await notificationService.markAllAsRead();
    
    // Actualizar estado local inmediatamente
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    
    console.log('✅ Todas marcadas como leídas');
  } catch (error) {
    console.error('❌ Error:', error);
    alert('Error al marcar notificaciones como leídas');
  } finally {
    setLoading(false);
  }
};

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Hace un momento';
    if (seconds < 3600) return `Hace ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Hace ${Math.floor(seconds / 3600)} h`;
    return `Hace ${Math.floor(seconds / 86400)} días`;
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notificaciones"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notificaciones</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="mark-all-read-btn"
                disabled={loading}
              >
                Marcar todas como leídas
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notif-icon">🔕</span>
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                >
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notif-time">{getTimeAgo(notif.created_at)}</span>
                  </div>
                  {!notif.is_read && <span className="unread-dot"></span>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/notifications');
                }}
                className="view-all-btn"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
