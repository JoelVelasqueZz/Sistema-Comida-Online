import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { useCart } from '../context/CartContext';
import './ProductDetail.css';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setLoading(true);
        const data = await menuService.getProductById(id);
        setProduct(data.product);
      } catch (err) {
        setError('Error al cargar el producto');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [id]);

  const handleExtraToggle = (extra) => {
    setSelectedExtras((prev) => {
      const exists = prev.find((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const basePrice = parseFloat(product.price);
    const extrasPrice = selectedExtras.reduce((sum, extra) => sum + parseFloat(extra.price), 0);
    return (basePrice + extrasPrice) * quantity;
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedExtras);
    setAddedToCart(true);
    setTimeout(() => {
      navigate('/menu');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
        <p className="text-lg text-muted mt-4">Cargando producto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-error">
        <div className="error-state animate-scale-in">
          <div className="error-icon">⚠️</div>
          <h2 className="heading-2">{error}</h2>
          <button
            onClick={() => navigate('/menu')}
            className="btn btn-primary btn-lg hover-lift mt-6"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="product-detail-error">
        <div className="error-state animate-scale-in">
          <div className="error-icon">🔍</div>
          <h2 className="heading-2">Producto no encontrado</h2>
          <button
            onClick={() => navigate('/menu')}
            className="btn btn-primary btn-lg hover-lift mt-6"
          >
            Volver al Menú
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="product-detail-page">
      <div className="container container-5xl">
        {/* Back Button */}
        <button
          onClick={() => navigate('/menu')}
          className="back-button btn btn-outline-secondary hover-lift animate-fade-in-up"
        >
          ← Volver al Menú
        </button>

        {/* Success Alert */}
        {addedToCart && (
          <div className="alert alert-success animate-fade-in-down">
            <span>✓</span>
            <p>¡{product.name} agregado al carrito!</p>
          </div>
        )}

        {/* Main Content */}
        <div className="product-detail-layout animate-fade-in-up animate-delay-1">
          {/* Image Section */}
          <div className="product-image-section">
            <div className="image-wrapper card card-elevated">
              <img
                src={product.image_url || 'https://via.placeholder.com/400'}
                alt={product.name}
                className="product-image"
              />
            </div>
          </div>

          {/* Info Section */}
          <div className="product-info-section">
            <div className="info-card card card-elevated">
              {/* Header */}
              <div className="product-header">
                <h1 className="product-title heading-1">{product.name}</h1>
                <p className="product-description text-lg text-muted">
                  {product.description}
                </p>
                <div className="product-price text-gradient">
                  ${parseFloat(product.price).toFixed(2)}
                </div>
              </div>

              {/* Extras */}
              {product.extras && product.extras.length > 0 && (
                <div className="extras-section">
                  <h3 className="section-title heading-5">
                    <span className="section-icon">🎁</span>
                    Extras disponibles
                  </h3>
                  <div className="extras-list">
                    {product.extras.map((extra) => (
                      <label
                        key={extra.id}
                        className={`extra-item ${
                          selectedExtras.some((e) => e.id === extra.id) ? 'active' : ''
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedExtras.some((e) => e.id === extra.id)}
                          onChange={() => handleExtraToggle(extra)}
                          className="checkbox"
                        />
                        <div className="extra-info">
                          <span className="extra-name">{extra.name}</span>
                          <span className="extra-price">+${parseFloat(extra.price).toFixed(2)}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity */}
              <div className="quantity-section">
                <h3 className="section-title heading-5">
                  <span className="section-icon">🔢</span>
                  Cantidad
                </h3>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="quantity-btn btn-gradient hover-lift"
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <span className="quantity-display">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="quantity-btn btn-gradient hover-lift"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="total-section">
                <span className="total-label">Total:</span>
                <span className="total-value text-gradient">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={addedToCart}
                className="btn btn-success btn-xl btn-block hover-lift"
              >
                {addedToCart ? (
                  <>
                    <span>✓</span> Agregado al carrito
                  </>
                ) : (
                  <>
                    <span>🛒</span> Agregar al carrito
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        {(product.preparation_time || product.calories) && (
          <div className="additional-info card animate-fade-in-up animate-delay-2">
            <h3 className="info-title heading-5">Información Adicional</h3>
            <div className="info-grid">
              {product.preparation_time && (
                <div className="info-item">
                  <span className="info-icon">⏱️</span>
                  <div className="info-content">
                    <span className="info-label">Tiempo de preparación</span>
                    <span className="info-value">{product.preparation_time} minutos</span>
                  </div>
                </div>
              )}
              {product.calories && (
                <div className="info-item">
                  <span className="info-icon">🔥</span>
                  <div className="info-content">
                    <span className="info-label">Calorías</span>
                    <span className="info-value">{product.calories} kcal</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductDetail;