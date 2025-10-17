import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { useCart } from '../context/CartContext';

function Menu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const { addToCart } = useCart();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await menuService.getCategories();
      setCategories(data.categories);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const loadProducts = async (categoryId = null) => {
    try {
      setLoading(true);
      let data;
      if (categoryId) {
        data = await menuService.getProductsByCategory(categoryId);
      } else {
        data = await menuService.getProducts({ available: 'true' });
      }
      setProducts(data.products);
    } catch (err) {
      setError('Error al cargar productos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    loadProducts(categoryId);
  };

  const handleShowAll = () => {
    setSelectedCategory(null);
    loadProducts();
  };

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      alert('Escribe al menos 2 caracteres para buscar');
      return;
    }
    try {
      setLoading(true);
      const data = await menuService.searchProducts(searchTerm);
      setProducts(data.products);
      setSelectedCategory(null);
    } catch (err) {
    setError('Error al buscar productos');
    console.error('Error en búsqueda:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product, 1);
    alert(`${product.name} agregado al carrito`);
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>🍕 Nuestro Menú</h1>

      {/* Buscador */}
      <div style={{ marginBottom: '30px' }}>
        <input
          type="text"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          style={searchInputStyle}
        />
        <button onClick={handleSearch} style={searchButtonStyle}>
          🔍 Buscar
        </button>
      </div>

      {/* Categorías */}
      <div style={{ marginBottom: '30px' }}>
        <button
          onClick={handleShowAll}
          style={{
            ...categoryButtonStyle,
            backgroundColor: selectedCategory === null ? '#007bff' : '#e0e0e0',
            color: selectedCategory === null ? 'white' : 'black'
          }}
        >
          Todos
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => handleCategoryClick(category.id)}
            style={{
              ...categoryButtonStyle,
              backgroundColor: selectedCategory === category.id ? '#007bff' : '#e0e0e0',
              color: selectedCategory === category.id ? 'white' : 'black'
            }}
          >
            {category.name}
          </button>
        ))}
      </div>

      {/* Productos */}
      {loading ? (
        <p>Cargando productos...</p>
      ) : error ? (
        <p style={{ color: 'red' }}>{error}</p>
      ) : products.length === 0 ? (
        <p>No se encontraron productos</p>
      ) : (
        <div style={productsGridStyle}>
          {products.map((product) => (
            <div key={product.id} style={productCardStyle}>
              <img
                src={product.image_url || 'https://via.placeholder.com/200'}
                alt={product.name}
                style={productImageStyle}
              />
              <h3 style={{ margin: '10px 0' }}>{product.name}</h3>
              <p style={{ color: '#666', fontSize: '14px', minHeight: '40px' }}>
                {product.description}
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                  ${parseFloat(product.price).toFixed(2)}
                </span>
                <div>
                  <Link to={`/product/${product.id}`}>
                    <button style={detailButtonStyle}>Ver</button>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product)}
                    style={addButtonStyle}
                  >
                    + Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const searchInputStyle = {
  padding: '10px',
  fontSize: '16px',
  border: '1px solid #ddd',
  borderRadius: '5px',
  width: '300px',
  marginRight: '10px'
};

const searchButtonStyle = {
  padding: '10px 20px',
  fontSize: '16px',
  backgroundColor: '#007bff',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

const categoryButtonStyle = {
  padding: '10px 20px',
  margin: '0 5px 10px 0',
  fontSize: '14px',
  border: 'none',
  borderRadius: '20px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

const productsGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '20px'
};

const productCardStyle = {
  backgroundColor: 'white',
  padding: '15px',
  borderRadius: '10px',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  transition: 'transform 0.2s',
  cursor: 'pointer'
};

const productImageStyle = {
  width: '100%',
  height: '150px',
  objectFit: 'cover',
  borderRadius: '8px'
};

const detailButtonStyle = {
  padding: '8px 12px',
  fontSize: '14px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  marginRight: '5px'
};

const addButtonStyle = {
  padding: '8px 12px',
  fontSize: '14px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer'
};

export default Menu;