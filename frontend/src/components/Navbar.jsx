import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useState } from 'react';

function Navbar() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle} onClick={closeMobileMenu}>
          🍔 Food Delivery
        </Link>

        {/* Botón hamburguesa para móvil */}
        <button 
          style={hamburgerStyle} 
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? '✕' : '☰'}
        </button>

        {/* Menú desktop y móvil */}
        <div style={{
          ...menuStyle,
          ...(mobileMenuOpen ? mobileMenuOpenStyle : {})
        }}>
          <Link to="/menu" style={linkStyle} onClick={closeMobileMenu}>
            Menú
          </Link>

          {user ? (
            <>
              <Link to="/orders" style={linkStyle} onClick={closeMobileMenu}>
                Mis Pedidos
              </Link>
              <Link to="/profile" style={linkStyle} onClick={closeMobileMenu}>
                Perfil
              </Link>
              <Link to="/cart" style={cartLinkStyle} onClick={closeMobileMenu}>
                🛒 Carrito
                {getItemCount() > 0 && (
                  <span style={badgeStyle}>{getItemCount()}</span>
                )}
              </Link>
              <button onClick={handleLogout} style={logoutButtonStyle}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" style={linkStyle} onClick={closeMobileMenu}>
                Iniciar Sesión
              </Link>
              <Link to="/register" onClick={closeMobileMenu}>
                <button style={registerButtonStyle}>Registrarse</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

const navStyle = {
  backgroundColor: '#007bff',
  color: 'white',
  padding: '15px 0',
  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  position: 'sticky',
  top: 0,
  zIndex: 1000
};

const containerStyle = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '0 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const logoStyle = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: 'white',
  textDecoration: 'none'
};

const hamburgerStyle = {
  display: 'none',
  fontSize: '24px',
  backgroundColor: 'transparent',
  border: 'none',
  color: 'white',
  cursor: 'pointer',
  padding: '5px 10px'
};

const menuStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '20px'
};

const mobileMenuOpenStyle = {
  display: 'flex'
};

const linkStyle = {
  color: 'white',
  textDecoration: 'none',
  fontSize: '16px',
  fontWeight: '500'
};

const cartLinkStyle = {
  ...linkStyle,
  position: 'relative'
};

const badgeStyle = {
  position: 'absolute',
  top: '-8px',
  right: '-10px',
  backgroundColor: '#dc3545',
  color: 'white',
  borderRadius: '50%',
  width: '20px',
  height: '20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '12px',
  fontWeight: 'bold'
};

const logoutButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#dc3545',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

const registerButtonStyle = {
  padding: '8px 16px',
  backgroundColor: '#28a745',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold'
};

// Media query para responsive (agregar al final del archivo)
if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @media (max-width: 768px) {
      nav button[aria-label="Toggle menu"] {
        display: block !important;
      }
      
      nav > div > div:last-child {
        display: none;
        position: absolute;
        top: 60px;
        left: 0;
        right: 0;
        background-color: #007bff;
        flex-direction: column;
        padding: 20px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      
      nav > div > div:last-child a,
      nav > div > div:last-child button {
        width: 100%;
        text-align: center;
        padding: 12px;
      }
    }
  `;
  document.head.appendChild(style);
}

export default Navbar;