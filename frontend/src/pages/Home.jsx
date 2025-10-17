import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Home() {
  const { user } = useAuth();

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🍔 Bienvenido a Food Delivery</h1>
      <p style={{ fontSize: '18px', color: '#666', margin: '20px 0' }}>
        Ordena tu comida favorita y recíbela en tu puerta
      </p>

      {user ? (
        <div>
          <p style={{ marginBottom: '20px' }}>¡Hola, {user.name}!</p>
          <Link to="/menu">
            <button style={buttonStyle}>
              Ver Menú 🍕
            </button>
          </Link>
        </div>
      ) : (
        <div>
          <Link to="/login">
            <button style={buttonStyle}>
              Iniciar Sesión
            </button>
          </Link>
          <Link to="/register">
            <button style={{ ...buttonStyle, marginLeft: '10px', backgroundColor: '#28a745' }}>
              Registrarse
            </button>
          </Link>
        </div>
      )}

      <div style={{ marginTop: '40px' }}>
        <h2>¿Por qué elegirnos?</h2>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginTop: '20px' }}>
          <div>
            <h3>🚀 Rápido</h3>
            <p>Entrega en 30 minutos</p>
          </div>
          <div>
            <h3>🍕 Delicioso</h3>
            <p>Comida fresca y sabrosa</p>
          </div>
          <div>
            <h3>💳 Seguro</h3>
            <p>Pagos protegidos</p>
          </div>
        </div>
      </div>
    </div>
  );
}

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

export default Home;