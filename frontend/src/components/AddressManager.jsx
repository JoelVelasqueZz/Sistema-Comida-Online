import { useState, useEffect } from 'react';
import addressService from '../services/addressService';
import './AddressManager.css';

function AddressManager() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postal_code: '',
    reference: '',
    is_default: false
  });

  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const response = await addressService.getAddresses();
      setAddresses(response.addresses || []);
      setError('');
    } catch (err) {
      console.error('Error al cargar direcciones:', err);
      setError('Error al cargar direcciones');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingId) {
        await addressService.updateAddress(editingId, formData);
        setSuccess('Dirección actualizada exitosamente');
      } else {
        await addressService.createAddress(formData);
        setSuccess('Dirección guardada exitosamente');
      }

      resetForm();
      await loadAddresses();
    } catch (err) {
      console.error('Error al guardar dirección:', err);
      setError(err.response?.data?.error || 'Error al guardar dirección');
    }
  };

  const handleEdit = (address) => {
    setFormData({
      street: address.street,
      city: address.city,
      postal_code: address.postal_code || '',
      reference: address.reference || '',
      is_default: address.is_default
    });
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de eliminar esta dirección?')) {
      return;
    }

    try {
      await addressService.deleteAddress(id);
      setSuccess('Dirección eliminada exitosamente');
      await loadAddresses();
    } catch (err) {
      console.error('Error al eliminar dirección:', err);
      setError(err.response?.data?.error || 'Error al eliminar dirección');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressService.setDefault(id);
      setSuccess('Dirección predeterminada actualizada');
      await loadAddresses();
    } catch (err) {
      console.error('Error al establecer dirección predeterminada:', err);
      setError(err.response?.data?.error || 'Error al establecer dirección predeterminada');
    }
  };

  const resetForm = () => {
    setFormData({
      street: '',
      city: '',
      postal_code: '',
      reference: '',
      is_default: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="address-manager">
      <div className="address-manager-header">
        <h3 className="heading-5">📍 Mis Direcciones</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="btn btn-primary btn-sm"
          >
            + Nueva Dirección
          </button>
        )}
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

      {/* Form */}
      {showForm && (
        <div className="address-form-card card animate-fade-in-down">
          <h4 className="heading-6">
            {editingId ? 'Editar Dirección' : 'Nueva Dirección'}
          </h4>
          <form onSubmit={handleSubmit} className="address-form">
            <div className="form-group">
              <label className="label">Calle y número *</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
                className="input"
                placeholder="Av. Principal 123"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="label">Ciudad *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="input"
                  placeholder="Quito"
                />
              </div>

              <div className="form-group">
                <label className="label">Código Postal</label>
                <input
                  type="text"
                  name="postal_code"
                  value={formData.postal_code}
                  onChange={handleChange}
                  className="input"
                  placeholder="170150"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="label">Referencia</label>
              <textarea
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                className="input"
                rows="2"
                placeholder="Edificio azul, cerca del parque..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="is_default"
                  checked={formData.is_default}
                  onChange={handleChange}
                />
                <span>Marcar como dirección predeterminada</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-success">
                {editingId ? '💾 Actualizar' : '💾 Guardar'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-outline-secondary"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {loading ? (
        <div className="loading-state">
          <span className="loading-spinner"></span>
          <p>Cargando direcciones...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📍</div>
          <p className="empty-text">No tienes direcciones guardadas</p>
          <p className="empty-subtext">Agrega una dirección para usarla en tus pedidos</p>
        </div>
      ) : (
        <div className="addresses-grid">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`address-card card ${address.is_default ? 'address-card-default' : ''}`}
            >
              {address.is_default && (
                <div className="default-badge">
                  <span>⭐ Predeterminada</span>
                </div>
              )}

              <div className="address-content">
                <div className="address-icon">📍</div>
                <div className="address-details">
                  <p className="address-street">{address.street}</p>
                  <p className="address-city">
                    {address.city}
                    {address.postal_code && `, ${address.postal_code}`}
                  </p>
                  {address.reference && (
                    <p className="address-reference">
                      <span className="reference-label">Ref:</span> {address.reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="address-actions">
                {!address.is_default && (
                  <button
                    onClick={() => handleSetDefault(address.id)}
                    className="btn btn-sm btn-outline-primary"
                    title="Marcar como predeterminada"
                  >
                    ⭐ Predeterminada
                  </button>
                )}
                <button
                  onClick={() => handleEdit(address)}
                  className="btn btn-sm btn-outline-secondary"
                  title="Editar"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="btn btn-sm btn-outline-danger"
                  title="Eliminar"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AddressManager;
