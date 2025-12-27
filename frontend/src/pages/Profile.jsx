import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import AddressManager from '../components/AddressManager';
import './Profile.css';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await authService.updateProfile(formData);
      updateUser(response.user);
      setSuccess('Perfil actualizado exitosamente');
      setIsEditing(false);
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      setError(err.response?.data?.error || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || ''
    });
    setIsEditing(false);
    setError('');
    setSuccess('');
  };

  const handleLogout = () => {
    if (window.confirm('¿Estás seguro de cerrar sesión?')) {
      logout();
      window.location.href = '/';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      <div className="container container-4xl">
        {/* Header */}
        <div className="profile-header animate-fade-in-up">
          <h1 className="heading-1">👤 Mi Perfil</h1>
          <p className="text-lg text-muted">Gestiona tu información personal</p>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="alert alert-success animate-fade-in-down">
            <span>✓</span>
            <p>{success}</p>
          </div>
        )}

        {/* Profile Card */}
        <div className="profile-card card card-elevated animate-fade-in-up animate-delay-1">
          {/* Avatar Section */}
          <div className="profile-avatar-section">
            <div className="avatar-wrapper">
              <div className="avatar-gradient-border">
                <div className="avatar">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              </div>
              <div className="avatar-status-indicator"></div>
            </div>
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email text-muted">{user?.email}</p>
            <span className={`profile-role-badge badge ${
              user?.role === 'admin' ? 'badge-primary' : 'badge-info'
            }`}>
              {user?.role === 'admin' ? '👑 Administrador' : '👤 Cliente'}
            </span>
          </div>

          {/* Profile Content */}
          {!isEditing ? (
            <div className="profile-view">
              <div className="info-section">
                <h3 className="info-section-title heading-5">Información Personal</h3>

                <div className="info-grid">
                  <div className="info-item">
                    <div className="info-icon">👤</div>
                    <div className="info-content">
                      <span className="info-label">Nombre completo</span>
                      <span className="info-value">{user?.name}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">📧</div>
                    <div className="info-content">
                      <span className="info-label">Email</span>
                      <span className="info-value">{user?.email}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">📱</div>
                    <div className="info-content">
                      <span className="info-label">Teléfono</span>
                      <span className="info-value">{user?.phone || 'No especificado'}</span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">🎭</div>
                    <div className="info-content">
                      <span className="info-label">Rol</span>
                      <span className="info-value">
                        {user?.role === 'admin' ? 'Administrador' : 'Cliente'}
                      </span>
                    </div>
                  </div>

                  <div className="info-item">
                    <div className="info-icon">📅</div>
                    <div className="info-content">
                      <span className="info-label">Miembro desde</span>
                      <span className="info-value">{formatDate(user?.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary btn-lg btn-block hover-lift mt-6"
              >
                ✏️ Editar Perfil
              </button>
            </div>
          ) : (
            <div className="profile-edit">
              <h3 className="info-section-title heading-5 mb-6">Editar Información</h3>

              <form onSubmit={handleSubmit} className="edit-form">
                <div className="form-group">
                  <label className="label">Nombre completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="input input-lg"
                    placeholder="Juan Pérez"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input input-lg"
                    placeholder="0999999999"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Email</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="input input-lg"
                    style={{ backgroundColor: 'var(--gray-100)', cursor: 'not-allowed' }}
                  />
                  <p className="helper-text">
                    El email no se puede cambiar
                  </p>
                </div>

                <div className="edit-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success btn-lg hover-lift"
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Guardando...
                      </>
                    ) : (
                      '💾 Guardar Cambios'
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="btn btn-outline-secondary btn-lg hover-shrink"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Logout Section */}
          <div className="logout-section">
            <hr className="section-divider" />
            <button
              onClick={handleLogout}
              className="btn btn-danger btn-block hover-shrink"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Address Manager Section */}
        <div className="card card-elevated animate-fade-in-up animate-delay-2">
          <AddressManager />
        </div>
      </div>
    </div>
  );
}

export default Profile;
