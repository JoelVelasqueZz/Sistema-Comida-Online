import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detectar scroll para agregar sombra al navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className={`navbar-modern ${scrolled ? 'scrolled' : ''}`}>
      <div className="container container-7xl">
        <div className="navbar-content">
          {/* Logo con gradiente */}
          <Link to="/" className="navbar-logo" onClick={closeMobileMenu}>
            🍔 DELIVEO EC
          </Link>

          {/* Botón hamburguesa para móvil con animación */}
          <button
            className="hamburger-menu btn-press"
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>

          {/* Menú desktop y móvil con animaciones */}
          <div className={`navbar-menu ${mobileMenuOpen ? 'mobile-open animate-slide-in-right' : ''}`}>
            {/* Link al menú con indicador activo */}
            <Link
              to="/menu"
              className={`navbar-link hover-underline ${isActive('/menu')}`}
              onClick={closeMobileMenu}
            >
              📋 Menú
            </Link>

            {user ? (
              <>
                {/* Links para usuarios autenticados */}
                <Link
                  to="/orders"
                  className={`navbar-link hover-underline ${isActive('/orders')}`}
                  onClick={closeMobileMenu}
                >
                  📦 Mis Pedidos
                </Link>

                <Link
                  to="/profile"
                  className={`navbar-link hover-underline ${isActive('/profile')}`}
                  onClick={closeMobileMenu}
                >
                  👤 Perfil
                </Link>

                {/* Carrito con badge animado */}
                <Link
                  to="/cart"
                  className="navbar-cart"
                  onClick={closeMobileMenu}
                >
                  🛒 Carrito
                  {getItemCount() > 0 && (
                    <span className="cart-badge">{getItemCount()}</span>
                  )}
                </Link>

                {/* Botón logout con efecto hover */}
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-secondary btn-sm hover-shrink"
                >
                  🚪 Salir
                </button>
              </>
            ) : (
              <>
                {/* Links para usuarios no autenticados */}
                <Link
                  to="/login"
                  className={`navbar-link hover-underline ${isActive('/login')}`}
                  onClick={closeMobileMenu}
                >
                  🔐 Iniciar Sesión
                </Link>

                <Link to="/register" onClick={closeMobileMenu}>
                  <button className="btn btn-primary btn-sm hover-lift">
                    ✨ Registrarse
                  </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;