import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../services/orderService';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const loadOrders = async () => {
      try {
        setLoading(true);
        const statusFilter = filter === 'all' ? null : filter;
        const data = await orderService.getUserOrders(statusFilter);
        setOrders(data.orders);
      } catch (err) {
        console.error('Error al cargar órdenes:', err);
        setError('Error al cargar tus pedidos');
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [filter]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { text: 'Pendiente', color: '#ffc107', emoji: '⏳' },
      confirmed: { text: 'Confirmado', color: '#007bff', emoji: '✅' },
      preparing: { text: 'En preparación', color: '#17a2b8', emoji: '👨‍🍳' },
      ready: { text: 'Listo', color: '#28a745', emoji: '✔️' },
      on_delivery: { text: 'En camino', color: '#fd7e14', emoji: '🚚' },
      delivered: { text: 'Entregado', color: '#28a745', emoji: '🎉' },
      cancelled: { text: 'Cancelado', color: '#dc3545', emoji: '❌' }
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
      <span style={{
        padding: '5px 15px',
        borderRadius: '20px',
        backgroundColor: config.color,
        color: 'white',
        fontSize: '14px',
        fontWeight: 'bold'
      }}>
        {config.emoji} {config.text}
      </span>
    );
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
      alert('Pedido cancelado exitosamente');
      
      // Recargar órdenes
      const statusFilter = filter === 'all' ? null : filter;
      const data = await orderService.getUserOrders(statusFilter);
      setOrders(data.orders);
    } catch (err) {
      console.error('Error al cancelar pedido:', err);
      alert(err.response?.data?.error || 'No se pudo cancelar el pedido');
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando pedidos...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>📦 Mis Pedidos</h1>

      {/* Filtros */}
      <div style={{ marginTop: '20px', marginBottom: '30px' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filter === 'all' ? '#007bff' : '#e0e0e0',
            color: filter === 'all' ? 'white' : 'black'
          }}
        >
          Todos
        </button>
        <button
          onClick={() => setFilter('pending')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filter === 'pending' ? '#007bff' : '#e0e0e0',
            color: filter === 'pending' ? 'white' : 'black'
          }}
        >
          Pendientes
        </button>
        <button
          onClick={() => setFilter('on_delivery')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filter === 'on_delivery' ? '#007bff' : '#e0e0e0',
            color: filter === 'on_delivery' ? 'white' : 'black'
          }}
        >
          En camino
        </button>
        <button
          onClick={() => setFilter('delivered')}
          style={{
            ...filterButtonStyle,
            backgroundColor: filter === 'delivered' ? '#007bff' : '#e0e0e0',
            color: filter === 'delivered' ? 'white' : 'black'
          }}
        >
          Entregados
        </button>
      </div>

      {/* Lista de órdenes */}
      {error && <div style={errorStyle}>{error}</div>}

      {orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <h2>No tienes pedidos {filter !== 'all' && `con estado "${filter}"`}</h2>
          <Link to="/menu">
            <button style={buttonStyle}>Hacer tu primer pedido</button>
          </Link>
        </div>
      ) : (
        <div>
          {orders.map((order) => (
            <div key={order.id} style={orderCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0' }}>Pedido #{order.id.slice(0, 8)}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {formatDate(order.created_at)}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div style={{ marginBottom: '15px' }}>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Dirección:</strong> {order.street}, {order.city}
                </p>
                <p style={{ margin: '5px 0', fontSize: '14px' }}>
                  <strong>Método de pago:</strong> {
                    order.payment_method === 'cash' ? '💵 Efectivo' :
                    order.payment_method === 'card' ? '💳 Tarjeta' :
                    '🌐 Online'
                  }
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                <div>
                  <span style={{ fontSize: '14px', color: '#666' }}>Total:</span>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745', marginLeft: '10px' }}>
                    ${parseFloat(order.total).toFixed(2)}
                  </span>
                </div>

                <div>
                  <Link to={`/orders/${order.id}`}>
                    <button style={detailButtonStyle}>Ver Detalle</button>
                  </Link>
                  {(order.status === 'pending' || order.status === 'confirmed') && (
                    <button
                      onClick={() => handleCancelOrder(order.id)}
                      style={cancelButtonStyle}
                    >
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const filterButtonStyle = {
  padding: '10px 20px',
  margin: '0 5px 10px 0',
  fontSize: '14px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const orderCardStyle = {
  backgroundColor: 'white',
  padding: '20px',
  borderRadius: '10px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  marginBottom: '20px'
};

const detailButtonStyle = {
  padding: '8px 15px',
  fontSize: '14px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  marginRight: '10px'
};

const cancelButtonStyle = {
  padding: '8px 15px',
  fontSize: '14px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

const buttonStyle = {
  padding: '12px 30px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const errorStyle = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px'
};

export default Orders;