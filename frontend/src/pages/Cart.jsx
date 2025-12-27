import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import './Cart.css';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  const subtotal = getCartTotal();
  const deliveryFee = 2.50;
  const tax = subtotal * 0.12;
  const total = subtotal + deliveryFee + tax;

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <div className="empty-state animate-fade-in-up">
          <div className="empty-icon">🛒</div>
          <h2 className="heading-2">Tu carrito está vacío</h2>
          <p className="text-lg text-muted mb-6">
            Agrega productos deliciosos desde el menú
          </p>
          <Link to="/menu">
            <button className="btn btn-primary btn-lg hover-lift">
              🍕 Explorar Menú
            </button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container container-6xl">
        {/* Header */}
        <div className="cart-header animate-fade-in-up">
          <h1 className="heading-1">🛒 Carrito de Compras</h1>
          <p className="text-muted">{cartItems.length} producto{cartItems.length !== 1 ? 's' : ''} en tu carrito</p>
        </div>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            {cartItems.map((item, index) => (
              <div
                key={item.cartItemId}
                className="cart-item card animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="cart-item-image">
                  <img
                    src={item.image_url || item.image || 'https://via.placeholder.com/100'}
                    alt={item.name}
                  />
                </div>

                <div className="cart-item-details">
                  <h3 className="cart-item-title">{item.name}</h3>
                  <p className="cart-item-price text-muted">
                    ${parseFloat(item.price).toFixed(2)} c/u
                  </p>

                  {/* Extras */}
                  {item.extras && item.extras.length > 0 && (
                    <div className="cart-item-extras">
                      <span className="extras-label">Extras:</span>
                      {item.extras.map((extra, i) => (
                        <span key={extra.id} className="extra-item">
                          {extra.name} (+${parseFloat(extra.price).toFixed(2)})
                          {i < item.extras.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quantity Controls */}
                <div className="cart-item-quantity">
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                    className="quantity-btn hover-shrink"
                    aria-label="Decrementar cantidad"
                  >
                    -
                  </button>
                  <span className="quantity-value">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                    className="quantity-btn hover-shrink"
                    aria-label="Incrementar cantidad"
                  >
                    +
                  </button>
                </div>

                {/* Subtotal & Remove */}
                <div className="cart-item-total">
                  <div className="item-subtotal">
                    $
                    {(
                      (parseFloat(item.price) +
                        (item.extras?.reduce((sum, e) => sum + parseFloat(e.price), 0) || 0)) *
                      item.quantity
                    ).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    className="remove-btn hover-grow"
                    aria-label="Eliminar producto"
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <div className="summary-card card card-elevated sticky-summary animate-fade-in-up animate-delay-2">
              <h3 className="summary-title heading-4">Resumen del Pedido</h3>

              <div className="summary-row">
                <span>Subtotal:</span>
                <span className="font-semibold">${subtotal.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Envío:</span>
                <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>IVA (12%):</span>
                <span className="font-semibold">${tax.toFixed(2)}</span>
              </div>

              <div className="summary-divider"></div>

              <div className="summary-total">
                <span className="total-label">Total:</span>
                <span className="total-value text-gradient">${total.toFixed(2)}</span>
              </div>

              <button onClick={handleCheckout} className="btn btn-primary btn-lg btn-block hover-lift mt-6">
                Proceder al Pago 💳
              </button>

              <button onClick={clearCart} className="btn btn-outline-secondary btn-block hover-shrink mt-3">
                Vaciar Carrito
              </button>

              <Link to="/menu" className="continue-shopping">
                ← Continuar comprando
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;
