import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { orderService } from '../services/orderService';
import './OrderDetail.css';

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Obtener info del usuario actual
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser.role === 'admin';

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setLoading(true);
        const data = await orderService.getOrderById(id);
        setOrder(data.order);
      } catch (err) {
        console.error('Error al cargar orden:', err);
        setError(err.response?.data?.error || 'Error al cargar el pedido');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  const getStatusConfig = (status) => {
    const config = {
      pending: { text: 'Pendiente', emoji: '⏳', color: '#fbbf24' },
      confirmed: { text: 'Confirmado', emoji: '✅', color: '#10b981' },
      preparing: { text: 'En preparación', emoji: '👨‍🍳', color: '#3b82f6' },
      delivering: { text: 'En camino', emoji: '🚚', color: '#ec4899' },
      delivered: { text: 'Entregado', emoji: '🎉', color: '#22c55e' },
      cancelled: { text: 'Cancelado', emoji: '❌', color: '#ef4444' }
    };
    return config[status] || config.pending;
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      pending: 'badge-pending',
      confirmed: 'badge-confirmed',
      preparing: 'badge-preparing',
      delivering: 'badge-delivering',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled'
    };
    return statusMap[status] || 'badge-pending';
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

  const handleCancelOrder = async () => {
    if (!window.confirm('¿Estás seguro de cancelar este pedido?')) {
      return;
    }

    try {
      await orderService.cancelOrder(id);
      // Recargar orden para ver el estado actualizado
      const data = await orderService.getOrderById(id);
      setOrder(data.order);
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      setError(err.response?.data?.error || 'No se pudo cancelar el pedido');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!window.confirm('¿Confirmas que recibiste tu pedido?')) {
      return;
    }

    try {
      await orderService.confirmDelivery(id);
      // Recargar orden para ver el estado actualizado
      const data = await orderService.getOrderById(id);
      setOrder(data.order);
    } catch (err) {
      console.error('Error al confirmar entrega:', err);
      setError(err.response?.data?.error || 'No se pudo confirmar la entrega');
    }
  };

  if (loading) {
    return (
      <div className="order-detail-loading">
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted mt-4">Cargando detalles del pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="order-detail-error">
        <div className="error-content">
          <div className="error-icon">😔</div>
          <h2 className="heading-2">{error || 'Pedido no encontrado'}</h2>
          <p className="text-lg text-muted mb-6">
            No pudimos cargar los detalles de tu pedido
          </p>
          <Link to="/orders">
            <button className="btn btn-primary btn-lg hover-lift">
              Ver Mis Pedidos
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);

  return (
    <div className="order-detail-page">
      <div className="container container-6xl">
        {/* Back Button */}
        <div className="back-navigation animate-fade-in">
          <button
            onClick={() => navigate('/orders')}
            className="btn btn-ghost hover-grow"
          >
            ← Volver a Mis Pedidos
          </button>
        </div>

        {/* Order Header */}
        <div className="order-detail-header animate-fade-in-up">
          <div className="header-content">
            <div className="header-info">
              <h1 className="heading-1">
                Pedido #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="order-date-detail text-muted">
                📅 Realizado el {formatDate(order.created_at)}
              </p>
            </div>
            <div className="header-status">
              <span
                className={`badge ${getStatusBadgeClass(order.status)} badge-lg badge-dot animate-status-update`}
                style={{ '--status-color': statusConfig.color }}
              >
                {statusConfig.emoji} {statusConfig.text}
              </span>
            </div>
          </div>
        </div>

        {/* Admin Info Section */}
        {isAdmin && order.user_name && (
          <div className="admin-info animate-fade-in-up animate-delay-1">
            <h3>📊 Información del Cliente</h3>
            <div className="admin-info-grid">
              <div className="admin-info-item">
                <span className="admin-info-label">Nombre:</span>
                <span className="admin-info-value">{order.user_name}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">Email:</span>
                <span className="admin-info-value">{order.user_email}</span>
              </div>
              <div className="admin-info-item">
                <span className="admin-info-label">ID de Usuario:</span>
                <span className="admin-info-value">{order.user_id}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Content Grid */}
        <div className="order-detail-grid">
          {/* Left Column - Order Items */}
          <div className="order-items-section animate-fade-in-up animate-delay-1">
            <div className="section-card card card-elevated">
              <h2 className="section-title">
                🛒 Productos del Pedido
              </h2>

              <div className="items-list">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-details">
                        <div className="item-header">
                          <h3 className="item-name">{item.product_name}</h3>
                          <span className="item-quantity">x{item.quantity}</span>
                        </div>

                        {/* Mostrar extras si existen */}
                        {item.extras && item.extras.length > 0 && (
                          <div className="item-extras">
                            <span className="extras-label">Extras:</span>
                            <ul className="extras-list">
                              {item.extras.map((extra, i) => (
                                <li key={i}>
                                  {extra.name} (+${parseFloat(extra.price).toFixed(2)})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      <div className="item-pricing">
                        <p className="item-unit-price text-muted">
                          ${parseFloat(item.unit_price).toFixed(2)} c/u
                        </p>
                        <p className="item-total">
                          ${parseFloat(item.subtotal).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted">No hay productos en este pedido</p>
                )}
              </div>

              {/* Order Summary */}
              <div className="order-summary">
                <div className="summary-row">
                  <span className="summary-label">Subtotal:</span>
                  <span className="summary-value">${parseFloat(order.subtotal).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Envío:</span>
                  <span className="summary-value">${parseFloat(order.delivery_fee).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Impuestos:</span>
                  <span className="summary-value">${parseFloat(order.tax).toFixed(2)}</span>
                </div>
                <div className="summary-row summary-total">
                  <span className="summary-label">Total:</span>
                  <span className="summary-value text-gradient">
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Order Info */}
          <div className="order-info-section">
            {/* Delivery Address */}
            <div className="info-card card card-elevated animate-fade-in-up animate-delay-2">
              <h2 className="section-title">
                📍 Dirección de Entrega
              </h2>
              <div className="info-content">
                {order.street && order.city ? (
                  <>
                    <p className="info-line">
                      <strong>Calle:</strong> {order.street}
                    </p>
                    <p className="info-line">
                      <strong>Ciudad:</strong> {order.city}
                    </p>
                    {order.postal_code && (
                      <p className="info-line">
                        <strong>Código Postal:</strong> {order.postal_code}
                      </p>
                    )}
                    {order.reference && (
                      <p className="info-line">
                        <strong>Referencia:</strong> {order.reference}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-muted">Dirección no especificada</p>
                )}
              </div>
            </div>

            {/* Payment Method */}
            <div className="info-card card card-elevated animate-fade-in-up animate-delay-3">
              <h2 className="section-title">
                💳 Método de Pago
              </h2>
              <div className="info-content">
                <div className="payment-method">
                  <span className="payment-icon">
                    {order.payment_method === 'cash' ? '💵' :
                     order.payment_method === 'card' ? '💳' : '🌐'}
                  </span>
                  <span className="payment-text">
                    {order.payment_method === 'cash' ? 'Efectivo' :
                     order.payment_method === 'card' ? 'Tarjeta' : 'Pago Online'}
                  </span>
                </div>
              </div>
            </div>

            {/* Special Instructions */}
            {order.special_instructions && (
              <div className="info-card card card-elevated animate-fade-in-up animate-delay-4">
                <h2 className="section-title">
                  📝 Instrucciones Especiales
                </h2>
                <div className="info-content">
                  <p className="special-instructions">{order.special_instructions}</p>
                </div>
              </div>
            )}

            {/* Order Timeline */}
            <div className="info-card card card-elevated animate-fade-in-up animate-delay-5">
              <h2 className="section-title">
                📊 Estado del Pedido
              </h2>
              <div className="info-content">
                <div className="order-timeline">
                  <div className={`timeline-step ${['pending', 'confirmed', 'preparing', 'delivering', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-title">Pedido Recibido</p>
                      <p className="timeline-date">{formatDate(order.created_at)}</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${['confirmed', 'preparing', 'delivering', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-title">Pedido Confirmado</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${['preparing', 'delivering', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-title">En Preparación</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${['delivering', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-title">En Camino</p>
                    </div>
                  </div>
                  <div className={`timeline-step ${order.status === 'delivered' ? 'completed' : ''}`}>
                    <div className="timeline-dot"></div>
                    <div className="timeline-content">
                      <p className="timeline-title">Entregado</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            {(order.status === 'pending' || order.status === 'confirmed') && (
              <div className="cancel-order-section animate-fade-in-up animate-delay-6">
                <button
                  onClick={handleCancelOrder}
                  className="btn btn-danger btn-block hover-shrink"
                >
                  ❌ Cancelar Pedido
                </button>
              </div>
            )}

            {/* Confirm Delivery Button */}
            {order.status === 'delivering' && (
              <div className="confirm-delivery-section animate-fade-in-up animate-delay-6">
                <button
                  onClick={handleConfirmDelivery}
                  className="btn btn-success btn-block hover-lift"
                >
                  ✅ Confirmar Entrega
                </button>
                <p className="text-sm text-muted mt-2" style={{ textAlign: 'center' }}>
                  Haz clic cuando hayas recibido tu pedido
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
