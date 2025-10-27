import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';
import CreditCardForm from '../components/checkout/CreditCardForm';
import TransferForm from '../components/checkout/TransferForm';
import './Checkout.css';

function Checkout() {
  const { cartItems, getCartTotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    street: '',
    city: '',
    postal_code: '',
    reference: '',
    payment_method: 'cash',
    special_instructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [pendingOrderData, setPendingOrderData] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const calculateTotals = () => {
    const subtotal = getCartTotal();
    const delivery_fee = 2.50;
    const tax = subtotal * 0.12;
    const total = subtotal + delivery_fee + tax;
    return { subtotal, delivery_fee, tax, total };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Si es tarjeta o transferencia, mostrar el formulario de pago
    if (formData.payment_method === 'card' || formData.payment_method === 'transfer') {
      // Preparar datos para después
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        extras: item.extras?.map(e => e.id) || []
      }));

      setPendingOrderData({
        items: orderItems,
        delivery_address: {
          street: formData.street,
          city: formData.city,
          postal_code: formData.postal_code,
          reference: formData.reference
        },
        payment_method: formData.payment_method,
        special_instructions: formData.special_instructions
      });

      setShowPaymentForm(true);
      return;
    }

    // Para efectivo, procesar directamente
    setLoading(true);

    try {
      const orderItems = cartItems.map(item => ({
        product_id: item.id,
        quantity: item.quantity,
        extras: item.extras?.map(e => e.id) || []
      }));

      const orderData = {
        items: orderItems,
        delivery_address: {
          street: formData.street,
          city: formData.city,
          postal_code: formData.postal_code,
          reference: formData.reference
        },
        payment_method: formData.payment_method,
        special_instructions: formData.special_instructions
      };

      console.log('Enviando orden:', orderData);

      const orderResponse = await orderService.createOrder(orderData);
      console.log('✅ Orden creada:', orderResponse);

      const paymentData = {
        order_id: orderResponse.order.id,
        payment_method: formData.payment_method
      };

      await paymentService.processPayment(paymentData);

      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Error al procesar pedido:', err);
      console.error('Response:', err.response);
      setError(err.response?.data?.error || 'Error al procesar el pedido');
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async (paymentInfo) => {
    setLoading(true);
    try {
      console.log('💳 Procesando pago con tarjeta:', paymentInfo);

      const orderResponse = await orderService.createOrder(pendingOrderData);
      console.log('✅ Orden creada:', orderResponse);

      const paymentData = {
        order_id: orderResponse.order.id,
        payment_method: 'card',
        transaction_id: paymentInfo.transactionId,
        card_type: paymentInfo.cardType,
        last_four: paymentInfo.lastFour
      };

      await paymentService.processPayment(paymentData);

      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Error al procesar pago:', err);
      setError(err.response?.data?.error || 'Error al procesar el pago');
      setShowPaymentForm(false);
    } finally {
      setLoading(false);
    }
  };

  const handleTransferPayment = async (transferInfo) => {
    setLoading(true);
    try {
      console.log('📱 Procesando transferencia:', transferInfo);

      const orderResponse = await orderService.createOrder(pendingOrderData);
      console.log('✅ Orden creada:', orderResponse);

      const paymentData = {
        order_id: orderResponse.order.id,
        payment_method: 'transfer',
        transaction_id: transferInfo.transactionId,
        reference: transferInfo.reference,
        status: transferInfo.status
      };

      await paymentService.processPayment(paymentData);

      clearCart();
      navigate('/orders');
    } catch (err) {
      console.error('Error al procesar transferencia:', err);
      setError(err.response?.data?.error || 'Error al procesar la transferencia');
      setShowPaymentForm(false);
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <div className="empty-state animate-scale-in">
          <div className="empty-icon">🛒</div>
          <h2 className="heading-2">No hay productos en el carrito</h2>
          <p className="text-lg text-muted mb-6">
            Agrega productos desde el menú para continuar
          </p>
          <button
            onClick={() => navigate('/menu')}
            className="btn btn-primary btn-lg hover-lift"
          >
            🍕 Ir al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container container-7xl">
        {/* Header */}
        <div className="checkout-header animate-fade-in-up">
          <h1 className="heading-1">🛍️ Finalizar Pedido</h1>
          <p className="text-lg text-muted">Completa tu información para recibir tu pedido</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {/* Main Layout */}
        <div className="checkout-layout">
          {/* Form Section */}
          <div className="checkout-form-section">
            <form onSubmit={handleSubmit} className="checkout-form animate-fade-in-up animate-delay-1">
              {/* Address Section */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">📍</span>
                  Dirección de Entrega
                </h2>

                <div className="form-group">
                  <label className="label">Calle / Dirección *</label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    required
                    className="input input-lg"
                    placeholder="Ej: Av. Principal 123"
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
                      className="input input-lg"
                      placeholder="Ej: Guayaquil"
                    />
                  </div>

                  <div className="form-group">
                    <label className="label">Código Postal</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleChange}
                      className="input input-lg"
                      placeholder="Opcional"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Referencia</label>
                  <input
                    type="text"
                    name="reference"
                    value={formData.reference}
                    onChange={handleChange}
                    className="input input-lg"
                    placeholder="Ej: Casa azul, junto al parque"
                  />
                  <p className="helper-text">
                    Ayúdanos a encontrar tu ubicación más fácil
                  </p>
                </div>
              </div>

              {/* Payment Section */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">💳</span>
                  Método de Pago
                </h2>

                <div className="payment-methods">
                  <label className={`payment-option ${formData.payment_method === 'cash' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="cash"
                      checked={formData.payment_method === 'cash'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">💵</span>
                      <div className="payment-details">
                        <span className="payment-name">Efectivo</span>
                        <span className="payment-desc">Pago contra entrega</span>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.payment_method === 'card' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="card"
                      checked={formData.payment_method === 'card'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">💳</span>
                      <div className="payment-details">
                        <span className="payment-name">Tarjeta</span>
                        <span className="payment-desc">Crédito / Débito</span>
                      </div>
                    </div>
                  </label>

                  <label className={`payment-option ${formData.payment_method === 'transfer' ? 'active' : ''}`}>
                    <input
                      type="radio"
                      name="payment_method"
                      value="transfer"
                      checked={formData.payment_method === 'transfer'}
                      onChange={handleChange}
                      className="radio"
                    />
                    <div className="payment-info">
                      <span className="payment-icon">📱</span>
                      <div className="payment-details">
                        <span className="payment-name">Transferencia</span>
                        <span className="payment-desc">Bancaria / QR</span>
                      </div>
                    </div>
                  </label>
                </div>

                {/* Mostrar formularios de pago según el método seleccionado */}
                {showPaymentForm && formData.payment_method === 'card' && (
                  <div className="payment-form-container">
                    <CreditCardForm
                      amount={totals.total}
                      onPaymentSuccess={handleCardPayment}
                    />
                  </div>
                )}

                {showPaymentForm && formData.payment_method === 'transfer' && (
                  <div className="payment-form-container">
                    <TransferForm
                      amount={totals.total}
                      orderId={null}
                      onPaymentSuccess={handleTransferPayment}
                    />
                  </div>
                )}
              </div>

              {/* Special Instructions */}
              <div className="form-section card">
                <h2 className="form-section-title heading-4">
                  <span className="section-icon">📝</span>
                  Instrucciones Especiales
                </h2>

                <div className="form-group">
                  <textarea
                    name="special_instructions"
                    value={formData.special_instructions}
                    onChange={handleChange}
                    className="input textarea"
                    placeholder="Ej: Sin cebolla, sin picante, etc."
                  />
                  <p className="helper-text">
                    Opcional - Indica si tienes alguna preferencia
                  </p>
                </div>
              </div>

              {/* Submit Button - Solo mostrar si no hay formulario de pago activo */}
              {!showPaymentForm && (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-success btn-xl btn-block hover-lift"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      Procesando pedido...
                    </>
                  ) : (
                    <>✓ {formData.payment_method === 'cash' ? 'Confirmar Pedido' : 'Continuar al Pago'}</>
                  )}
                </button>
              )}

              {/* Botón para volver si está en el formulario de pago */}
              {showPaymentForm && (
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="btn btn-ghost btn-block"
                >
                  ← Volver a la información de entrega
                </button>
              )}
            </form>
          </div>

          {/* Summary Section */}
          <div className="checkout-summary-section">
            <div className="summary-sticky animate-fade-in-up animate-delay-2">
              <div className="summary-card card card-elevated">
                <h3 className="summary-title heading-4">Resumen del Pedido</h3>

                {/* Items List */}
                <div className="summary-items">
                  {cartItems.map((item) => (
                    <div key={item.cartItemId} className="summary-item">
                      <div className="item-header">
                        <span className="item-quantity">{item.quantity}x</span>
                        <span className="item-name">{item.name}</span>
                        <span className="item-price">
                          ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                      {item.extras && item.extras.length > 0 && (
                        <div className="item-extras">
                          {item.extras.map((extra, i) => (
                            <span key={extra.id} className="extra-tag">
                              + {extra.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div className="summary-divider"></div>

                {/* Totals */}
                <div className="summary-totals">
                  <div className="summary-row">
                    <span>Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>Envío:</span>
                    <span className="font-semibold">${totals.delivery_fee.toFixed(2)}</span>
                  </div>

                  <div className="summary-row">
                    <span>IVA (12%):</span>
                    <span className="font-semibold">${totals.tax.toFixed(2)}</span>
                  </div>
                </div>

                <div className="summary-divider"></div>

                <div className="summary-total">
                  <span className="total-label">Total a Pagar:</span>
                  <span className="total-value text-gradient">
                    ${totals.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Checkout;
