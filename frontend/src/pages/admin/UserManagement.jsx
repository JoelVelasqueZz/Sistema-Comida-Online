import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  // Estados principales
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCustomers: 0,
    totalAdmins: 0,
    newUsers: 0
  });
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Filtros
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });

  // Modales
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userOrderStats, setUserOrderStats] = useState(null);

  // Formularios
  const [roleForm, setRoleForm] = useState({
    role: '',
    notes: ''
  });

  // ============================================
  // EFECTOS
  // ============================================
  useEffect(() => {
    loadStats();
    loadUsers();
  }, [filters, pagination.page]);

  // ============================================
  // CARGAR DATOS
  // ============================================
  const loadStats = async () => {
    try {
      const data = await userService.getUserStats();
      setStats(data.stats);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const params = {
        role: filters.role,
        status: filters.status,
        search: filters.search,
        page: pagination.page,
        limit: pagination.limit
      };
      const data = await userService.getAllUsers(params);
      setUsers(data.users);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages
      }));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      alert('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // MANEJO DE FILTROS
  // ============================================
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset a página 1
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // ============================================
  // ACCIONES DE USUARIOS
  // ============================================
  const handleViewDetails = async (user) => {
    try {
      setSelectedUser(user);
      setUserOrderStats(null);
      setShowDetailsModal(true);

      // Cargar estadísticas de pedidos si es cliente
      if (user.role === 'customer') {
        const data = await userService.getUserOrderStats(user.id);
        setUserOrderStats(data.stats);
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
    }
  };

  const handleOpenRoleModal = (user) => {
    setSelectedUser(user);
    setRoleForm({
      role: user.role,
      notes: ''
    });
    setShowRoleModal(true);
  };

  const handleChangeRole = async () => {
    try {
      if (!roleForm.role) {
        alert('Debe seleccionar un rol');
        return;
      }

      await userService.changeUserRole(selectedUser.id, roleForm);
      alert('Rol actualizado exitosamente');
      setShowRoleModal(false);
      loadStats();
      loadUsers();
    } catch (error) {
      console.error('Error al cambiar rol:', error);
      alert(error.response?.data?.error || 'Error al cambiar rol');
    }
  };

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      const confirmMessage = newStatus
        ? `¿Activar usuario ${user.name}?`
        : `¿Desactivar usuario ${user.name}?`;

      if (!confirm(confirmMessage)) return;

      await userService.toggleUserStatus(user.id, { is_active: newStatus });
      alert(`Usuario ${newStatus ? 'activado' : 'desactivado'} exitosamente`);
      loadStats();
      loadUsers();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert(error.response?.data?.error || 'Error al cambiar estado');
    }
  };

  const handleOpenDeleteModal = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleDeleteUser = async () => {
    try {
      await userService.deleteUser(selectedUser.id);
      alert('Usuario eliminado exitosamente');
      setShowDeleteModal(false);
      loadStats();
      loadUsers();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      alert(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  // ============================================
  // UTILIDADES
  // ============================================
  const getRoleBadge = (role) => {
    const badges = {
      admin: { label: 'Admin', color: 'badge-error' },
      customer: { label: 'Cliente', color: 'badge-primary' }
    };
    const badge = badges[role] || { label: role, color: 'badge-secondary' };
    return <span className={`badge ${badge.color}`}>{badge.label}</span>;
  };

  const getStatusBadge = (isActive) => {
    return isActive
      ? <span className="badge badge-success">Activo</span>
      : <span className="badge badge-warning">Inactivo</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Nunca';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="user-management">
      <div className="container">
        <div className="section-header">
          <h1 className="section-title">Gestión de Usuarios</h1>
          <Link to="/admin/dashboard" className="btn btn-secondary">
            ← Volver al Dashboard
          </Link>
        </div>

        {/* Estadísticas */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              👥
            </div>
            <div className="stat-info">
              <p className="stat-label">Total Usuarios</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              🛍️
            </div>
            <div className="stat-info">
              <p className="stat-label">Clientes Activos</p>
              <p className="stat-value">{stats.activeCustomers}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              🔐
            </div>
            <div className="stat-info">
              <p className="stat-label">Administradores</p>
              <p className="stat-value">{stats.totalAdmins}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
              ⭐
            </div>
            <div className="stat-info">
              <p className="stat-label">Nuevos (7 días)</p>
              <p className="stat-value">{stats.newUsers}</p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="filters-card">
          <div className="filters-grid">
            <div className="filter-group">
              <label className="filter-label">Rol</label>
              <select
                className="filter-select"
                value={filters.role}
                onChange={(e) => handleFilterChange('role', e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="customer">Clientes</option>
                <option value="admin">Administradores</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Estado</label>
              <select
                className="filter-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>

            <div className="filter-group">
              <label className="filter-label">Buscar</label>
              <input
                type="text"
                className="filter-input"
                placeholder="Nombre o email..."
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>

        {/* Tabla de usuarios */}
        <div className="table-container">
          {loading ? (
            <div className="text-center py-4">
              <p>Cargando usuarios...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-4">
              <p>No se encontraron usuarios</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Teléfono</th>
                    <th>Rol</th>
                    <th>Estado</th>
                    <th>Registro</th>
                    <th>Último Login</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.phone || '-'}</td>
                      <td>{getRoleBadge(user.role)}</td>
                      <td>{getStatusBadge(user.is_active)}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.last_login)}</td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => handleViewDetails(user)}
                            title="Ver detalles"
                          >
                            👁️
                          </button>
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => handleOpenRoleModal(user)}
                            title="Cambiar rol"
                          >
                            🔄
                          </button>
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => handleToggleStatus(user)}
                            title={user.is_active ? 'Desactivar' : 'Activar'}
                          >
                            {user.is_active ? '🔓' : '🔒'}
                          </button>
                          <button
                            className="btn-icon btn-icon-sm"
                            onClick={() => handleOpenDeleteModal(user)}
                            title="Eliminar usuario"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Paginación */}
              {pagination.totalPages > 1 && (
                <div className="pagination">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                  >
                    ← Anterior
                  </button>
                  <span className="pagination-info">
                    Página {pagination.page} de {pagination.totalPages} ({pagination.total} usuarios)
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal: Detalles de Usuario */}
        {showDetailsModal && selectedUser && (
          <div className="modal">
            <div className="modal-content modal-large">
              <div className="modal-header">
                <h2>Detalles del Usuario</h2>
                <button className="modal-close" onClick={() => setShowDetailsModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">ID</label>
                    <p>{selectedUser.id}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <p>{selectedUser.name}</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Teléfono</label>
                    <p>{selectedUser.phone || 'No proporcionado'}</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <p>{getRoleBadge(selectedUser.role)}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estado</label>
                    <p>{getStatusBadge(selectedUser.is_active)}</p>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Fecha de Registro</label>
                    <p>{formatDate(selectedUser.created_at)}</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Último Login</label>
                    <p>{formatDate(selectedUser.last_login)}</p>
                  </div>
                </div>

                {/* Estadísticas de pedidos (solo clientes) */}
                {selectedUser.role === 'customer' && (
                  <div className="user-stats-section">
                    <h3>Estadísticas de Pedidos</h3>
                    {userOrderStats ? (
                      <div className="stats-grid-small">
                        <div className="stat-item">
                          <span className="stat-label-small">Total Pedidos</span>
                          <span className="stat-value-small">{userOrderStats.totalOrders}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label-small">Total Gastado</span>
                          <span className="stat-value-small">${userOrderStats.totalSpent.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label-small">Promedio por Pedido</span>
                          <span className="stat-value-small">${userOrderStats.averageOrder.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label-small">Último Pedido</span>
                          <span className="stat-value-small">{formatDate(userOrderStats.lastOrderDate)}</span>
                        </div>
                      </div>
                    ) : (
                      <p>Cargando estadísticas...</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDetailsModal(false)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Cambiar Rol */}
        {showRoleModal && selectedUser && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Cambiar Rol de Usuario</h2>
                <button className="modal-close" onClick={() => setShowRoleModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p><strong>Usuario:</strong> {selectedUser.name} ({selectedUser.email})</p>
                <p><strong>Rol actual:</strong> {getRoleBadge(selectedUser.role)}</p>

                <div className="form-group mb-3">
                  <label className="form-label">Nuevo Rol *</label>
                  <select
                    className="form-select"
                    value={roleForm.role}
                    onChange={(e) => setRoleForm({ ...roleForm, role: e.target.value })}
                  >
                    <option value="customer">Cliente</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas (opcional)</label>
                  <textarea
                    className="form-textarea"
                    rows="3"
                    placeholder="Motivo del cambio de rol..."
                    value={roleForm.notes}
                    onChange={(e) => setRoleForm({ ...roleForm, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowRoleModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-primary" onClick={handleChangeRole}>
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Eliminar Usuario */}
        {showDeleteModal && selectedUser && (
          <div className="modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Eliminar Usuario</h2>
                <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                  ×
                </button>
              </div>
              <div className="modal-body">
                <p>¿Estás seguro que deseas eliminar este usuario?</p>
                <p><strong>Nombre:</strong> {selectedUser.name}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Rol:</strong> {getRoleBadge(selectedUser.role)}</p>
                <p className="text-warning">⚠️ Esta acción no se puede deshacer.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                  Cancelar
                </button>
                <button className="btn btn-danger" onClick={handleDeleteUser}>
                  Eliminar Usuario
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
