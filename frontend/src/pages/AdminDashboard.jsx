import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminService } from '../services/adminService';
import './AdminDashboard.css';

function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    totalRevenue: 0,
    totalUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboardStats = async () => {
      try {
        setLoading(true);
        const data = await adminService.getDashboardStats();

        if (data.success && data.stats) {
          setStats({
            totalOrders: data.stats.totalOrders,
            pendingOrders: data.stats.pendingOrders,
            totalRevenue: data.stats.totalRevenue,
            totalUsers: data.stats.totalUsers
          });
        }
      } catch (err) {
        console.error('Error al cargar estadísticas:', err);
        setError('Error al cargar las estadísticas del dashboard');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted mt-4">Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="container container-7xl">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-shake" style={{ marginBottom: '2rem' }}>
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Header */}
        <div className="dashboard-header animate-fade-in-up">
          <div className="header-content">
            <div>
              <h1 className="heading-1">📊 Dashboard Admin</h1>
              <p className="text-lg text-muted">
                Bienvenido, <strong>{user.name}</strong>
              </p>
            </div>
            <div className="header-badge">
              <span className="admin-badge">👑 Administrador</span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card card card-elevated animate-fade-in-up animate-delay-1">
            <div className="stat-icon stat-icon-primary">
              📦
            </div>
            <div className="stat-content">
              <p className="stat-label">Total de Pedidos</p>
              <p className="stat-value">{stats.totalOrders}</p>
            </div>
          </div>

          <div className="stat-card card card-elevated animate-fade-in-up animate-delay-2">
            <div className="stat-icon stat-icon-warning">
              ⏳
            </div>
            <div className="stat-content">
              <p className="stat-label">Pedidos Pendientes</p>
              <p className="stat-value">{stats.pendingOrders}</p>
            </div>
          </div>

          <div className="stat-card card card-elevated animate-fade-in-up animate-delay-3">
            <div className="stat-icon stat-icon-success">
              💰
            </div>
            <div className="stat-content">
              <p className="stat-label">Ingresos Totales</p>
              <p className="stat-value">${stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>

          <div className="stat-card card card-elevated animate-fade-in-up animate-delay-4">
            <div className="stat-icon stat-icon-info">
              👥
            </div>
            <div className="stat-content">
              <p className="stat-label">Total de Usuarios</p>
              <p className="stat-value">{stats.totalUsers}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions animate-fade-in-up animate-delay-5">
          <h2 className="section-title">⚡ Acciones Rápidas</h2>
          <div className="actions-grid">
            <Link to="/admin/orders" className="action-card">
              <div className="action-icon">📦</div>
              <div className="action-content">
                <h3 className="action-title">Gestionar Pedidos</h3>
                <p className="action-description">Ver y actualizar estados de pedidos</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/menu" className="action-card">
              <div className="action-icon">🍔</div>
              <div className="action-content">
                <h3 className="action-title">Gestionar Menú</h3>
                <p className="action-description">Agregar, editar o eliminar productos</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/users" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3 className="action-title">Gestionar Usuarios</h3>
                <p className="action-description">Administrar roles y permisos</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/reports" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3 className="action-title">Reportes</h3>
                <p className="action-description">Estadísticas y análisis</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Coming Soon Notice */}
        <div className="coming-soon-notice animate-fade-in-up animate-delay-6">
          <div className="notice-icon">🚧</div>
          <h3 className="notice-title">En Desarrollo</h3>
          <p className="notice-description">
            Las funcionalidades completas de administración estarán disponibles próximamente.
            Actualmente puedes navegar por las secciones y ver la estructura del dashboard.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
