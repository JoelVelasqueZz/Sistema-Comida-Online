import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../services/adminService';
import './AdminOrders.css';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    searchTerm: '',
    dateFrom: '',
    dateTo: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const statusOptions = [
    { value: 'pending', label: 'Pendiente', icon: '⏳', color: 'warning' },
    { value: 'confirmed', label: 'Confirmado', icon: '✅', color: 'info' },
    { value: 'preparing', label: 'Preparando', icon: '👨‍🍳', color: 'primary' },
    { value: 'delivering', label: 'En Camino', icon: '🚚', color: 'info' },
    { value: 'delivered', label: 'Entregado', icon: '🎉', color: 'success' },
    { value: 'cancelled', label: 'Cancelado', icon: '❌', color: 'error' }
  ];

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError('');

      const filterParams = {};
      if (filters.status) filterParams.status = filters.status;
      if (filters.searchTerm) filterParams.search = filters.searchTerm;
      if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterParams.dateTo = filters.dateTo;

      console.log('📋 Cargando pedidos con filtros:', filterParams);
      const data = await adminService.getAllOrders(filterParams);
      console.log('📦 Datos recibidos:', data);

      // Manejar la respuesta independientemente de si tiene success o no
      const ordersData = data.orders || data || [];
      console.log('✅ Pedidos procesados:', ordersData.length);
      setOrders(ordersData);
    } catch (err) {
      console.error('❌ Error al cargar pedidos:', err);
      console.error('Error details:', err.response?.data);
      setError('Error al cargar los pedidos');
      setOrders([]); // Asegurar que orders esté vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0];
  };

  const handleStatusChange = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setStatusNotes('');
    setShowStatusModal(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    try {
      setUpdating(true);
      setError('');

      await adminService.updateOrderStatus(
        selectedOrder.id,
        newStatus,
        statusNotes
      );

      // Actualizar la orden en la lista
      setOrders(orders.map(order =>
        order.id === selectedOrder.id
          ? { ...order, status: newStatus }
          : order
      ));

      setShowStatusModal(false);
      setSelectedOrder(null);
      setStatusNotes('');
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      setError('Error al actualizar el estado del pedido');
    } finally {
      setUpdating(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      searchTerm: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'Fecha no disponible';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Fecha inválida';
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return 'Error en fecha';
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="admin-orders-loading">
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted mt-4">Cargando pedidos...</p>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      <div className="container container-7xl">
        {/* Header */}
        <div className="admin-header animate-fade-in-up">
          <div>
            <h1 className="heading-1">📦 Gestión de Pedidos</h1>
            <p className="text-lg text-muted">
              Administra todos los pedidos del sistema
            </p>
          </div>
          <Link to="/admin/dashboard" className="btn btn-secondary">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-shake" style={{ marginBottom: '2rem' }}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="filters-card card card-elevated animate-fade-in-up animate-delay-1">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Estado</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="filter-select"
              >
                <option value="">Todos los estados</option>
                {statusOptions.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.icon} {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Buscar</label>
              <input
                type="text"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                placeholder="ID, nombre de cliente..."
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Desde</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label className="filter-label">Hasta</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="filter-input"
              />
            </div>
          </div>

          {(filters.status || filters.searchTerm || filters.dateFrom || filters.dateTo) && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm">
              🗑️ Limpiar filtros
            </button>
          )}
        </div>

        {/* Orders Table */}
        <div className="orders-table-container card card-elevated animate-fade-in-up animate-delay-2">
          {orders.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <h3 className="empty-title">No hay pedidos</h3>
              <p className="empty-description">
                No se encontraron pedidos con los filtros aplicados
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Dirección</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => {
                    try {
                      // Validaciones defensivas
                      if (!order || !order.id) {
                        console.warn('Orden inválida encontrada:', order);
                        return null;
                      }

                      const statusInfo = getStatusInfo(order.status);
                      const orderId = String(order.id).substring(0, 8).toUpperCase();
                      const orderTotal = parseFloat(order.total || 0).toFixed(2);

                      return (
                        <tr key={order.id} className="order-row">
                          <td className="order-id">#{orderId}</td>
                          <td>
                            <div className="customer-info">
                              <div className="customer-name">{order.user_name || 'Desconocido'}</div>
                              <div className="customer-email">{order.user_email || 'N/A'}</div>
                            </div>
                          </td>
                          <td className="order-date">{formatDate(order.created_at)}</td>
                          <td className="order-items">{order.item_count || 0} item(s)</td>
                          <td className="order-total">${orderTotal}</td>
                        <td className="order-address">
                          {order.street && order.city ? (
                            <div className="address-info">
                              <div>{order.street}</div>
                              <div className="text-muted">{order.city}</div>
                            </div>
                          ) : (
                            <span className="text-muted">No especificada</span>
                          )}
                        </td>
                        <td>
                          <span className={`status-badge status-${statusInfo.color}`}>
                            {statusInfo.icon} {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/orders/${order.id}`}
                              className="btn-icon btn-icon-sm"
                              title="Ver detalle"
                            >
                              👁️
                            </Link>
                            <button
                              onClick={() => handleStatusChange(order)}
                              className="btn-icon btn-icon-sm"
                              title="Cambiar estado"
                            >
                              🔄
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    } catch (renderError) {
                      console.error('❌ Error renderizando orden:', order, renderError);
                      return null;
                    }
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Status Update Modal */}
        {showStatusModal && selectedOrder && (
          <div className="modal-overlay" onClick={() => !updating && setShowStatusModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">Actualizar Estado del Pedido</h2>
                <button
                  className="modal-close"
                  onClick={() => setShowStatusModal(false)}
                  disabled={updating}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="order-info-summary">
                  <p><strong>Pedido:</strong> #{selectedOrder.id}</p>
                  <p><strong>Cliente:</strong> {selectedOrder.user_name}</p>
                  <p><strong>Total:</strong> ${parseFloat(selectedOrder.total || 0).toFixed(2)}</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Nuevo Estado</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                    disabled={updating}
                  >
                    {statusOptions.map(status => (
                      <option key={status.value} value={status.value}>
                        {status.icon} {status.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas (opcional)</label>
                  <textarea
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    placeholder="Agregar notas sobre el cambio de estado..."
                    className="form-textarea"
                    rows="3"
                    disabled={updating}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="btn btn-secondary"
                  disabled={updating}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateStatus}
                  className="btn btn-primary"
                  disabled={updating || newStatus === selectedOrder.status}
                >
                  {updating ? (
                    <>
                      <span className="loading-spinner loading-spinner-sm"></span>
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Estado'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminOrders;
