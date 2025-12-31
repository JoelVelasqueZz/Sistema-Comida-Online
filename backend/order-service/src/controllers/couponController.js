const pool = require('../config/database');

const couponController = {
  /**
   * Obtener todos los cupones activos
   * GET /api/orders/coupons
   */
  getAllCoupons: async (req, res) => {
    try {
      console.log('📋 [Coupons] Obteniendo cupones activos...');

      const result = await pool.query(
        `SELECT id, code, name, description, type, value,
                min_amount, max_discount, day_of_week, is_weekend_only,
                trigger_type, valid_from, valid_until, max_uses_per_user, active
         FROM coupons
         WHERE active = true
         ORDER BY created_at DESC`
      );

      console.log(`✅ [Coupons] ${result.rows.length} cupones encontrados`);

      res.json({
        success: true,
        coupons: result.rows
      });

    } catch (error) {
      console.error('❌ [Coupons] Error:', error);
      res.status(500).json({ error: 'Error al obtener cupones' });
    }
  },

  /**
   * Obtener cupones aplicables para el usuario actual
   * GET /api/orders/coupons/available
   */
  getAvailableCoupons: async (req, res) => {
    try {
      const userId = req.user.userId;
      console.log(`📋 [Coupons] Obteniendo cupones para usuario: ${userId}`);

      // Verificar si es primera compra
      const ordersResult = await pool.query(
        'SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status != $2',
        [userId, 'cancelled']
      );
      const isFirstPurchase = parseInt(ordersResult.rows[0].count) === 0;

      // Obtener día actual (0=Domingo, 6=Sábado)
      const today = new Date().getDay();
      const isWeekend = today === 0 || today === 6;

      // Query mejorado con usos restantes - DEVUELVE TODOS LOS CUPONES
      const query = `
        SELECT
          c.*,
          (SELECT COUNT(*) FROM coupon_usage cu WHERE cu.coupon_id = c.id AND cu.user_id = $1) as times_used,
          (c.max_uses_per_user - (SELECT COUNT(*) FROM coupon_usage cu WHERE cu.coupon_id = c.id AND cu.user_id = $1)) as uses_remaining
        FROM coupons c
        WHERE c.active = true
          AND (c.valid_from IS NULL OR c.valid_from <= NOW())
          AND (c.valid_until IS NULL OR c.valid_until >= NOW())
        ORDER BY c.created_at DESC
      `;

      const result = await pool.query(query, [userId]);

      // Agregar información de disponibilidad
      const couponsWithStatus = result.rows.map(coupon => {
        const timesUsed = parseInt(coupon.times_used) || 0;
        const usesRemaining = parseInt(coupon.uses_remaining) || 0;
        const isExhausted = usesRemaining <= 0;

        // Verificar si está disponible HOY
        let isAvailableToday = true;
        if (coupon.trigger_type === 'first_purchase' && !isFirstPurchase) {
          isAvailableToday = false;
        } else if (coupon.day_of_week !== null && coupon.day_of_week !== today) {
          isAvailableToday = false;
        } else if (coupon.is_weekend_only && !isWeekend) {
          isAvailableToday = false;
        }

        return {
          ...coupon,
          times_used: timesUsed,
          uses_remaining: usesRemaining,
          is_exhausted: isExhausted,
          is_available_today: isAvailableToday && !isExhausted
        };
      });

      console.log(`✅ [Coupons] ${result.rows.length} cupones encontrados para el usuario`);

      res.json({
        success: true,
        coupons: couponsWithStatus,
        isFirstPurchase
      });

    } catch (error) {
      console.error('❌ [Coupons] Error:', error);
      res.status(500).json({ error: 'Error al obtener cupones disponibles' });
    }
  },

  /**
   * Validar y calcular descuento de un cupón
   * POST /api/orders/coupons/validate
   * Body: { code, subtotal, items }
   */
  validateCoupon: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { code, subtotal, items } = req.body;

      console.log(`🔍 [Coupons] Validando cupón: ${code} para usuario: ${userId}`);

      if (!code || !subtotal) {
        return res.status(400).json({ error: 'Código y subtotal son requeridos' });
      }

      // Buscar cupón
      const couponResult = await pool.query(
        `SELECT * FROM coupons WHERE UPPER(code) = UPPER($1) AND active = true`,
        [code]
      );

      if (couponResult.rows.length === 0) {
        console.log('❌ [Coupons] Cupón no encontrado o inactivo');
        return res.status(404).json({ error: 'Cupón no válido' });
      }

      const coupon = couponResult.rows[0];

      // Verificar validez temporal
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return res.status(400).json({ error: 'Cupón aún no es válido' });
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return res.status(400).json({ error: 'Cupón expirado' });
      }

      // Verificar día de la semana
      if (coupon.day_of_week !== null) {
        const today = new Date().getDay();
        if (coupon.day_of_week !== today) {
          return res.status(400).json({
            error: `Este cupón solo es válido los ${getDayName(coupon.day_of_week)}s`
          });
        }
      }

      // Verificar fin de semana
      if (coupon.is_weekend_only) {
        const today = new Date().getDay();
        if (today !== 0 && today !== 6) {
          return res.status(400).json({ error: 'Este cupón solo es válido los fines de semana' });
        }
      }

      // Verificar monto mínimo
      if (coupon.min_amount && subtotal < parseFloat(coupon.min_amount)) {
        return res.status(400).json({
          error: `Monto mínimo de compra: $${coupon.min_amount}`
        });
      }

      // Verificar usos del usuario
      const usageResult = await pool.query(
        'SELECT COUNT(*) as count FROM coupon_usage WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, userId]
      );
      const userUsageCount = parseInt(usageResult.rows[0].count);

      if (userUsageCount >= coupon.max_uses_per_user) {
        return res.status(400).json({ error: 'Ya has usado este cupón el máximo de veces permitido' });
      }

      // Verificar si es primera compra
      if (coupon.trigger_type === 'first_purchase') {
        const ordersResult = await pool.query(
          'SELECT COUNT(*) as count FROM orders WHERE user_id = $1 AND status != $2',
          [userId, 'cancelled']
        );
        if (parseInt(ordersResult.rows[0].count) > 0) {
          return res.status(400).json({ error: 'Este cupón es solo para la primera compra' });
        }
      }

      // Calcular descuento
      let discountAmount = 0;
      if (coupon.type === 'percentage') {
        discountAmount = (subtotal * parseFloat(coupon.value)) / 100;
        if (coupon.max_discount) {
          discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount));
        }
      } else if (coupon.type === 'fixed') {
        discountAmount = parseFloat(coupon.value);
      }

      discountAmount = Math.round(discountAmount * 100) / 100;

      console.log(`✅ [Coupons] Cupón válido. Descuento: $${discountAmount}`);

      res.json({
        success: true,
        valid: true,
        coupon: {
          id: coupon.id,
          code: coupon.code,
          name: coupon.name,
          type: coupon.type,
          value: coupon.value
        },
        discountAmount,
        newTotal: subtotal - discountAmount
      });

    } catch (error) {
      console.error('❌ [Coupons] Error validando cupón:', error);
      res.status(500).json({ error: 'Error al validar cupón' });
    }
  },

  /**
   * Registrar uso de cupón (llamado al crear orden)
   * POST /api/orders/coupons/use
   * Body: { couponId, orderId, discountAmount }
   */
  useCoupon: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { couponId, orderId, discountAmount } = req.body;

      console.log(`💾 [Coupons] Registrando uso de cupón: ${couponId}`);

      await pool.query(
        `INSERT INTO coupon_usage (coupon_id, user_id, order_id, discount_amount)
         VALUES ($1, $2, $3, $4)`,
        [couponId, userId, orderId, discountAmount]
      );

      // Incrementar contador de usos
      await pool.query(
        'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = $1',
        [couponId]
      );

      console.log('✅ [Coupons] Uso registrado exitosamente');

      res.json({ success: true });

    } catch (error) {
      console.error('❌ [Coupons] Error registrando uso:', error);
      res.status(500).json({ error: 'Error al registrar uso de cupón' });
    }
  },

  /**
   * Obtener historial de cupones usados por el usuario
   * GET /api/orders/coupons/history
   */
  getCouponHistory: async (req, res) => {
    try {
      const userId = req.user.userId;

      console.log(`📜 [Coupons] Obteniendo historial para usuario: ${userId}`);

      const result = await pool.query(
        `SELECT cu.*, c.code, c.name, c.type, c.value, o.total as order_total
         FROM coupon_usage cu
         JOIN coupons c ON cu.coupon_id = c.id
         LEFT JOIN orders o ON cu.order_id = o.id
         WHERE cu.user_id = $1
         ORDER BY cu.used_at DESC`,
        [userId]
      );

      console.log(`✅ [Coupons] ${result.rows.length} cupones usados`);

      res.json({
        success: true,
        history: result.rows
      });

    } catch (error) {
      console.error('❌ [Coupons] Error:', error);
      res.status(500).json({ error: 'Error al obtener historial' });
    }
  }
};

// Helper function
function getDayName(day) {
  const days = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return days[day];
}

module.exports = couponController;
