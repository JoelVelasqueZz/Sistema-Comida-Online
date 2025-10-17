import api from './api';

export const paymentService = {
  // Procesar pago
  processPayment: async (paymentData) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  // Obtener pago por orden
  getPaymentByOrderId: async (orderId) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },

  // Obtener historial de pagos
  getUserPayments: async () => {
    const response = await api.get('/payments/user');
    return response.data;
  }
};