import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import twoFactorService from '../services/twoFactorService';
import './TwoFactorSettings.css';

function TwoFactorSettings() {
  const { user } = useAuth();
  const [isEnabled, setIsEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null); // 'enable' or 'disable'

  // Load 2FA status on mount
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      console.log('📊 [TwoFactorSettings] Cargando estado de 2FA');
      const response = await twoFactorService.getStatus();
      setIsEnabled(response.twoFactorEnabled || false);
      console.log('✅ [TwoFactorSettings] Estado cargado:', response.twoFactorEnabled);
    } catch (err) {
      console.error('❌ [TwoFactorSettings] Error cargando estado:', err);
      // Don't show error to user, just assume disabled
      setIsEnabled(false);
    }
  };

  const handleToggleClick = (action) => {
    setPendingAction(action);
    setShowConfirmDialog(true);
    setError('');
    setSuccess('');
  };

  const handleConfirmToggle = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    setShowConfirmDialog(false);

    try {
      console.log('🔄 [TwoFactorSettings] Cambiando estado 2FA a:', pendingAction === 'enable');
      const response = await twoFactorService.toggle(pendingAction === 'enable');

      if (response.success) {
        setIsEnabled(pendingAction === 'enable');
        setSuccess(
          pendingAction === 'enable'
            ? '✅ Autenticación de dos factores activada exitosamente'
            : '✅ Autenticación de dos factores desactivada exitosamente'
        );
        console.log('✅ [TwoFactorSettings] Estado cambiado exitosamente');

        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(''), 5000);
      }
    } catch (err) {
      console.error('❌ [TwoFactorSettings] Error cambiando estado:', err);
      setError(err.response?.data?.error || 'Error al cambiar la configuración de 2FA');
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const handleCancelToggle = () => {
    setShowConfirmDialog(false);
    setPendingAction(null);
    setError('');
  };

  return (
    <div className="two-factor-settings">
      <div className="settings-header">
        <div className="settings-title">
          <h3 className="heading-4">🔐 Autenticación de Dos Factores (2FA)</h3>
          <p className="text-muted">
            Añade una capa adicional de seguridad a tu cuenta
          </p>
        </div>
        <div className={`two-factor-badge ${isEnabled ? 'enabled' : 'disabled'}`}>
          {isEnabled ? '✅ Activado' : '⚪ Desactivado'}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="alert alert-error animate-shake">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {/* Success Alert */}
      {success && (
        <div className="alert alert-success animate-fade-in">
          <span>✅</span>
          <p>{success}</p>
        </div>
      )}

      {/* Information Card */}
      <div className="two-factor-info card">
        <div className="info-section">
          <h4 className="heading-5">¿Qué es 2FA?</h4>
          <p className="text-muted">
            La autenticación de dos factores (2FA) añade una capa adicional de seguridad
            a tu cuenta. Cuando inicies sesión, recibirás un código de verificación de 6
            dígitos en tu correo electrónico que deberás ingresar para completar el acceso.
          </p>
        </div>

        <div className="info-section">
          <h4 className="heading-5">Beneficios de activar 2FA</h4>
          <ul className="benefits-list">
            <li>🛡️ Mayor seguridad para tu cuenta</li>
            <li>📧 Código único enviado a tu email: <strong>{user?.email}</strong></li>
            <li>⏱️ Códigos válidos por 10 minutos</li>
            <li>🔄 Posibilidad de reenviar código si no lo recibes</li>
            <li>🚫 Protección contra accesos no autorizados</li>
          </ul>
        </div>

        <div className="info-section">
          <h4 className="heading-5">¿Cómo funciona?</h4>
          <ol className="steps-list">
            <li>Inicia sesión con tu email y contraseña</li>
            <li>Revisa tu correo electrónico para obtener el código de 6 dígitos</li>
            <li>Ingresa el código en la pantalla de verificación</li>
            <li>Accede a tu cuenta de forma segura</li>
          </ol>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="two-factor-actions">
        {!isEnabled ? (
          <button
            onClick={() => handleToggleClick('enable')}
            disabled={loading}
            className="btn btn-primary btn-lg hover-lift"
          >
            {loading ? (
              <>
                <span className="loading-spinner loading-spinner-white"></span>
                Activando...
              </>
            ) : (
              <>
                🔐 Activar 2FA
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => handleToggleClick('disable')}
            disabled={loading}
            className="btn btn-danger btn-lg hover-lift"
          >
            {loading ? (
              <>
                <span className="loading-spinner loading-spinner-white"></span>
                Desactivando...
              </>
            ) : (
              <>
                🔓 Desactivar 2FA
              </>
            )}
          </button>
        )}
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay" onClick={handleCancelToggle}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="heading-4">
                {pendingAction === 'enable' ? '🔐 Activar 2FA' : '🔓 Desactivar 2FA'}
              </h3>
            </div>
            <div className="modal-body">
              <p>
                {pendingAction === 'enable' ? (
                  <>
                    ¿Estás seguro de que deseas <strong>activar</strong> la autenticación
                    de dos factores? A partir de ahora, necesitarás un código de verificación
                    enviado a <strong>{user?.email}</strong> cada vez que inicies sesión.
                  </>
                ) : (
                  <>
                    ¿Estás seguro de que deseas <strong>desactivar</strong> la autenticación
                    de dos factores? Esto reducirá la seguridad de tu cuenta.
                  </>
                )}
              </p>
            </div>
            <div className="modal-footer">
              <button
                onClick={handleCancelToggle}
                className="btn btn-outline btn-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmToggle}
                className={`btn ${pendingAction === 'enable' ? 'btn-primary' : 'btn-danger'} btn-lg hover-lift`}
              >
                {pendingAction === 'enable' ? 'Activar' : 'Desactivar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorSettings;
