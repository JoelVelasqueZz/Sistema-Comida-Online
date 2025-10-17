import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

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

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>👤 Mi Perfil</h1>

      {error && <div style={errorStyle}>{error}</div>}
      {success && <div style={successStyle}>{success}</div>}

      <div style={profileBoxStyle}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={avatarStyle}>
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h2 style={{ margin: '10px 0 5px 0' }}>{user?.name}</h2>
          <p style={{ color: '#666', margin: 0 }}>{user?.email}</p>
          <span style={roleBadgeStyle}>
            {user?.role === 'admin' ? '👑 Administrador' : '👤 Cliente'}
          </span>
        </div>

        {!isEditing ? (
          // Vista de perfil
          <div>
            <div style={infoRowStyle}>
              <strong>Nombre:</strong>
              <span>{user?.name}</span>
            </div>

            <div style={infoRowStyle}>
              <strong>Email:</strong>
              <span>{user?.email}</span>
            </div>

            <div style={infoRowStyle}>
              <strong>Teléfono:</strong>
              <span>{user?.phone || 'No especificado'}</span>
            </div>

            <div style={infoRowStyle}>
              <strong>Rol:</strong>
              <span>{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</span>
            </div>

            <div style={infoRowStyle}>
              <strong>Miembro desde:</strong>
              <span>{new Date(user?.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </div>

            <button onClick={() => setIsEditing(true)} style={editButtonStyle}>
              ✏️ Editar Perfil
            </button>
          </div>
        ) : (
          // Formulario de edición
          <form onSubmit={handleSubmit}>
            <div style={inputGroupStyle}>
              <label>Nombre completo:</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                style={inputStyle}
              />
            </div>

            <div style={inputGroupStyle}>
              <label>Teléfono:</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                style={inputStyle}
                placeholder="0999999999"
              />
            </div>

            <div style={inputGroupStyle}>
              <label>Email:</label>
              <input
                type="email"
                value={user?.email}
                disabled
                style={{ ...inputStyle, backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
              />
              <small style={{ color: '#666', fontSize: '12px' }}>
                El email no se puede cambiar
              </small>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button
                type="submit"
                disabled={loading}
                style={saveButtonStyle}
              >
                {loading ? 'Guardando...' : '💾 Guardar Cambios'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                style={cancelButtonStyle}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <hr style={{ margin: '30px 0', border: 'none', borderTop: '1px solid #eee' }} />

        <button onClick={handleLogout} style={logoutButtonStyle}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

const profileBoxStyle = {
  backgroundColor: 'white',
  padding: '40px',
  borderRadius: '10px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  marginTop: '20px'
};

const avatarStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  backgroundColor: '#007bff',
  color: 'white',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '48px',
  fontWeight: 'bold',
  margin: '0 auto'
};

const roleBadgeStyle = {
  display: 'inline-block',
  marginTop: '10px',
  padding: '5px 15px',
  backgroundColor: '#e7f3ff',
  color: '#007bff',
  borderRadius: '20px',
  fontSize: '14px',
  fontWeight: 'bold'
};

const infoRowStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  padding: '15px',
  borderBottom: '1px solid #f0f0f0',
  fontSize: '16px'
};

const inputGroupStyle = {
  marginBottom: '20px'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  fontSize: '16px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  marginTop: '5px'
};

const editButtonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '20px'
};

const saveButtonStyle = {
  flex: 1,
  padding: '12px',
  fontSize: '16px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const cancelButtonStyle = {
  flex: 1,
  padding: '12px',
  fontSize: '16px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const logoutButtonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '16px',
  backgroundColor: '#dc3545',
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

const successStyle = {
  backgroundColor: '#d4edda',
  color: '#155724',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px'
};

export default Profile;