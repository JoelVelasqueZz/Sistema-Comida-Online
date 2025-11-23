import React, { useState, useEffect } from 'react';
import deliveryService from '../../services/deliveryService';
import './MyDeliveries.css';

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  const fetchDeliveries = async () => {
    try {
      const data = await deliveryService.getMyDeliveries();
      setDeliveries(data.deliveries || []);
    } catch (error) {
      console.error('Error al cargar entregas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();

    // Auto-refresh cada 15 segundos
    const interval = setInterval(fetchDeliveries, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkDelivering = async (orderId) => {
    if (!window.confirm('¿Confirmar que recogiste el pedido?')) return;

    setProcessing(orderId);
    try {
      await deliveryService.markAsDelivering(orderId);
      alert('✅ Pedido marcado como en camino');
      fetchDeliveries();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar estado: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm('¿Confirmar que entregaste el pedido al cliente?')) return;

    setProcessing(orderId);
    try {
      await deliveryService.confirmDelivery(orderId);
      alert('🎉 Entrega confirmada exitosamente');
      fetchDeliveries();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al confirmar entrega: ' + (error.response?.data?.error || error.message));
    } finally {
      setProcessing(null);
    }
  };

  const openMaps = (street, city) => {
    const address = `${street}, ${city}`;
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  const callCustomer = (phone) => {
    window.location.href = `tel:${phone}`;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando entregas...</p>
      </div>
    );
  }

  const activeDelivery = deliveries.find(d => d.status === 'delivering');
  const acceptedOrders = deliveries.filter(d => d.status === 'ready');

  return (
    <div className="my-deliveries-page">
      <h1>🚚 Mis Entregas</h1>

      {activeDelivery && (
        <div className="active-delivery-section">
          <h2>⭐ Entrega Activa</h2>
          <div className="delivery-card active">
            <div className="card-header">
              <div>
                <h3>Pedido #{activeDelivery.id.slice(0, 8).toUpperCase()}</h3>
                <span className="status-badge delivering">🚚 En Camino</span>
              </div>
              <span className="amount">${parseFloat(activeDelivery.total || 0).toFixed(2)}</span>
            </div>

            <div className="delivery-info">
              <div className="info-row">
                <span className="icon">👤</span>
                <div>
                  <span className="label">Cliente</span>
                  <span className="value">{activeDelivery.customer_name}</span>
                </div>
              </div>

              <div className="info-row">
                <span className="icon">📞</span>
                <div>
                  <span className="label">Teléfono</span>
                  <span className="value">{activeDelivery.customer_phone}</span>
                </div>
                <button
                  onClick={() => callCustomer(activeDelivery.customer_phone)}
                  className="call-btn"
                >
                  📞 Llamar
                </button>
              </div>

              <div className="info-row">
                <span className="icon">📍</span>
                <div>
                  <span className="label">Dirección</span>
                  <span className="value">{activeDelivery.street}, {activeDelivery.city}</span>
                </div>
              </div>

              {activeDelivery.reference && (
                <div className="info-row reference">
                  <span className="icon">📝</span>
                  <div>
                    <span className="label">Referencia</span>
                    <span className="value">{activeDelivery.reference}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="delivery-actions">
              <button
                onClick={() => openMaps(activeDelivery.street, activeDelivery.city)}
                className="map-btn"
              >
                🗺️ Ver en Mapa
              </button>
              <button
                onClick={() => handleConfirmDelivery(activeDelivery.id)}
                className="confirm-btn"
                disabled={processing === activeDelivery.id}
              >
                {processing === activeDelivery.id ? '⏳ Confirmando...' : '✅ Confirmar Entrega'}
              </button>
            </div>
          </div>
        </div>
      )}

      {acceptedOrders.length > 0 && (
        <div className="accepted-orders-section">
          <h2>📦 Pedidos Aceptados (Para Recoger)</h2>
          {acceptedOrders.map(order => (
            <div key={order.id} className="delivery-card">
              <div className="card-header">
                <div>
                  <h3>Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                  <span className="status-badge ready">📦 Listo</span>
                </div>
                <span className="amount">${parseFloat(order.total || 0).toFixed(2)}</span>
              </div>

              <div className="delivery-info">
                <div className="info-row">
                  <span className="icon">👤</span>
                  <div>
                    <span className="label">Cliente</span>
                    <span className="value">{order.customer_name}</span>
                  </div>
                </div>

                <div className="info-row">
                  <span className="icon">📍</span>
                  <div>
                    <span className="label">Dirección</span>
                    <span className="value">{order.street}, {order.city}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => handleMarkDelivering(order.id)}
                className="pickup-btn"
                disabled={processing === order.id}
              >
                {processing === order.id ? '⏳ Procesando...' : '🚚 Marcar como Recogido'}
              </button>
            </div>
          ))}
        </div>
      )}

      {deliveries.length === 0 && (
        <div className="no-deliveries">
          <div className="no-deliveries-icon">📭</div>
          <h2>No tienes entregas activas</h2>
          <p>Acepta pedidos desde la página de disponibles</p>
          <a href="/delivery/available-orders" className="link-btn">
            Ver Pedidos Disponibles →
          </a>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
