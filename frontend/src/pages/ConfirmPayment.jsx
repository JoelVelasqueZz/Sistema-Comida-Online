import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import './ConfirmPayment.css';

function ConfirmPayment() {
  const { orderId, token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing'); // processing, success, error
  const [message, setMessage] = useState('');
  const [orderTotal, setOrderTotal] = useState(null);

  useEffect(() => {
    confirmPayment();
  }, []);

  const confirmPayment = async () => {
    try {
      console.log('💳 Confirmando pago...', { orderId, token });

      const response = await orderService.confirmPayment(orderId, token);

      if (response.success) {
        setStatus('success');
        setOrderTotal(response.total);
        setMessage(response.alreadyPaid
          ? '✅ Este pedido ya fue pagado anteriormente'
          : '✅ ¡Pago confirmado exitosamente!'
        );

        // Redirigir después de 3 segundos
        setTimeout(() => {
          navigate('/orders');
        }, 3000);
      }
    } catch (error) {
      console.error('Error al confirmar pago:', error);
      setStatus('error');
      setMessage(error.response?.data?.error || '❌ Error al confirmar el pago. Por favor contacta con soporte.');
    }
  };

  return (
    <div className="confirm-payment-page">
      <div className="confirm-payment-container">
        <div className="confirm-payment-card card card-elevated animate-scale-in">
          {status === 'processing' && (
            <div className="confirm-content">
              <div className="spinner-container">
                <div className="loading-spinner large"></div>
              </div>
              <h2 className="heading-3">Procesando pago...</h2>
              <p className="text-lg text-muted">Por favor espera un momento</p>
            </div>
          )}

          {status === 'success' && (
            <div className="confirm-content">
              <div className="success-icon animate-bounce">
                <span className="icon-large">🎉</span>
              </div>
              <h2 className="heading-2 text-success">¡Pago Confirmado!</h2>
              <p className="text-lg mb-4">{message}</p>
              {orderTotal && (
                <div className="total-badge">
                  <span className="text-muted">Total pagado:</span>
                  <span className="total-amount text-gradient">${orderTotal.toFixed(2)}</span>
                </div>
              )}
              <p className="redirect-text text-sm text-muted mt-4">
                Redirigiendo a tus pedidos en 3 segundos...
              </p>
              <button
                onClick={() => navigate('/orders')}
                className="btn btn-primary btn-lg mt-4 hover-lift"
              >
                Ver Mis Pedidos →
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="confirm-content">
              <div className="error-icon animate-shake">
                <span className="icon-large">❌</span>
              </div>
              <h2 className="heading-3 text-error">Error al Confirmar</h2>
              <p className="text-lg mb-4">{message}</p>
              <div className="error-actions">
                <button
                  onClick={() => navigate('/orders')}
                  className="btn btn-primary hover-lift"
                >
                  Ir a Mis Pedidos
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="btn btn-ghost"
                >
                  Volver al Inicio
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmPayment;
