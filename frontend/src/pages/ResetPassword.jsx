import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import passwordResetService from '../services/passwordResetService';
import './Auth.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Verificar token al montar
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setError('Token no proporcionado');
        setVerifying(false);
        return;
      }

      try {
        const data = await passwordResetService.verifyToken(token);
        setEmail(data.email);
      } catch (err) {
        setError(err.response?.data?.error || 'Token inválido o expirado');
      } finally {
        setVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await passwordResetService.resetPassword(token, password);
      setSuccess(true);

      // Redirigir al login después de 3 segundos
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card card card-elevated">
            <div className="auth-header">
              <div className="auth-icon">
                <span className="loading-spinner loading-spinner-primary"></span>
              </div>
              <p className="text-muted">Verificando token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !email) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card card card-elevated">
            <div className="auth-header">
              <div className="auth-icon">❌</div>
              <h2 className="heading-3">Token Inválido</h2>
              <p className="text-muted">{error}</p>
            </div>
            <div className="auth-footer">
              <Link to="/forgot-password" className="auth-link text-primary hover-underline">
                Solicitar nuevo token
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        <div className="auth-card card card-elevated">
          {!success ? (
            <>
              {/* Header */}
              <div className="auth-header">
                <div className="auth-icon">🔐</div>
                <h2 className="heading-3">Nueva Contraseña</h2>
                <p className="text-muted">
                  Ingresa tu nueva contraseña para <strong>{email}</strong>
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
                  <label className="label">Nueva Contraseña</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="input input-lg"
                    placeholder="••••••••"
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Confirmar Contraseña</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="input input-lg"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
                      Actualizando...
                    </>
                  ) : (
                    'Actualizar Contraseña'
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success Message */}
              <div className="auth-header">
                <div className="auth-icon">✅</div>
                <h2 className="heading-3">¡Contraseña Actualizada!</h2>
                <p className="text-muted">
                  Tu contraseña ha sido actualizada exitosamente. Redirigiendo al login...
                </p>
              </div>

              <div className="alert alert-success">
                <span>🎉</span>
                <p>Ya puedes iniciar sesión con tu nueva contraseña</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
