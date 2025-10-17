import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { orderService } from '../services/orderService';
import { paymentService } from '../services/paymentService';

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
  setLoading(true);

  try {
    // 1. Preparar items para la orden
    const orderItems = cartItems.map(item => ({
      product_id: item.id,
      quantity: item.quantity,
      extras: item.extras?.map(e => e.id) || []
    }));

    // 2. Crear la orden con dirección en el body (sin address_id)
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

    // 3. Procesar el pago
    const paymentData = {
      order_id: orderResponse.order.id,
      payment_method: formData.payment_method
    };

    await paymentService.processPayment(paymentData);

    // 4. Limpiar carrito y redirigir
    clearCart();
    alert('¡Pedido realizado exitosamente!');
    navigate('/orders');

  } catch (err) {
    console.error('Error al procesar pedido:', err);
    console.error('   Response:', err.response);
    setError(err.response?.data?.error || 'Error al procesar el pedido');
  } finally {
    setLoading(false);
  }
};

  const totals = calculateTotals();

  if (cartItems.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>No hay productos en el carrito</h2>
        <button onClick={() => navigate('/menu')} style={buttonStyle}>
          Ir al Menú
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🛍️ Finalizar Pedido</h1>

      {error && <div style={errorStyle}>{error}</div>}

      <div style={{ display: 'flex', gap: '30px', marginTop: '30px', flexWrap: 'wrap' }}>
        {/* Formulario */}
        <div style={{ flex: '2 1 500px' }}>
          <form onSubmit={handleSubmit}>
            <h2>📍 Dirección de Entrega</h2>

            <div style={inputGroupStyle}>
              <label>Calle / Dirección:</label>
              <input
                type="text"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Ej: Av. Principal 123"
              />
            </div>

            <div style={inputGroupStyle}>
              <label>Ciudad:</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="Ej: Guayaquil"
              />
            </div>

            <div style={inputGroupStyle}>
              <label>Código Postal:</label>
              <input
                type="text"
                name="postal_code"
                value={formData.postal_code}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Opcional"
              />
            </div>

            <div style={inputGroupStyle}>
              <label>Referencia:</label>
              <input
                type="text"
                name="reference"
                value={formData.reference}
                onChange={handleChange}
                style={inputStyle}
                placeholder="Ej: Casa azul, junto al parque"
              />
            </div>

            <h2 style={{ marginTop: '30px' }}>💳 Método de Pago</h2>

            <div style={inputGroupStyle}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment_method"
                  value="cash"
                  checked={formData.payment_method === 'cash'}
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                💵 Efectivo (Pago contra entrega)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '10px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={formData.payment_method === 'card'}
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                💳 Tarjeta de Crédito/Débito
              </label>

              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="payment_method"
                  value="online"
                  checked={formData.payment_method === 'online'}
                  onChange={handleChange}
                  style={{ marginRight: '10px' }}
                />
                🌐 Pago en línea
              </label>
            </div>

            <div style={inputGroupStyle}>
              <label>Instrucciones especiales (opcional):</label>
              <textarea
                name="special_instructions"
                value={formData.special_instructions}
                onChange={handleChange}
                style={{ ...inputStyle, minHeight: '80px' }}
                placeholder="Ej: Sin cebolla, sin picante, etc."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={submitButtonStyle}
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>

        {/* Resumen */}
        <div style={{ flex: '1 1 300px' }}>
          <div style={summaryBoxStyle}>
            <h3>Resumen del Pedido</h3>

            {/* Items */}
            {cartItems.map((item) => (
              <div key={item.cartItemId} style={{ marginBottom: '10px', fontSize: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                </div>
                {item.extras && item.extras.length > 0 && (
                  <div style={{ fontSize: '12px', color: '#666', marginLeft: '10px' }}>
                    {item.extras.map(e => `+ ${e.name}`).join(', ')}
                  </div>
                )}
              </div>
            ))}

            <hr style={{ margin: '15px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>Envío:</span>
              <span>${totals.delivery_fee.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span>IVA (12%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>

            <hr style={{ margin: '15px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 'bold' }}>
              <span>Total:</span>
              <span style={{ color: '#28a745' }}>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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

const submitButtonStyle = {
  width: '100%',
  padding: '15px',
  fontSize: '18px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginTop: '10px'
};

const summaryBoxStyle = {
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: '20px'
};

const errorStyle = {
  backgroundColor: '#f8d7da',
  color: '#721c24',
  padding: '15px',
  borderRadius: '5px',
  marginBottom: '20px'
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

export default Checkout;