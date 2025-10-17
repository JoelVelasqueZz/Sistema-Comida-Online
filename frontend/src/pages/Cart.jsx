import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      alert('Debes iniciar sesión para continuar');
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div style={emptyCartStyle}>
        <h2>🛒 Tu carrito está vacío</h2>
        <p>Agrega productos desde el menú</p>
        <Link to="/menu">
          <button style={buttonStyle}>Ver Menú</button>
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: '0 auto' }}>
      <h1>🛒 Carrito de Compras</h1>

      <div style={{ marginTop: '20px' }}>
        {cartItems.map((item) => (
          <div key={item.cartItemId} style={cartItemStyle}>
            <img
              src={item.image_url || 'https://via.placeholder.com/100'}
              alt={item.name}
              style={itemImageStyle}
            />

            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 5px 0' }}>{item.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', margin: '0 0 5px 0' }}>
                Precio unitario: ${parseFloat(item.price).toFixed(2)}
              </p>

              {/* Mostrar extras */}
              {item.extras && item.extras.length > 0 && (
                <div style={{ fontSize: '13px', color: '#666' }}>
                  <strong>Extras:</strong>
                  {item.extras.map((extra, index) => (
                    <span key={extra.id}>
                      {' '}{extra.name} (+${parseFloat(extra.price).toFixed(2)})
                      {index < item.extras.length - 1 && ','}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Controles de cantidad */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                style={quantityButtonStyle}
              >
                -
              </button>
              <span style={{ fontSize: '18px', fontWeight: 'bold', width: '30px', textAlign: 'center' }}>
                {item.quantity}
              </span>
              <button
                onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                style={quantityButtonStyle}
              >
                +
              </button>
            </div>

            {/* Subtotal del item */}
            <div style={{ textAlign: 'right', minWidth: '100px' }}>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#28a745' }}>
                ${(
                  (parseFloat(item.price) + 
                   (item.extras?.reduce((sum, e) => sum + parseFloat(e.price), 0) || 0)) * 
                  item.quantity
                ).toFixed(2)}
              </div>
              <button
                onClick={() => removeFromCart(item.cartItemId)}
                style={removeButtonStyle}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Resumen */}
      <div style={summaryBoxStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px' }}>Subtotal:</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            ${getCartTotal().toFixed(2)}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px' }}>Envío:</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            $2.50
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontSize: '18px' }}>IVA (12%):</span>
          <span style={{ fontSize: '18px', fontWeight: 'bold' }}>
            ${(getCartTotal() * 0.12).toFixed(2)}
          </span>
        </div>
        <hr style={{ margin: '15px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <span style={{ fontSize: '22px', fontWeight: 'bold' }}>Total:</span>
          <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#28a745' }}>
            ${(getCartTotal() + 2.50 + getCartTotal() * 0.12).toFixed(2)}
          </span>
        </div>

        <button onClick={handleCheckout} style={checkoutButtonStyle}>
          Proceder al Pago
        </button>
        <button onClick={clearCart} style={clearButtonStyle}>
          Vaciar Carrito
        </button>
      </div>
    </div>
  );
}

const emptyCartStyle = {
  textAlign: 'center',
  padding: '60px 20px'
};

const cartItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px',
  padding: '15px',
  backgroundColor: 'white',
  borderRadius: '10px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  marginBottom: '15px'
};

const itemImageStyle = {
  width: '100px',
  height: '100px',
  objectFit: 'cover',
  borderRadius: '8px'
};

const quantityButtonStyle = {
  padding: '8px 15px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const removeButtonStyle = {
  marginTop: '10px',
  padding: '5px 10px',
  fontSize: '12px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

const summaryBoxStyle = {
  marginTop: '30px',
  padding: '20px',
  backgroundColor: '#f8f9fa',
  borderRadius: '10px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
};

const checkoutButtonStyle = {
  width: '100%',
  padding: '15px',
  fontSize: '18px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold',
  marginBottom: '10px'
};

const clearButtonStyle = {
  width: '100%',
  padding: '12px',
  fontSize: '16px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
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

export default Cart;