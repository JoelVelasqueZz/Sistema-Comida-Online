import { useState, useEffect } from 'react';
import cardService from '../services/cardService';
import './CardManager.css';

const CardManager = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [formData, setFormData] = useState({
    card_type: 'visa',
    last_four_digits: '',
    cardholder_name: '',
    expiry_month: '',
    expiry_year: '',
    is_default: false
  });

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoading(true);
      const data = await cardService.getCards();
      setCards(data.cards || []);
    } catch (error) {
      console.error('Error cargando tarjetas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await cardService.saveCard({
        ...formData,
        expiry_month: parseInt(formData.expiry_month),
        expiry_year: parseInt(formData.expiry_year)
      });

      setSuccessMessage('✅ Tarjeta guardada exitosamente');
      setTimeout(() => setSuccessMessage(''), 3000);

      setShowForm(false);
      setFormData({
        card_type: 'visa',
        last_four_digits: '',
        cardholder_name: '',
        expiry_month: '',
        expiry_year: '',
        is_default: false
      });

      loadCards();
    } catch (error) {
      console.error('Error guardando tarjeta:', error);
      alert('Error al guardar tarjeta');
    }
  };

  const handleSetDefault = async (cardId) => {
    try {
      await cardService.setDefault(cardId);
      setSuccessMessage('✅ Tarjeta predeterminada actualizada');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadCards();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al actualizar tarjeta');
    }
  };

  const handleDelete = async (cardId) => {
    if (!confirm('¿Eliminar esta tarjeta?')) return;

    try {
      await cardService.deleteCard(cardId);
      setSuccessMessage('✅ Tarjeta eliminada');
      setTimeout(() => setSuccessMessage(''), 3000);
      loadCards();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al eliminar tarjeta');
    }
  };

  const getCardIcon = (type) => {
    const icons = {
      visa: '💳',
      mastercard: '💳',
      amex: '💳',
      discover: '💳'
    };
    return icons[type] || '💳';
  };

  if (loading) {
    return (
      <div className="card-manager">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando tarjetas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card-manager">
      <div className="card-manager-header">
        <h3>💳 Mis Tarjetas</h3>
        <button onClick={() => setShowForm(!showForm)} className="add-card-btn">
          {showForm ? '✕ Cancelar' : '+ Nueva Tarjeta'}
        </button>
      </div>

      {successMessage && (
        <div className="success-message">
          {successMessage}
        </div>
      )}

      {showForm && (
        <div className="card-form-container">
          <h4>Agregar Nueva Tarjeta</h4>
          <form onSubmit={handleSubmit} className="card-form">
            <div className="form-group">
              <label>Tipo de Tarjeta *</label>
              <select
                name="card_type"
                value={formData.card_type}
                onChange={handleInputChange}
                required
              >
                <option value="visa">Visa</option>
                <option value="mastercard">Mastercard</option>
                <option value="amex">American Express</option>
                <option value="discover">Discover</option>
              </select>
            </div>

            <div className="form-group">
              <label>Últimos 4 Dígitos *</label>
              <input
                type="text"
                name="last_four_digits"
                value={formData.last_four_digits}
                onChange={handleInputChange}
                placeholder="1234"
                maxLength="4"
                pattern="\d{4}"
                required
              />
            </div>

            <div className="form-group">
              <label>Nombre del Titular *</label>
              <input
                type="text"
                name="cardholder_name"
                value={formData.cardholder_name}
                onChange={handleInputChange}
                placeholder="Juan Pérez"
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Mes de Expiración *</label>
                <select
                  name="expiry_month"
                  value={formData.expiry_month}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Mes</option>
                  {Array.from({length: 12}, (_, i) => i + 1).map(month => (
                    <option key={month} value={month}>
                      {month.toString().padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Año de Expiración *</label>
                <select
                  name="expiry_year"
                  value={formData.expiry_year}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Año</option>
                  {Array.from({length: 10}, (_, i) => new Date().getFullYear() + i).map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="is_default"
                name="is_default"
                checked={formData.is_default}
                onChange={handleInputChange}
              />
              <label htmlFor="is_default">Marcar como tarjeta predeterminada</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-save">
                💾 Guardar
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-cancel">
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {cards.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💳</div>
          <p>No tienes tarjetas guardadas</p>
        </div>
      ) : (
        <div className="cards-list">
          {cards.map((card) => (
            <div key={card.id} className="saved-card">
              {card.is_default && (
                <span className="default-badge">⭐ Predeterminada</span>
              )}

              <div className="card-info">
                <h4>
                  {getCardIcon(card.card_type)} {card.card_type.toUpperCase()}
                </h4>
                <p className="card-number">•••• •••• •••• {card.last_four_digits}</p>
                <p className="card-name">{card.cardholder_name}</p>
                <p className="card-expiry">
                  Expira: {String(card.expiry_month).padStart(2, '0')}/{card.expiry_year}
                </p>
              </div>

              <div className="card-actions">
                {!card.is_default && (
                  <button
                    onClick={() => handleSetDefault(card.id)}
                    className="btn-default"
                  >
                    ⭐ Predeterminada
                  </button>
                )}
                <button
                  onClick={() => handleDelete(card.id)}
                  className="btn-delete"
                >
                  🗑️ Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CardManager;
