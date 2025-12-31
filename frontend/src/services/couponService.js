import api from './api';

const couponService = {
  // ============================================
  // OBTENER TODOS LOS CUPONES ACTIVOS
  // ============================================
  getAllCoupons: async () => {
    const response = await api.get('/coupons');
    return response.data;
  },

  // ============================================
  // OBTENER CUPONES DISPONIBLES PARA EL USUARIO
  // ============================================
  getAvailableCoupons: async () => {
    const response = await api.get('/coupons/available');
    return response.data;
  },

  // ============================================
  // VALIDAR CUPÓN Y CALCULAR DESCUENTO
  // ============================================
  validateCoupon: async (code, subtotal, items) => {
    const response = await api.post('/coupons/validate', {
      code,
      subtotal,
      items
    });
    return response.data;
  },

  // ============================================
  // REGISTRAR USO DE CUPÓN
  // ============================================
  useCoupon: async (couponId, orderId, discountAmount) => {
    const response = await api.post('/coupons/use', {
      couponId,
      orderId,
      discountAmount
    });
    return response.data;
  },

  // ============================================
  // OBTENER HISTORIAL DE CUPONES USADOS
  // ============================================
  getCouponHistory: async () => {
    const response = await api.get('/coupons/history');
    return response.data;
  }
};

export default couponService;
