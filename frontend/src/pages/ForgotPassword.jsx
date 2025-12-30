import { useState } from 'react';
import { Link } from 'react-router-dom';
import passwordResetService from '../services/passwordResetService';
import passwordResetEmailService from '../services/passwordResetEmailService';
import './Auth.css';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 [Forgot Password] Solicitando token de recuperación...');

      // PASO 1: Generar token en el backend
      const response = await passwordResetService.requestReset(email);

      console.log('✅ [Forgot Password] Token recibido');

      // PASO 2: Enviar email con EmailJS (cuenta 2)
      console.log('📧 [Forgot Password] Enviando email...');
      await passwordResetEmailService.sendPasswordResetEmail(
        response.email,
        response.token,
        response.name
      );

      console.log('✅ [Forgot Password] Email enviado exitosamente');
      setSuccess(true);

    } catch (err) {
      console.error('❌ [Forgot Password] Error:', err);
      setError(err.response?.data?.error || 'Error al enviar email de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card card card-elevated">
          {!success ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <div className="auth-icon">🔑</div>
                <h2 className="heading-3">Recuperar Contraseña</h2>
                <p className="text-muted">
                  Ingresa tu email y te enviaremos instrucciones para restablecer tu contraseña
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error animate-shake">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="auth-form">
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

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg btn-block hover-lift"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner loading-spinner-primary"></span>
                      Enviando...
                    </>
                  ) : (
                    'Enviar Email de Recuperación'
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="auth-footer">
                <Link to="/login" className="auth-link text-primary hover-underline">
                  ← Volver al login
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="auth-header">
                <div className="auth-icon">✅</div>
                <h2 className="heading-3">Email Enviado</h2>
                <p className="text-muted">
                  Si el email <strong>{email}</strong> está registrado, recibirás instrucciones para recuperar tu contraseña.
                </p>
              </div>

              <div className="alert alert-success">
                <span>📧</span>
                <p>Revisa tu bandeja de entrada y sigue las instrucciones del email.</p>
              </div>

              <div className="auth-footer">
                <Link to="/login" className="auth-link text-primary hover-underline">
                  ← Volver al login
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="auth-back">
          <Link to="/" className="text-muted hover-underline">
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
