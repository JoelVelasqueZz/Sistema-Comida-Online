import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import twoFactorService from '../services/twoFactorService';
import './Auth.css';

function Login() {
  // Login states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 2FA states
  const [showTwoFactorForm, setShowTwoFactorForm] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [resendCooldown, setResendCooldown] = useState(0);

  const { login, setAuthData } = useAuth();
  const navigate = useNavigate();

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(resendCooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Handle initial login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 [Login] Intentando login con email:', email);
      const response = await login(email, password);

      // Check if 2FA is required
      if (response?.requiresTwoFactor) {
        console.log('🔐 [Login] 2FA requerido para usuario:', response.userId);
        setShowTwoFactorForm(true);
        setUserId(response.userId);
        setUserEmail(response.email);
        setUserName(response.name || 'Usuario');

        // Generate and send 2FA code
        try {
          const codeResponse = await twoFactorService.generateCode(response.userId, response.email);
          console.log('📧 [Login] Código 2FA generado');

          // Send code by email
          await twoFactorService.sendCodeByEmail(
            response.email,
            codeResponse.code,
            response.name || 'Usuario'
          );
          console.log('✅ [Login] Código enviado por email');
          setResendCooldown(60); // 60 seconds cooldown
        } catch (emailError) {
          console.error('❌ [Login] Error enviando código:', emailError);
          setError('Error al enviar el código de verificación. Intenta nuevamente.');
          setShowTwoFactorForm(false);
        }
      } else {
        // Normal login without 2FA
        console.log('✅ [Login] Login exitoso sin 2FA');
        navigate('/menu');
      }
    } catch (err) {
      console.error('❌ [Login] Error en login:', err);
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  // Handle 2FA code verification
  const handleTwoFactorSubmit = async (e) => {
  e.preventDefault();
  setError('');
  setLoading(true);

  try {
    console.log('🔍 [Login] Verificando código 2FA');
    
    // PASO 1: Verificar el código
    const verifyResponse = await twoFactorService.verifyCode(userId, twoFactorCode);

    if (verifyResponse.success) {
      console.log('✅ [Login] Código verificado correctamente');
      
      // PASO 2: Hacer login completo para obtener los tokens
      console.log('🔐 [Login] Completando login para obtener tokens...');
      const loginResponse = await login(email, password);
      
      console.log('✅ [Login] Login completado exitosamente');
      console.log('🏠 [Login] Redirigiendo a menu...');
      
      // PASO 3: Redirigir
      navigate('/menu');
    }
  } catch (err) {
    console.error('❌ [Login] Error verificando código:', err);
    const errorMessage = err.response?.data?.error || 'Código inválido';
    const newAttemptsLeft = err.response?.data?.attemptsLeft;

    setError(errorMessage);

    if (newAttemptsLeft !== undefined) {
      setAttemptsLeft(newAttemptsLeft);
      if (newAttemptsLeft === 0) {
        setError('Has excedido el número de intentos. Por favor, solicita un nuevo código.');
        setTwoFactorCode('');
      }
    } else {
      // Decrementar intentos manualmente si el backend no lo retorna
      const newAttempts = attemptsLeft - 1;
      setAttemptsLeft(newAttempts);
      
      if (newAttempts === 0) {
        setError('Has excedido el número de intentos. Por favor, solicita un nuevo código.');
        setTwoFactorCode('');
      }
    }
  } finally {
    setLoading(false);
  }
};

  // Handle resend code
  const handleResendCode = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setLoading(true);

    try {
      console.log('📧 [Login] Reenviando código 2FA');
      const codeResponse = await twoFactorService.generateCode(userId, userEmail);

      await twoFactorService.sendCodeByEmail(
        userEmail,
        codeResponse.code,
        userName
      );

      console.log('✅ [Login] Código reenviado exitosamente');
      setResendCooldown(60);
      setAttemptsLeft(3);
      setTwoFactorCode('');
      setError('');
    } catch (err) {
      console.error('❌ [Login] Error reenviando código:', err);
      setError('Error al reenviar el código. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  // Handle back to login
  const handleBackToLogin = () => {
    setShowTwoFactorForm(false);
    setTwoFactorCode('');
    setUserId(null);
    setUserEmail('');
    setUserName('');
    setAttemptsLeft(3);
    setResendCooldown(0);
    setError('');
  };

  return (
    <div className="auth-page">
      <div className="auth-container animate-fade-in-up">
        {/* Auth Card */}
        <div className="auth-card card card-elevated">
          {!showTwoFactorForm ? (
            <>
              {/* Login Form */}
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
              <form onSubmit={handleLoginSubmit} className="auth-form">
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
            </>
          ) : (
            <>
              {/* 2FA Verification Form */}
              {/* Header */}
              <div className="auth-header">
                <div className="auth-icon">📧</div>
                <h2 className="heading-3">Verificación en dos pasos</h2>
                <p className="text-muted">
                  Hemos enviado un código de 6 dígitos a <strong>{userEmail}</strong>
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="alert alert-error animate-shake">
                  <span>⚠️</span>
                  <p>{error}</p>
                </div>
              )}

              {/* Success Alert */}
              {!error && resendCooldown === 60 && (
                <div className="alert alert-success">
                  <span>✅</span>
                  <p>Código enviado exitosamente. Revisa tu bandeja de entrada.</p>
                </div>
              )}

              {/* 2FA Form */}
              <form onSubmit={handleTwoFactorSubmit} className="auth-form">
                {/* Code Input */}
                <div className="form-group">
                  <label className="label">Código de verificación</label>
                  <input
                    type="text"
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    required
                    className="input input-lg two-factor-code-input"
                    placeholder="000000"
                    maxLength="6"
                    autoComplete="off"
                    style={{
                      fontSize: '24px',
                      letterSpacing: '8px',
                      textAlign: 'center',
                      fontFamily: 'monospace'
                    }}
                  />
                  <small className="text-muted">
                    Intentos restantes: <strong>{attemptsLeft}</strong>
                  </small>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || twoFactorCode.length !== 6}
                  className="btn btn-primary btn-lg btn-block hover-lift"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner loading-spinner-primary"></span>
                      Verificando...
                    </>
                  ) : (
                    'Verificar código'
                  )}
                </button>

                {/* Resend Button */}
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || loading}
                  className="btn btn-outline btn-lg btn-block"
                  style={{ marginTop: '12px' }}
                >
                  {resendCooldown > 0 ? (
                    `Reenviar código en ${resendCooldown}s`
                  ) : (
                    'Reenviar código'
                  )}
                </button>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={handleBackToLogin}
                  className="btn btn-ghost btn-lg btn-block"
                  style={{ marginTop: '12px' }}
                >
                  ← Volver al inicio de sesión
                </button>
              </form>
            </>
          )}
        </div>

        {/* Back to Home Link */}
        {!showTwoFactorForm && (
          <div className="auth-back">
            <Link to="/" className="text-muted hover-underline">
              ← Volver al inicio
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
