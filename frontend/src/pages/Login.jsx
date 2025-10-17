import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        {/* Auth Card */}
        <div className="auth-card card card-elevated">
          {/* Header */}
          <div className="auth-header">
            <div className="auth-icon">🔐</div>
            <h2 className="heading-3">Iniciar Sesión</h2>
            <p className="text-muted">Accede a tu cuenta para continuar</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error animate-shake">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Email Input */}
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="input input-lg"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="input input-lg"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg btn-block hover-lift"
            >
              {loading ? (
                <>
                  <span className="loading-spinner loading-spinner-primary"></span>
                  Iniciando sesión...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="text-muted">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="auth-link text-primary font-semibold hover-underline">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home Link */}
        <div className="auth-back">
          <Link to="/" className="text-muted hover-underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
