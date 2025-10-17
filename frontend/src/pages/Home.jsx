import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Home.css';

function Home() {
  const { user } = useAuth();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section animate-fade-in-up">
        <div className="container container-7xl">
          <div className="hero-content">
            <h1 className="hero-title text-gradient">
              Bienvenido a Food Delivery
            </h1>
            <p className="hero-subtitle">
              Ordena tu comida favorita y recíbela en tu puerta en minutos
            </p>

            {user ? (
              <div className="hero-actions animate-fade-in-up animate-delay-1">
                <p className="welcome-text">
                  ¡Hola, <span className="text-primary font-semibold">{user.name}</span>! 👋
                </p>
                <Link to="/menu">
                  <button className="btn btn-primary btn-lg hover-lift">
                    Ver Menú Completo 🍕
                  </button>
                </Link>
              </div>
            ) : (
              <div className="hero-actions animate-fade-in-up animate-delay-1">
                <Link to="/register">
                  <button className="btn btn-primary btn-lg hover-lift">
                    Comenzar Ahora
                  </button>
                </Link>
                <Link to="/login">
                  <button className="btn btn-outline btn-lg hover-grow">
                    Iniciar Sesión
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container container-7xl">
          <h2 className="features-title heading-2 text-center mb-8">
            ¿Por qué elegirnos?
          </h2>

          <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="feature-card card card-body hover-lift animate-fade-in-up">
              <div className="feature-icon">🚀</div>
              <h3 className="feature-card-title heading-4">Entrega Rápida</h3>
              <p className="feature-card-description text-muted">
                Recibe tu pedido en menos de 30 minutos. Garantizado.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="feature-card card card-body hover-lift animate-fade-in-up animate-delay-1">
              <div className="feature-icon">🍕</div>
              <h3 className="feature-card-title heading-4">Comida Deliciosa</h3>
              <p className="feature-card-description text-muted">
                Platos frescos preparados por los mejores restaurantes.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="feature-card card card-body hover-lift animate-fade-in-up animate-delay-2">
              <div className="feature-icon">💳</div>
              <h3 className="feature-card-title heading-4">Pagos Seguros</h3>
              <p className="feature-card-description text-muted">
                Transacciones protegidas con encriptación de última generación.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container container-7xl">
          <div className="cta-card card-elevated animate-scale-in">
            <h2 className="heading-2 text-center mb-4">
              ¿Listo para ordenar?
            </h2>
            <p className="text-center text-lg text-muted mb-6">
              Descubre nuestro menú completo y encuentra tus platos favoritos
            </p>
            <div className="flex justify-center">
              <Link to="/menu">
                <button className="btn btn-secondary btn-xl hover-lift">
                  Explorar Menú 🍽️
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
