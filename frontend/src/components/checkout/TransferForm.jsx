import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import './TransferForm.css';

const TransferForm = ({ onClose, amount, orderId, confirmationUrl }) => {
  const [qrData, setQrData] = useState('');
  const [bankInfo, setBankInfo] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [countdown, setCountdown] = useState(600); // 10 minutos
  const [copied, setCopied] = useState('');

  useEffect(() => {
    // Generar información bancaria simulada
    const bankData = {
      bank: 'Banco Simulado S.A.',
      accountNumber: '1234-5678-9012-3456',
      accountHolder: 'FOOD DELIVERY CORP',
      reference: `ORD-${orderId || Date.now()}`,
      amount: amount.toFixed(2),
      currency: 'USD'
    };

    setBankInfo(bankData);

    // Si hay URL de confirmación, usar esa en el QR
    // Si no, usar los datos bancarios (comportamiento anterior)
    if (confirmationUrl) {
      setQrData(confirmationUrl);
    } else {
      const qrContent = JSON.stringify({
        bank: bankData.bank,
        account: bankData.accountNumber,
        amount: bankData.amount,
        ref: bankData.reference
      });
      setQrData(qrContent);
    }

    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [amount, orderId, confirmationUrl]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(field);
      setTimeout(() => setCopied(''), 2000);
    });
  };

  const handleConfirmPayment = () => {
    if (countdown === 0) {
      alert('El tiempo para realizar la transferencia ha expirado');
      return;
    }

    console.log('📱 Usuario confirmó transferencia');
    alert('✅ Orden creada. Escanea el código QR para confirmar tu pago automáticamente, o espera la verificación manual.');

    // Llamar a onClose que limpiará el carrito y redirigirá
    if (onClose) {
      onClose();
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Por favor sube una imagen (JPG, PNG) o PDF');
        return;
      }

      // Validar tamaño (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('El archivo no debe superar los 5MB');
        return;
      }

      setUploadedFile(file);
      setShowUpload(true);
      console.log('Comprobante subido:', file.name);
    }
  };

  if (!bankInfo) return <div>Cargando...</div>;

  return (
    <div className="transfer-form">
      <div className="transfer-header">
        <h3>📱 Transferencia Bancaria</h3>
        <div className={`countdown ${countdown < 60 ? 'warning' : ''}`}>
          ⏱️ Tiempo restante: <strong>{formatTime(countdown)}</strong>
        </div>
      </div>

      <div className="transfer-content">
        <div className="qr-section">
          <div className="qr-container">
            <QRCodeSVG
              value={qrData}
              size={220}
              level="H"
              includeMargin={true}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="qr-instruction">
            {confirmationUrl
              ? '📱 Escanea para confirmar tu pago automáticamente'
              : 'Escanea el código QR con tu app bancaria'
            }
          </p>
        </div>

        <div className="bank-info-section">
          <h4>📋 Información para Transferencia Manual</h4>

          <div className="info-row">
            <span className="label">Banco:</span>
            <span className="value">{bankInfo.bank}</span>
          </div>

          <div className="info-row">
            <span className="label">Número de Cuenta:</span>
            <span
              className={`value copyable ${copied === 'account' ? 'copied' : ''}`}
              onClick={() => handleCopy(bankInfo.accountNumber, 'account')}
              title="Clic para copiar"
            >
              {bankInfo.accountNumber} {copied === 'account' ? '✓' : '📋'}
            </span>
          </div>

          <div className="info-row">
            <span className="label">Titular:</span>
            <span className="value">{bankInfo.accountHolder}</span>
          </div>

          <div className="info-row highlight">
            <span className="label">Monto:</span>
            <span className="value amount">${bankInfo.amount} {bankInfo.currency}</span>
          </div>

          <div className="info-row highlight">
            <span className="label">Referencia:</span>
            <span
              className={`value copyable ${copied === 'reference' ? 'copied' : ''}`}
              onClick={() => handleCopy(bankInfo.reference, 'reference')}
              title="Clic para copiar"
            >
              {bankInfo.reference} {copied === 'reference' ? '✓' : '📋'}
            </span>
          </div>

          <div className="important-notice">
            ⚠️ <strong>Importante:</strong> Incluye la referencia en tu transferencia
          </div>
        </div>
      </div>

      <div className="upload-section">
        <h4>📎 Comprobante de Pago (Opcional)</h4>
        <p className="upload-description">
          Sube una captura o foto del comprobante para agilizar la verificación
        </p>
        <label className="file-upload-label">
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          <span className="upload-button">
            📤 {uploadedFile ? 'Cambiar Comprobante' : 'Subir Comprobante'}
          </span>
        </label>
        {showUpload && uploadedFile && (
          <div className="upload-success">
            ✅ <strong>{uploadedFile.name}</strong> cargado correctamente
            <button
              className="remove-file"
              onClick={() => {
                setUploadedFile(null);
                setShowUpload(false);
              }}
            >
              ✕
            </button>
          </div>
        )}
      </div>

      <button
        onClick={handleConfirmPayment}
        className="confirm-button"
        disabled={countdown === 0}
      >
        ✅ Ya Realicé la Transferencia
      </button>

      <div className="transfer-notice">
        <div className="notice-icon">ℹ️</div>
        <div className="notice-content">
          <p>
            <strong>Tu pedido será procesado una vez que verifiquemos el pago.</strong>
          </p>
          <p>
            Normalmente tarda entre 5-10 minutos. Recibirás una notificación por email cuando sea confirmado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TransferForm;
