import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password
      });
      navigate('/menu');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse');
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
            <div className="auth-icon">📝</div>
            <h2 className="heading-3">Crear Cuenta</h2>
            <p className="text-muted">Regístrate para comenzar a ordenar</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="alert alert-error animate-shake">
              <span>⚠️</span>
              <p>{error}</p>
            </div>
          )}

          {/* Register Form */}
          <form onSubmit={handleSubmit} className="auth-form">
            {/* Name Input */}
            <div className="form-group">
              <label className="label">Nombre completo</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input input-lg"
                placeholder="Juan Pérez"
                autoComplete="name"
              />
            </div>

            {/* Email Input */}
            <div className="form-group">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="input input-lg"
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            {/* Phone Input */}
            <div className="form-group">
              <label className="label">Teléfono (opcional)</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input input-lg"
                placeholder="0999999999"
                autoComplete="tel"
              />
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label className="label">Contraseña</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="input input-lg"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
              {formData.password && formData.password.length < 6 && (
                <p className="helper-text helper-text-error">
                  La contraseña debe tener al menos 6 caracteres
                </p>
              )}
            </div>

            {/* Confirm Password Input */}
            <div className="form-group">
              <label className="label">Confirmar contraseña</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className={`input input-lg ${
                  formData.confirmPassword && formData.password !== formData.confirmPassword
                    ? 'input-error'
                    : ''
                }`}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="helper-text helper-text-error">
                  Las contraseñas no coinciden
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-success btn-lg btn-block hover-lift"
            >
              {loading ? (
                <>
                  <span className="loading-spinner"></span>
                  Registrando...
                </>
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="auth-footer">
            <p className="text-muted">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="auth-link text-primary font-semibold hover-underline">
                Inicia sesión aquí
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

export default Register;
