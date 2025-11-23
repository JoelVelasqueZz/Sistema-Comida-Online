import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(''); // Limpiar error previo
        const statusFilter = filter === 'all' ? null : filter;

        console.log('📋 [Orders.jsx] Filtro activo:', filter);
        console.log('📋 [Orders.jsx] Enviando a API:', statusFilter);

        const data = await orderService.getUserOrders(statusFilter);

        console.log('📦 [Orders.jsx] Datos recibidos:', data);
        console.log('✅ [Orders.jsx] Total órdenes:', data.orders?.length || 0);

        setOrders(data.orders || []);
      } catch (err) {
        console.error('❌ [Orders.jsx] Error al cargar órdenes:', err);
        console.error('Error details:', err.response?.data);
        setError('Error al cargar tus pedidos');
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [filter]);

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      preparing: 'badge-preparing',
      ready: 'badge-ready',
      delivering: 'badge-delivering',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled'
    };
    return statusMap[status] || 'badge-pending';
  };

  const getStatusConfig = (status) => {
    const config = {
      pending: { text: 'Pendiente', emoji: '⏳' },
      confirmed: { text: 'Confirmado', emoji: '✅' },
      preparing: { text: 'En preparación', emoji: '👨‍🍳' },
      ready: { text: 'Listo', emoji: '📦' },
      delivering: { text: 'En camino', emoji: '🚚' },
      delivered: { text: 'Entregado', emoji: '🎉' },
      cancelled: { text: 'Cancelado', emoji: '❌' }
    };
    return config[status] || config.pending;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido?')) {
      return;
    }

    try {
      await orderService.cancelOrder(orderId);
      const statusFilter = filter === 'all' ? null : filter;
      const data = await orderService.getUserOrders(statusFilter);
      setOrders(data.orders);
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      setError(err.response?.data?.error || 'No se pudo cancelar el pedido');
    }
  };

  if (loading) {
    return (
      <div className="orders-loading">
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted mt-4">Cargando tus pedidos...</p>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container container-6xl">
        {/* Header */}
        <div className="orders-header animate-fade-in-up">
          <h1 className="heading-1">📦 Mis Pedidos</h1>
          <p className="text-lg text-muted">Historial completo de tus órdenes</p>
        </div>

        {/* Filters */}
        <div className="orders-filters animate-fade-in-up animate-delay-1">
          <button
            onClick={() => setFilter('all')}
            className={`filter-chip ${filter === 'all' ? 'active' : ''} hover-grow`}
          >
            📋 Todos
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`filter-chip ${filter === 'pending' ? 'active' : ''} hover-grow`}
          >
            ⏳ Pendientes
          </button>
          <button
            onClick={() => setFilter('confirmed')}
            className={`filter-chip ${filter === 'confirmed' ? 'active' : ''} hover-grow`}
          >
            ✅ Confirmados
          </button>
          <button
            onClick={() => setFilter('preparing')}
            className={`filter-chip ${filter === 'preparing' ? 'active' : ''} hover-grow`}
          >
            👨‍🍳 Preparando
          </button>
          <button
            onClick={() => setFilter('ready')}
            className={`filter-chip ${filter === 'ready' ? 'active' : ''} hover-grow`}
          >
            📦 Listo
          </button>
          <button
            onClick={() => setFilter('delivering')}
            className={`filter-chip ${filter === 'delivering' ? 'active' : ''} hover-grow`}
          >
            🚚 En Camino
          </button>
          <button
            onClick={() => setFilter('delivered')}
            className={`filter-chip ${filter === 'delivered' ? 'active' : ''} hover-grow`}
          >
            🎉 Entregados
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`filter-chip ${filter === 'cancelled' ? 'active' : ''} hover-grow`}
          >
            ❌ Cancelados
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-state animate-scale-in">
              <div className="empty-icon">📦</div>
              <h2 className="heading-2">No tienes pedidos</h2>
              <p className="text-lg text-muted mb-6">
                {filter !== 'all'
                  ? `No hay pedidos con estado "${filter}"`
                  : 'Haz tu primer pedido ahora'}
              </p>
              <Link to="/menu">
                <button className="btn btn-primary btn-lg hover-lift">
                  🍕 Explorar Menú
                </button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="orders-grid">
            {orders.map((order, index) => {
              const statusConfig = getStatusConfig(order.status);
              return (
                <div
                  key={order.id}
                  className="order-card card card-elevated animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Card Header */}
                  <div className="order-header">
                    <div className="order-info">
                      <h3 className="order-number">Pedido #{order.id.slice(0, 8).toUpperCase()}</h3>
                      <p className="order-date text-muted">
                        📅 {formatDate(order.created_at)}
                      </p>
                    </div>
                    <span className={`badge ${getStatusBadgeClass(order.status)} badge-dot animate-status-update`}>
                      {statusConfig.emoji} {statusConfig.text}
                    </span>
                  </div>

                  {/* Card Body */}
                  <div className="order-body">
                    <div className="order-detail-row">
                      <span className="detail-icon">📍</span>
                      <div className="detail-content">
                        <span className="detail-label">Dirección:</span>
                        <span className="detail-value">
                          {order.street && order.city
                            ? `${order.street}, ${order.city}${order.postal_code ? ` (${order.postal_code})` : ''}${order.reference ? ` - ${order.reference}` : ''}`
                            : 'No especificada'}
                        </span>
                      </div>
                    </div>
                    <div className="order-detail-row">
                      <span className="detail-icon">
                        {order.payment_method === 'cash' ? '💵' :
                         order.payment_method === 'card' ? '💳' : '🌐'}
                      </span>
                      <div className="detail-content">
                        <span className="detail-label">Método de pago:</span>
                        <span className="detail-value">
                          {order.payment_method === 'cash' ? 'Efectivo' :
                           order.payment_method === 'card' ? 'Tarjeta' : 'Online'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="order-footer">
                    <div className="order-total">
                      <span className="total-label">Total:</span>
                      <span className="total-value text-gradient">
                        ${parseFloat(order.total).toFixed(2)}
                      </span>
                    </div>
                    <div className="order-actions">
                      <Link to={`/orders/${order.id}`}>
                        <button className="btn btn-primary btn-sm hover-lift">
                          Ver Detalle
                        </button>
                      </Link>
                      {(order.status === 'pending' || order.status === 'confirmed') && (
                        <button
                          onClick={() => handleCancelOrder(order.id)}
                          className="btn btn-danger btn-sm hover-shrink"
                        >
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Orders;