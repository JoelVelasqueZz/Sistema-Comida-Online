import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import couponService from '../services/couponService';
import './Promociones.css';

function Promociones() {
  const navigate = useNavigate();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  const loadCoupons = async () => {
    try {
      setLoading(true);
      const data = await couponService.getAvailableCoupons();

      // Ya viene categorizado del backend con is_available_today y is_exhausted
      const categorized = (data.coupons || []).map(coupon => ({
        ...coupon,
        nextAvailableText: getNextAvailableText(coupon, new Date().getDay())
      }));

      // Ordenar: disponibles hoy primero, luego no agotados, luego agotados
      categorized.sort((a, b) => {
        if (a.is_exhausted && !b.is_exhausted) return 1;
        if (!a.is_exhausted && b.is_exhausted) return -1;
        if (a.is_available_today && !b.is_available_today) return -1;
        if (!a.is_available_today && b.is_available_today) return 1;
        return 0;
      });

      setCoupons(categorized);
    } catch (error) {
      console.error('❌ Error al cargar cupones:', error);
    } finally {
      setLoading(false);
    }
  };

  const isAvailableToday = (coupon, today, isWeekend) => {
    // Cupones sin restricción de día
    if (!coupon.day_of_week && !coupon.is_weekend_only && !coupon.trigger_type) {
      return true;
    }

    // Cupones de primera compra (depende del usuario, asumimos disponible)
    if (coupon.trigger_type === 'first_purchase') {
      return true;
    }

    // Cupones manuales sin restricción de día
    if (coupon.trigger_type === 'manual' && !coupon.day_of_week && !coupon.is_weekend_only) {
      return true;
    }

    // Cupones de día específico
    if (coupon.day_of_week !== null) {
      return coupon.day_of_week === today;
    }

    // Cupones de fin de semana
    if (coupon.is_weekend_only) {
      return isWeekend;
    }

    return true;
  };

  const getNextAvailableText = (coupon, today, isWeekend) => {
    // Si está disponible hoy, no mostrar texto
    if (isAvailableToday(coupon, today, isWeekend)) {
      return null;
    }

    // Cupones de día específico
    if (coupon.day_of_week !== null) {
      const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      let daysUntil = coupon.day_of_week - today;
      if (daysUntil <= 0) daysUntil += 7;

      return `Próximo ${days[coupon.day_of_week]}: en ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}`;
    }

    // Cupones de fin de semana
    if (coupon.is_weekend_only) {
      let daysUntil = 6 - today; // Días hasta sábado
      if (daysUntil <= 0) daysUntil += 7;
      return `Próximo fin de semana: en ${daysUntil} ${daysUntil === 1 ? 'día' : 'días'}`;
    }

    return null;
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountText = (coupon) => {
    if (coupon.type === 'percentage') {
      return `${coupon.value}% OFF`;
    } else if (coupon.type === 'fixed') {
      return `$${coupon.value} OFF`;
    } else if (coupon.type === 'free_shipping') {
      return 'Envío Gratis';
    }
  };

  const getValidityText = (coupon) => {
    if (coupon.day_of_week !== null) {
      const days = ['Domingos', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábados'];
      return `Válido solo los ${days[coupon.day_of_week]}`;
    }
    if (coupon.is_weekend_only) {
      return 'Válido solo fines de semana';
    }
    if (coupon.trigger_type === 'first_purchase') {
      return 'Solo primera compra';
    }
    return 'Válido todos los días';
  };

  if (loading) {
    return (
      <div className="promociones-page">
        <div className="loading">Cargando promociones...</div>
      </div>
    );
  }

  const availableNow = coupons.filter(c => c.is_available_today && !c.is_exhausted);
  const comingSoon = coupons.filter(c => !c.is_available_today && !c.is_exhausted);
  const exhausted = coupons.filter(c => c.is_exhausted);

  return (
    <div className="promociones-page">
      <div className="promociones-container">
        <div className="promociones-header">
          <h1>🎟️ Promociones</h1>
          <p>Aprovecha nuestras ofertas exclusivas</p>
        </div>

        {coupons.length === 0 ? (
          <div className="no-coupons">
            <p>No hay promociones disponibles en este momento</p>
          </div>
        ) : (
          <>
            {/* SECCIÓN 1: Disponibles AHORA */}
            {availableNow.length > 0 && (
              <div className="coupons-section">
                <h2 className="section-title">
                  <span className="available-badge">✅ Disponibles Ahora</span>
                </h2>
                <div className="coupons-grid">
                  {availableNow.map((coupon) => (
                    <div key={coupon.id} className="coupon-card available">
                      <div className="coupon-badge available-badge-card">
                        {getDiscountText(coupon)}
                      </div>

                      {/* Badge de usos restantes */}
                      {coupon.uses_remaining > 0 && coupon.uses_remaining < 10 && (
                        <div className="uses-badge">
                          {coupon.uses_remaining} {coupon.uses_remaining === 1 ? 'uso restante' : 'usos restantes'}
                        </div>
                      )}

                      <h3>{coupon.name}</h3>
                      <p className="coupon-description">{coupon.description}</p>

                      <div className="coupon-code-section">
                        <div className="code-label">Código:</div>
                        <div className="code-box">
                          <span className="code">{coupon.code}</span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className={`copy-btn ${copiedCode === coupon.code ? 'copied' : ''}`}
                          >
                            {copiedCode === coupon.code ? '✓ Copiado' : '📋 Copiar'}
                          </button>
                        </div>
                      </div>

                      <div className="coupon-details">
                        <div className="detail-item available-today">
                          ✅ {getValidityText(coupon)} - ¡Úsalo ahora!
                        </div>
                        {coupon.min_amount && (
                          <div className="detail-item">
                            💰 Compra mínima: ${coupon.min_amount}
                          </div>
                        )}
                        {coupon.times_used > 0 && (
                          <div className="detail-item">
                            📊 Ya lo usaste {coupon.times_used} {coupon.times_used === 1 ? 'vez' : 'veces'}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => navigate('/menu')}
                        className="btn-use-coupon"
                      >
                        Usar Ahora →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 2: Próximamente */}
            {comingSoon.length > 0 && (
              <div className="coupons-section">
                <h2 className="section-title">
                  <span className="upcoming-badge">📅 Próximamente</span>
                </h2>
                <div className="coupons-grid">
                  {comingSoon.map((coupon) => (
                    <div key={coupon.id} className="coupon-card upcoming">
                      <div className="coupon-badge upcoming-badge-card">
                        {getDiscountText(coupon)}
                      </div>

                      {/* Badge de usos restantes */}
                      {coupon.uses_remaining > 0 && coupon.uses_remaining < 10 && (
                        <div className="uses-badge-gray">
                          {coupon.uses_remaining} {coupon.uses_remaining === 1 ? 'uso restante' : 'usos restantes'}
                        </div>
                      )}

                      <h3>{coupon.name}</h3>
                      <p className="coupon-description">{coupon.description}</p>

                      <div className="coupon-code-section">
                        <div className="code-label">Código:</div>
                        <div className="code-box disabled">
                          <span className="code">{coupon.code}</span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className={`copy-btn ${copiedCode === coupon.code ? 'copied' : ''}`}
                          >
                            {copiedCode === coupon.code ? '✓ Copiado' : '📋 Copiar'}
                          </button>
                        </div>
                      </div>

                      <div className="coupon-details">
                        <div className="detail-item">
                          📅 {getValidityText(coupon)}
                        </div>
                        {coupon.nextAvailableText && (
                          <div className="detail-item next-available">
                            ⏰ {coupon.nextAvailableText}
                          </div>
                        )}
                        {coupon.times_used > 0 && (
                          <div className="detail-item">
                            📊 Ya lo usaste {coupon.times_used} {coupon.times_used === 1 ? 'vez' : 'veces'}
                          </div>
                        )}
                      </div>

                      <div className="upcoming-notice">
                        No disponible hoy - {coupon.nextAvailableText}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECCIÓN 3: Ya Usados (Agotados) */}
            {exhausted.length > 0 && (
              <div className="coupons-section">
                <h2 className="section-title">
                  <span className="exhausted-badge">🚫 Ya Usados</span>
                </h2>
                <div className="coupons-grid">
                  {exhausted.map((coupon) => (
                    <div key={coupon.id} className="coupon-card exhausted">
                      <div className="coupon-badge exhausted-badge-card">
                        {getDiscountText(coupon)}
                      </div>

                      <div className="exhausted-overlay">
                        <span className="exhausted-text">AGOTADO</span>
                      </div>

                      <h3>{coupon.name}</h3>
                      <p className="coupon-description">{coupon.description}</p>

                      <div className="coupon-code-section">
                        <div className="code-label">Código:</div>
                        <div className="code-box disabled">
                          <span className="code">{coupon.code}</span>
                        </div>
                      </div>

                      <div className="coupon-details">
                        <div className="detail-item exhausted-info">
                          🚫 Ya usaste este cupón {coupon.times_used}/{coupon.max_uses_per_user} veces
                        </div>
                        <div className="detail-item exhausted-info">
                          ⏰ No podrás usarlo de nuevo
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Promociones;
