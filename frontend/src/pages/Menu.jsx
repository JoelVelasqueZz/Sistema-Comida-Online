import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { menuService } from '../services/menuService';
import { useCart } from '../context/CartContext';
import './Menu.css';

function Menu() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedProduct, setAddedProduct] = useState(null);

  const { addToCart } = useCart();

  useEffect(() => {
    loadCategories();
    loadProducts();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await menuService.getCategories();
      
      // Filtrar categorías duplicadas por nombre
      const uniqueCategories = data.categories.filter(
        (category, index, self) =>
          index === self.findIndex((c) => c.name === category.name)
      );
      
      setCategories(uniqueCategories);
    } catch (err) {
      console.error('Error al cargar categorías:', err);
    }
  };

  const loadProducts = async (categoryId = null) => {
    try {
      setLoading(true);
      setError(''); // Limpiar errores previos
      let data;
      if (categoryId) {
        console.log('🏷️ Cargando productos de categoría:', categoryId);
        data = await menuService.getProductsByCategory(categoryId);
      } else {
        console.log('📦 Cargando todos los productos');
        data = await menuService.getProducts();
      }
      console.log('✅ Productos recibidos:', data.products?.length || 0);
      setProducts(data.products || []);
    } catch (err) {
      setError('Error al cargar productos');
      console.error('❌ Error al cargar productos:', err);
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
      setError('Escribe al menos 2 caracteres para buscar');
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
    setAddedProduct(product.id);
    setTimeout(() => setAddedProduct(null), 2000);
  };

  return (
    <div className="menu-page">
      <div className="container container-7xl">
        {/* Header */}
        <div className="menu-header animate-fade-in-up">
          <h1 className="heading-1 text-gradient">🍕 Nuestro Menú</h1>
          <p className="text-lg text-muted">Descubre nuestros deliciosos platos</p>
        </div>

        {/* Search Bar */}
        <div className="menu-search animate-fade-in-up animate-delay-1">
          <div className="search-box">
            <input
              type="text"
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input input-lg"
            />
            <button onClick={handleSearch} className="btn btn-primary hover-lift">
              🔍 Buscar
            </button>
          </div>
        </div>

        {/* Categories */}
        <div className="menu-categories animate-fade-in-up animate-delay-2">
          <button
            onClick={handleShowAll}
            className={`category-chip ${selectedCategory === null ? 'active' : ''} hover-grow`}
          >
            Todos
          </button>
          {categories.map((category, index) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`category-chip ${selectedCategory === category.id ? 'active' : ''} hover-grow`}
              style={{ animationDelay: `${0.3 + index * 0.1}s` }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="menu-loading">
            <div className="loading-spinner loading-spinner-primary loading-spinner-xl"></div>
            <p className="text-lg text-muted mt-4">Cargando productos deliciosos...</p>
          </div>
        ) : error ? (
          <div className="alert alert-error animate-shake">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : products.length === 0 ? (
          <div className="menu-empty">
            <div className="empty-icon">😕</div>
            <h3 className="heading-3">No se encontraron productos</h3>
            <p className="text-muted">Intenta con otra búsqueda o categoría</p>
          </div>
        ) : (
          <div className="products-grid grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product, index) => (
              <div
                key={product.id}
                className="product-card card-product animate-food-appear"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <Link to={`/product/${product.id}`} className="product-link">
                  <div className="product-image-container">
                    <img
                      src={product.image_url || 'https://via.placeholder.com/200'}
                      alt={product.name}
                      className="product-image"
                    />
                    <div className="product-overlay">
                      <span className="view-detail-btn">Ver Detalles</span>
                    </div>
                  </div>
                </Link>

                <div className="product-content">
                  <h3 className="product-title">{product.name}</h3>
                  <p className="product-description">{product.description}</p>

                  <div className="product-footer">
                    <span className="product-price">
                      ${parseFloat(product.price).toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`btn btn-sm hover-lift ${
                        addedProduct === product.id ? 'btn-success' : 'btn-primary'
                      }`}
                    >
                      {addedProduct === product.id ? (
                        <>✓ Agregado</>
                      ) : (
                        <>+ Agregar</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Menu;
