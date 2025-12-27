import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import favoriteService from '../services/favoriteService';
import { useCart } from '../context/CartContext';
import './Favorites.css';

const Favorites = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await favoriteService.getFavorites();
      setFavorites(data.favorites || []);
    } catch (error) {
      console.error('Error cargando favoritos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId) => {
    try {
      await favoriteService.removeFavorite(productId);
      setFavorites(prev => prev.filter(fav => fav.id !== productId));
    } catch (error) {
      console.error('Error eliminando favorito:', error);
      alert('Error al eliminar favorito');
    }
  };

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price), 
      image_url: product.image_url,
      quantity: 1
    }, 1);
  };

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>❤️ Mis Favoritos</h1>
        <p>{favorites.length} {favorites.length === 1 ? 'producto' : 'productos'}</p>
      </div>

      {favorites.length === 0 ? (
        <div className="empty-favorites">
          <div className="empty-icon">💔</div>
          <h2>No tienes favoritos aún</h2>
          <p>Explora nuestro menú y marca tus productos favoritos</p>
          <button onClick={() => navigate('/menu')} className="btn-browse">
            Ver Menú
          </button>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((product) => (
            <div key={product.id} className="favorite-card">
              <button
                className="remove-favorite-btn"
                onClick={() => handleRemoveFavorite(product.id)}
                title="Quitar de favoritos"
              >
                ❌
              </button>

              <img src={product.image_url} alt={product.name} />

              <div className="favorite-info">
                <h3>{product.name}</h3>
                <p className="favorite-description">{product.description}</p>
                <div className="favorite-footer">
                  <span className="favorite-price">${parseFloat(product.price).toFixed(2)}</span>
                  <button
                    className="btn-add-to-cart"
                    onClick={() => handleAddToCart(product)}
                  >
                    🛒 Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;
