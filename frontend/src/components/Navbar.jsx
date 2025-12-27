import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState, useEffect, useRef } from 'react';
import NotificationBell from './Notifications/NotificationBell';
import './Navbar.css';

function Navbar() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    setProfileDropdownOpen(false);
  }, [location]);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
  };

  const toggleProfileDropdown = () => {
    setProfileDropdownOpen(!profileDropdownOpen);
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
                {user.role === 'delivery' ? (
                  <>
                    <Link
                      to="/delivery/available-orders"
                      className={`navbar-link hover-underline ${isActive('/delivery/available-orders')}`}
                      onClick={closeMobileMenu}
                    >
                      📦 Disponibles
                    </Link>
                    <Link
                      to="/delivery/my-deliveries"
                      className={`navbar-link hover-underline ${isActive('/delivery/my-deliveries')}`}
                      onClick={closeMobileMenu}
                    >
                      🚚 Mis Entregas
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/orders"
                      className={`navbar-link hover-underline ${isActive('/orders')}`}
                      onClick={closeMobileMenu}
                    >
                      📦 Mis Pedidos
                    </Link>

                    <Link
                      to="/favorites"
                      className={`navbar-link hover-underline ${isActive('/favorites')}`}
                      onClick={closeMobileMenu}
                    >
                      ❤️ Favoritos
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
                  </>
                )}

                {/* Notificaciones */}
                <NotificationBell />

                {/* Dropdown de Perfil */}
                <div className="profile-dropdown-container" ref={dropdownRef}>
                  <button
                    className="profile-dropdown-trigger"
                    onClick={toggleProfileDropdown}
                  >
                    👤 {user.name || 'Perfil'}
                    <span className={`dropdown-arrow ${profileDropdownOpen ? 'open' : ''}`}>
                      ▼
                    </span>
                  </button>

                  {profileDropdownOpen && (
                    <div className="profile-dropdown-menu animate-fade-in">
                      <div className="dropdown-header">
                        <div className="dropdown-user-info">
                          <p className="dropdown-user-name">{user.name}</p>
                          <p className="dropdown-user-email">{user.email}</p>
                          {user.role && (
                            <span className={`dropdown-user-role role-${user.role}`}>
                              {user.role === 'admin' ? '👑 Administrador' :
                               user.role === 'delivery' ? '🚚 Repartidor' : '👤 Cliente'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="dropdown-divider"></div>

                      <Link
                        to="/profile"
                        className="dropdown-item"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          closeMobileMenu();
                        }}
                      >
                        <span className="dropdown-item-icon">👤</span>
                        Ver Perfil
                      </Link>

                      {user.role !== 'delivery' && (
                        <Link
                          to="/favorites"
                          className="dropdown-item"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-item-icon">❤️</span>
                          Mis Favoritos
                        </Link>
                      )}

                      {user.role === 'admin' && (
                        <Link
                          to="/admin/dashboard"
                          className="dropdown-item dropdown-item-admin"
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            closeMobileMenu();
                          }}
                        >
                          <span className="dropdown-item-icon">📊</span>
                          Dashboard Admin
                        </Link>
                      )}

                      <div className="dropdown-divider"></div>

                      <button
                        onClick={handleLogout}
                        className="dropdown-item dropdown-item-danger"
                      >
                        <span className="dropdown-item-icon">🚪</span>
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
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