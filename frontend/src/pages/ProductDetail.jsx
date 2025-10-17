import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { useCart } from '../context/CartContext';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
    alert(`${product.name} agregado al carrito`);
    navigate('/menu');
  };

  if (loading) return <div style={{ padding: '20px' }}>Cargando...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>{error}</div>;
  if (!product) return <div style={{ padding: '20px' }}>Producto no encontrado</div>;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <button onClick={() => navigate('/menu')} style={backButtonStyle}>
        ← Volver al menú
      </button>

      <div style={{ display: 'flex', gap: '30px', marginTop: '20px' }}>
        {/* Imagen */}
        <div style={{ flex: 1 }}>
          <img
            src={product.image_url || 'https://via.placeholder.com/400'}
            alt={product.name}
            style={{ width: '100%', borderRadius: '10px' }}
          />
        </div>

        {/* Información */}
        <div style={{ flex: 1 }}>
          <h1>{product.name}</h1>
          <p style={{ color: '#666', fontSize: '16px', marginBottom: '20px' }}>
            {product.description}
          </p>

          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#28a745', marginBottom: '20px' }}>
            ${parseFloat(product.price).toFixed(2)}
          </div>

          {/* Extras */}
          {product.extras && product.extras.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3>Extras disponibles:</h3>
              {product.extras.map((extra) => (
                <div key={extra.id} style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedExtras.some((e) => e.id === extra.id)}
                      onChange={() => handleExtraToggle(extra)}
                      style={{ marginRight: '10px' }}
                    />
                    {extra.name} (+${parseFloat(extra.price).toFixed(2)})
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Cantidad */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Cantidad:</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                style={quantityButtonStyle}
              >
                -
              </button>
              <span style={{ fontSize: '20px', fontWeight: 'bold', width: '40px', textAlign: 'center' }}>
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                style={quantityButtonStyle}
              >
                +
              </button>
            </div>
          </div>

          {/* Total */}
          <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '20px' }}>
            Total: ${calculateTotal().toFixed(2)}
          </div>

          {/* Botón agregar */}
          <button onClick={handleAddToCart} style={addToCartButtonStyle}>
            🛒 Agregar al carrito
          </button>
        </div>
      </div>

      {/* Información adicional */}
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' }}>
        {product.preparation_time && (
          <p>⏱️ Tiempo de preparación: {product.preparation_time} minutos</p>
        )}
        {product.calories && (
          <p>🔥 Calorías: {product.calories} kcal</p>
        )}
      </div>
    </div>
  );
}

const backButtonStyle = {
  padding: '10px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '16px'
};

const quantityButtonStyle = {
  padding: '10px 20px',
  fontSize: '18px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const addToCartButtonStyle = {
  width: '100%',
  padding: '15px',
  fontSize: '18px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default ProductDetail;