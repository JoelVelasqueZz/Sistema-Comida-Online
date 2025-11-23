import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import deliveryService from '../../services/deliveryService';
import './AvailableOrders.css';

const AvailableOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await deliveryService.getAvailableOrders();
      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
      alert('Error al cargar pedidos disponibles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Auto-refresh cada 30 segundos
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptOrder = async (orderId) => {
    if (!window.confirm('¿Deseas aceptar este pedido?')) return;

    setAccepting(orderId);
    try {
      await deliveryService.acceptOrder(orderId);
      alert('✅ Pedido aceptado exitosamente');
      navigate('/delivery/my-deliveries');
    } catch (error) {
      console.error('Error al aceptar pedido:', error);
      alert('Error al aceptar pedido: ' + (error.response?.data?.error || error.message));
    } finally {
      setAccepting(null);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando pedidos disponibles...</p>
      </div>
    );
  }

  return (
    <div className="available-orders-page">
      <header className="page-header">
        <h1>📦 Pedidos Disponibles</h1>
        <button onClick={fetchOrders} className="refresh-btn" disabled={loading}>
          🔄 Actualizar
        </button>
      </header>

      {orders.length === 0 ? (
        <div className="no-orders">
          <div className="no-orders-icon">📭</div>
          <h2>No hay pedidos disponibles</h2>
          <p>Los pedidos listos para recoger aparecerán aquí automáticamente</p>
          <p className="hint">La página se actualiza cada 30 segundos</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                <span className="order-amount">${parseFloat(order.total || 0).toFixed(2)}</span>
              </div>

              <div className="order-info">
                <div className="info-row">
                  <span className="icon">👤</span>
                  <div className="info-content">
                    <span className="label">Cliente</span>
                    <span className="value">{order.customer_name}</span>
                  </div>
                </div>

                <div className="info-row">
                  <span className="icon">📞</span>
                  <div className="info-content">
                    <span className="label">Teléfono</span>
                    <span className="value">{order.customer_phone}</span>
                  </div>
                </div>

                <div className="info-row">
                  <span className="icon">📍</span>
                  <div className="info-content">
                    <span className="label">Dirección</span>
                    <span className="value">{order.street}, {order.city}</span>
                  </div>
                </div>

                {order.reference && (
                  <div className="info-row reference">
                    <span className="icon">📝</span>
                    <div className="info-content">
                      <span className="label">Referencia</span>
                      <span className="value">{order.reference}</span>
                    </div>
                  </div>
                )}

                <div className="info-row waiting-time">
                  <span className="icon">⏱️</span>
                  <div className="info-content">
                    <span className="label">Esperando</span>
                    <span className="value">{Math.floor(order.minutes_waiting || 0)} minutos</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleAcceptOrder(order.id)}
                className="accept-btn"
                disabled={accepting === order.id}
              >
                {accepting === order.id ? '⏳ Aceptando...' : '✅ Aceptar Pedido'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AvailableOrders;
