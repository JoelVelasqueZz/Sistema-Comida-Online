import React, { useState } from 'react';
import {
  validateCardNumber,
  getCardType,
  validateExpiry,
  validateCVV,
  formatCardNumber
} from '../../utils/cardValidator';
import './CreditCardForm.css';

// Componente de tarjeta visual custom
const CreditCardPreview = ({ number, name, expiry, cvc, focused, cardType }) => {
  const formatNumber = (num) => {
    const cleaned = num.replace(/\s/g, '');
    if (cardType === 'amex') {
      return cleaned.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    }
    return cleaned.replace(/(\d{4})/g, '$1 ').trim();
  };

  const maskedNumber = number ? formatNumber(number) : '•••• •••• •••• ••••';
  const displayName = name || 'NOMBRE COMPLETO';
  const displayExpiry = expiry || 'MM/YY';

  return (
    <div className={`credit-card-preview ${cardType} ${focused === 'cvc' ? 'flipped' : ''}`}>
      <div className="card-front">
        <div className="card-chip">
          <div className="chip-line"></div>
          <div className="chip-line"></div>
          <div className="chip-line"></div>
          <div className="chip-line"></div>
        </div>
        <div className="card-type-logo">{cardType !== 'unknown' ? cardType.toUpperCase() : ''}</div>
        <div className="card-number">{maskedNumber}</div>
        <div className="card-holder">
          <div className="card-label">Titular</div>
          <div className="card-value">{displayName}</div>
        </div>
        <div className="card-expiry">
          <div className="card-label">Vence</div>
          <div className="card-value">{displayExpiry}</div>
        </div>
      </div>
      <div className="card-back">
        <div className="card-stripe"></div>
        <div className="card-cvv">
          <div className="cvv-label">CVV</div>
          <div className="cvv-value">{cvc || '•••'}</div>
        </div>
      </div>
    </div>
  );
};

const CreditCardForm = ({ onPaymentSuccess, amount }) => {
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvc: '',
    focus: ''
  });

  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);
  const [saveCard, setSaveCard] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    let formattedValue = value;

    if (name === 'number') {
      // Solo números, máximo 16 dígitos
      formattedValue = value.replace(/\D/g, '').slice(0, 16);
    } else if (name === 'expiry') {
      // Formato MM/YY
      formattedValue = value.replace(/\D/g, '').slice(0, 4);
      if (formattedValue.length >= 2) {
        formattedValue = formattedValue.slice(0, 2) + '/' + formattedValue.slice(2);
      }
    } else if (name === 'cvc') {
      // Solo números, 3 o 4 dígitos
      const cardType = getCardType(cardData.number);
      const maxLength = cardType === 'amex' ? 4 : 3;
      formattedValue = value.replace(/\D/g, '').slice(0, maxLength);
    } else if (name === 'name') {
      // Solo letras y espacios
      formattedValue = value.replace(/[^a-zA-Z\s]/g, '').toUpperCase();
    }

    setCardData({ ...cardData, [name]: formattedValue });
    setErrors({ ...errors, [name]: '' });
  };

  const handleInputFocus = (e) => {
    setCardData({ ...cardData, focus: e.target.name === 'cvc' ? 'cvc' : e.target.name });
  };

  const validateForm = () => {
    const newErrors = {};

    // Validar número
    if (!validateCardNumber(cardData.number)) {
      newErrors.number = 'Número de tarjeta inválido';
    }

    // Validar nombre
    if (!cardData.name.trim()) {
      newErrors.name = 'Nombre es requerido';
    } else if (cardData.name.trim().length < 3) {
      newErrors.name = 'Nombre debe tener al menos 3 caracteres';
    }

    // Validar expiración
    const [month, year] = cardData.expiry.split('/');
    if (!month || !year || !validateExpiry(month, year)) {
      newErrors.expiry = 'Fecha de expiración inválida';
    }

    // Validar CVV
    const cardType = getCardType(cardData.number);
    if (!validateCVV(cardData.cvc, cardType)) {
      newErrors.cvc = `CVV debe tener ${cardType === 'amex' ? 4 : 3} dígitos`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const simulatePayment = () => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // 90% de éxito, 10% de rechazo
        const success = Math.random() < 0.9;

        if (success) {
          resolve({
            success: true,
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            message: 'Pago aprobado'
          });
        } else {
          reject({
            success: false,
            message: 'Pago rechazado - Fondos insuficientes'
          });
        }
      }, 2000); // Simular 2 segundos de procesamiento
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('💳 CreditCardForm - handleSubmit LLAMADO');
    console.log('💳 Datos de tarjeta:', cardData);

    if (!validateForm()) {
      console.log('❌ Validación de formulario falló');
      return;
    }

    console.log('✅ Validación de formulario exitosa');
    setProcessing(true);

    try {
      console.log('⏳ Simulando procesamiento de pago...');
      const result = await simulatePayment();

      // Si el usuario quiere guardar la tarjeta
      if (saveCard) {
        const cardToSave = {
          cardType: getCardType(cardData.number),
          lastFourDigits: cardData.number.slice(-4),
          cardholderName: cardData.name,
          expiryMonth: cardData.expiry.split('/')[0],
          expiryYear: cardData.expiry.split('/')[1]
        };

        // Guardar en localStorage (simulado)
        const savedCards = JSON.parse(localStorage.getItem('savedCards') || '[]');
        savedCards.push(cardToSave);
        localStorage.setItem('savedCards', JSON.stringify(savedCards));
      }

      console.log('✅ Pago simulado exitoso:', result);
      console.log('📞 Llamando a onPaymentSuccess del padre...');

      const paymentInfo = {
        method: 'card',
        transactionId: result.transactionId,
        cardType: getCardType(cardData.number),
        lastFour: cardData.number.slice(-4)
      };

      console.log('📦 Datos de pago a enviar:', paymentInfo);

      onPaymentSuccess(paymentInfo);

      console.log('✅ onPaymentSuccess ejecutado');

    } catch (error) {
      console.error('❌ Error en CreditCardForm:', error);
      setErrors({ submit: error.message });
    } finally {
      setProcessing(false);
    }
  };

  const cardType = getCardType(cardData.number);

  return (
    <div className="credit-card-form">
      <div className="card-preview">
        <CreditCardPreview
          number={cardData.number}
          name={cardData.name}
          expiry={cardData.expiry}
          cvc={cardData.cvc}
          focused={cardData.focus}
          cardType={cardType}
        />

        {cardType !== 'unknown' && cardData.number.length >= 4 && (
          <div className="card-type-badge">
            <span className={`card-icon ${cardType}`}>
              {cardType === 'visa' && '💳 VISA'}
              {cardType === 'mastercard' && '💳 MASTERCARD'}
              {cardType === 'amex' && '💳 AMEX'}
              {cardType === 'discover' && '💳 DISCOVER'}
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-group">
          <label>Número de Tarjeta</label>
          <input
            type="text"
            name="number"
            placeholder="1234 5678 9012 3456"
            value={formatCardNumber(cardData.number)}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            maxLength="19"
            className={errors.number ? 'error' : ''}
          />
          {errors.number && <span className="error-message">{errors.number}</span>}
        </div>

        <div className="form-group">
          <label>Nombre del Titular</label>
          <input
            type="text"
            name="name"
            placeholder="JUAN PEREZ"
            value={cardData.name}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            className={errors.name ? 'error' : ''}
          />
          {errors.name && <span className="error-message">{errors.name}</span>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Expiración</label>
            <input
              type="text"
              name="expiry"
              placeholder="MM/YY"
              value={cardData.expiry}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              maxLength="5"
              className={errors.expiry ? 'error' : ''}
            />
            {errors.expiry && <span className="error-message">{errors.expiry}</span>}
          </div>

          <div className="form-group">
            <label>CVV</label>
            <input
              type="text"
              name="cvc"
              placeholder={cardType === 'amex' ? '1234' : '123'}
              value={cardData.cvc}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              maxLength={cardType === 'amex' ? '4' : '3'}
              className={errors.cvc ? 'error' : ''}
            />
            {errors.cvc && <span className="error-message">{errors.cvc}</span>}
          </div>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={saveCard}
              onChange={(e) => setSaveCard(e.target.checked)}
            />
            Guardar tarjeta para futuros pagos
          </label>
        </div>

        {errors.submit && (
          <div className="error-banner">
            ❌ {errors.submit}
          </div>
        )}

        <button
          type="submit"
          className="pay-button"
          disabled={processing}
        >
          {processing ? (
            <>
              <span className="spinner"></span>
              Procesando...
            </>
          ) : (
            `Pagar $${amount.toFixed(2)}`
          )}
        </button>

        <div className="test-cards-info">
          <p>🧪 <strong>Tarjetas de prueba:</strong></p>
          <ul>
            <li>Visa: 4111 1111 1111 1111</li>
            <li>Mastercard: 5500 0000 0000 0004</li>
            <li>Amex: 3400 0000 0000 009</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CreditCardForm;
