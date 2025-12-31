import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import couponService from '../services/couponService';
import { useAuth } from '../context/AuthContext';
import './WelcomeCouponModal.css';

function WelcomeCouponModal({ isOpen, onClose }) {
  const [firstPurchaseCoupon, setFirstPurchaseCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen && user) {
      loadFirstPurchaseCoupon();
    }
  }, [isOpen, user]);

  const loadFirstPurchaseCoupon = async () => {
    try {
      const data = await couponService.getAvailableCoupons();
      // Buscar cupón de primera compra
      const firstPurchase = data.coupons?.find(
        (c) => c.trigger_type === 'first_purchase'
      );
      setFirstPurchaseCoupon(firstPurchase);
    } catch (err) {
      console.error('❌ Error al cargar cupón de bienvenida:', err);
    }
  };

  const handleCopyCode = () => {
    if (firstPurchaseCoupon) {
      navigator.clipboard.writeText(firstPurchaseCoupon.code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const handleClose = () => {
    // Marcar que el usuario ya vio el modal
    if (user) {
      localStorage.setItem(`welcome_coupon_seen_${user.userId}`, 'true');
    }
    onClose();
  };

  if (!isOpen || !firstPurchaseCoupon) {
    return null;
  }

  const formatDiscount = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`;
    } else if (coupon.type === 'fixed') {
      return `$${coupon.value} OFF`;
    }
    return '';
  };

  return (
    <div className="welcome-modal-overlay animate-fade-in" onClick={handleClose}>
      <div
        className="welcome-modal-content animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button className="welcome-modal-close" onClick={handleClose}>
          ×
        </button>

        {/* Header */}
        <div className="welcome-modal-header">
          <div className="welcome-icon">🎉</div>
          <h2 className="welcome-title heading-2">
            ¡Bienvenido a Food Delivery!
          </h2>
          <p className="welcome-subtitle text-muted">
            Para celebrar tu registro, tenemos un regalo especial para ti
          </p>
        </div>

        {/* Coupon Display */}
        <div className="welcome-coupon-card">
          <div className="welcome-coupon-badge">
            {formatDiscount(firstPurchaseCoupon)}
          </div>

          <h3 className="welcome-coupon-name heading-3">
            {firstPurchaseCoupon.name}
          </h3>

          <p className="welcome-coupon-description text-muted">
            {firstPurchaseCoupon.description}
          </p>

          {/* Code Display */}
          <div className="welcome-code-display">
            <div className="welcome-code-box">
              <code className="welcome-code">{firstPurchaseCoupon.code}</code>
            </div>
            <button
              className="btn btn-outline btn-sm"
              onClick={handleCopyCode}
            >
              {copiedCode ? '✓ Copiado!' : '📋 Copiar código'}
            </button>
          </div>

          {/* Conditions */}
          {firstPurchaseCoupon.min_amount && (
            <div className="welcome-conditions">
              <p className="welcome-condition-item">
                💰 Compra mínima: ${firstPurchaseCoupon.min_amount}
              </p>
            </div>
          )}
          {firstPurchaseCoupon.max_discount && firstPurchaseCoupon.type === 'percentage' && (
            <div className="welcome-conditions">
              <p className="welcome-condition-item">
                🎯 Descuento máximo: ${firstPurchaseCoupon.max_discount}
              </p>
            </div>
          )}
          {firstPurchaseCoupon.valid_until && (
            <div className="welcome-expiry">
              <p className="welcome-expiry-text">
                ⏰ Válido hasta: {new Date(firstPurchaseCoupon.valid_until).toLocaleDateString('es-ES')}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="welcome-modal-actions">
          <Link to="/menu" onClick={handleClose}>
            <button className="btn btn-primary btn-lg btn-block hover-lift">
              Explorar Menú 🍽️
            </button>
          </Link>
          <Link to="/promociones" onClick={handleClose}>
            <button className="btn btn-outline btn-lg btn-block hover-grow">
              Ver Todas las Promociones
            </button>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="welcome-modal-footer">
          <p className="welcome-footer-note text-muted text-sm">
            💡 Tip: Copia el código y úsalo al momento de pagar
          </p>
        </div>
      </div>
    </div>
  );
}

export default WelcomeCouponModal;
