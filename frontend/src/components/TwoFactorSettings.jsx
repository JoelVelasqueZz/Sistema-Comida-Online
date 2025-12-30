import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import twoFactorService from '../services/twoFactorService';
import totpService from '../services/totpService';
import './TwoFactorSettings.css';

function TwoFactorSettings() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(false);
  const [method, setMethod] = useState('email'); // 'email' o 'totp'
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Estados para TOTP
  const [showTotpSetup, setShowTotpSetup] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [settingUpTotp, setSettingUpTotp] = useState(false);

  // Cargar estado al montar
  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  const loadTwoFactorStatus = async () => {
    try {
      console.log('📊 [2FA Settings] Cargando estado actual...');

      const data = await twoFactorService.getStatus();

      console.log('📊 [2FA Settings] Estado recibido del backend:', data);
      console.log('📊 [2FA Settings] Enabled:', data.enabled);
      console.log('📊 [2FA Settings] Method:', data.method);

      setEnabled(data.enabled || false);
      setMethod(data.method || 'email');

      console.log('✅ [2FA Settings] Estados actualizados:', {
        enabled: data.enabled,
        method: data.method
      });
    } catch (error) {
      console.error('❌ [2FA Settings] Error cargando estado:', error);
      console.error('❌ [2FA Settings] Error completo:', error.response?.data);
      setEnabled(false);
      setMethod('email');
    }
  };

  const handleStartTotpSetup = async () => {
    try {
      setSettingUpTotp(true);
      setMessage('');

      console.log('🔐 [TOTP] Iniciando configuración...');
      const data = await totpService.setupTotp();

      setQrCode(data.qrCode);
      setTotpSecret(data.secret);
      setShowTotpSetup(true);

      console.log('✅ [TOTP] QR Code generado');
    } catch (error) {
      console.error('❌ [TOTP] Error:', error);
      alert('Error al configurar TOTP');
    } finally {
      setSettingUpTotp(false);
    }
  };

  const handleVerifyTotp = async () => {
    if (totpVerifyCode.length !== 6) {
      alert('Ingresa el código de 6 dígitos');
      return;
    }

    try {
      setSaving(true);
      setMessage('');

      console.log('🔐 [TOTP] Verificando código...');
      await totpService.enableTotp(totpVerifyCode, totpSecret);

      console.log('✅ [TOTP] TOTP activado');

      setEnabled(true);
      setMethod('totp');
      setShowTotpSetup(false);
      setQrCode('');
      setTotpSecret('');
      setTotpVerifyCode('');

      setMessage('✅ Authenticator App configurado exitosamente');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('❌ [TOTP] Error:', error);
      alert('Código inválido. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (newEnabled, newMethod = 'email') => {
    try {
      setSaving(true);
      setMessage('');

      if (newMethod === 'totp' && newEnabled) {
        // Iniciar setup de TOTP
        await handleStartTotpSetup();
        setSaving(false);
        return;
      }

      if (!newEnabled || newMethod === 'email') {
        // Desactivar o activar Email
        await twoFactorService.toggle(newEnabled, newMethod);
        setEnabled(newEnabled);
        setMethod(newMethod);

        const msg = newEnabled
          ? '✅ Email 2FA habilitado correctamente'
          : '✅ 2FA deshabilitado correctamente';

        setMessage(msg);
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (error) {
      console.error('Error al cambiar 2FA:', error);
      alert('Error al actualizar configuración de 2FA');
    } finally {
      setSaving(false);
    }
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
        <div className={`two-factor-badge ${enabled ? 'enabled' : 'disabled'}`}>
          {enabled ? `✅ Activado (${method === 'totp' ? 'App' : 'Email'})` : '⚪ Desactivado'}
        </div>
      </div>

      {/* Mensaje de éxito/error */}
      {message && (
        <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-error'} animate-fade-in`}>
          <p>{message}</p>
        </div>
      )}

      {/* Opciones de 2FA */}
      <div className="two-factor-options">
        <h4 className="heading-5" style={{ marginBottom: '16px' }}>Elige tu método de verificación:</h4>

        {/* Opción: Desactivado */}
        <label className={`option-card ${!enabled ? 'active' : ''}`}>
          <input
            type="radio"
            name="two-factor"
            checked={!enabled}
            onChange={() => handleToggle(false)}
            disabled={saving || settingUpTotp}
          />
          <div className="option-content">
            <div className="option-icon">⚪</div>
            <div className="option-info">
              <h4>Desactivado</h4>
              <p>Sin verificación adicional al iniciar sesión</p>
            </div>
          </div>
        </label>

        {/* Opción: Email */}
        <label className={`option-card ${enabled && method === 'email' ? 'active' : ''}`}>
          <input
            type="radio"
            name="two-factor"
            checked={enabled && method === 'email'}
            onChange={() => handleToggle(true, 'email')}
            disabled={saving || settingUpTotp}
          />
          <div className="option-content">
            <div className="option-icon">📧</div>
            <div className="option-info">
              <h4>Código por Email</h4>
              <p>Recibe un código de 6 dígitos en: <strong>{user?.email}</strong></p>
            </div>
          </div>
        </label>

        {/* Opción: Authenticator App */}
        <label className={`option-card ${enabled && method === 'totp' ? 'active' : ''}`}>
          <input
            type="radio"
            name="two-factor"
            checked={enabled && method === 'totp'}
            onChange={() => handleToggle(true, 'totp')}
            disabled={saving || settingUpTotp}
          />
          <div className="option-content">
            <div className="option-icon">🔑</div>
            <div className="option-info">
              <h4>Authenticator App</h4>
              <p>Google/Microsoft Authenticator - Más seguro</p>
            </div>
          </div>
        </label>
      </div>

      {/* Información adicional */}
      <div className="two-factor-info card" style={{ marginTop: '24px' }}>
        <div className="info-section">
          <h4 className="heading-5">¿Qué es 2FA?</h4>
          <p className="text-muted">
            La autenticación de dos factores (2FA) añade una capa adicional de seguridad
            a tu cuenta. Puedes elegir entre recibir códigos por email o usar una app de autenticación.
          </p>
        </div>

        <div className="info-section">
          <h4 className="heading-5">Métodos disponibles</h4>
          <ul className="benefits-list">
            <li>📧 <strong>Email:</strong> Códigos enviados a tu correo (válidos 10 minutos)</li>
            <li>🔑 <strong>Authenticator App:</strong> Códigos generados en tu móvil (más seguro, sin necesidad de internet)</li>
          </ul>
        </div>
      </div>

      {/* Modal de setup TOTP */}
      {showTotpSetup && (
        <div className="totp-setup-modal">
          <div className="modal-overlay" onClick={() => !saving && setShowTotpSetup(false)}></div>
          <div className="modal-content">
            <h3>🔑 Configurar Authenticator App</h3>

            <div className="setup-steps">
              <div className="step">
                <div className="step-number">1</div>
                <div style={{ flex: 1 }}>
                  <p>Abre Google Authenticator en tu móvil</p>
                </div>
              </div>

              <div className="step">
                <div className="step-number">2</div>
                <div style={{ flex: 1 }}>
                  <p>Escanea este código QR:</p>
                  <div className="qr-code-container">
                    <img src={qrCode} alt="QR Code" />
                  </div>
                  <details className="manual-entry">
                    <summary>¿No puedes escanear? Ingresa manualmente</summary>
                    <code>{totpSecret}</code>
                  </details>
                </div>
              </div>

              <div className="step">
                <div className="step-number">3</div>
                <div style={{ flex: 1 }}>
                  <p>Ingresa el código de 6 dígitos que aparece en la app:</p>
                  <input
                    type="text"
                    value={totpVerifyCode}
                    onChange={(e) => setTotpVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="totp-code-input"
                    placeholder="000000"
                    maxLength="6"
                    autoFocus
                  />
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                onClick={handleVerifyTotp}
                disabled={saving || totpVerifyCode.length !== 6}
                className="btn btn-primary"
              >
                {saving ? 'Verificando...' : 'Verificar y Activar'}
              </button>
              <button
                onClick={() => setShowTotpSetup(false)}
                disabled={saving}
                className="btn btn-ghost"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TwoFactorSettings;
