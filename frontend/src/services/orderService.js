import api from './api';

export const orderService = {
  // Crear orden
  createOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  // Obtener órdenes del usuario
  getUserOrders: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/orders', { params });
    return response.data;
  },

  // Obtener orden por ID
  getOrderById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Cancelar orden
  cancelOrder: async (id) => {
    const response = await api.patch(`/orders/${id}/cancel`);
    return response.data;
  },

  // Confirmar entrega (cliente)
  confirmDelivery: async (id) => {
    const response = await api.patch(`/orders/${id}/confirm-delivery`);
    return response.data;
  },

  // Actualizar estado (admin)
  updateOrderStatus: async (id, status) => {
    const response = await api.patch(`/orders/${id}/status`, { status });
    return response.data;
  },

  // Confirmar pago por QR
  confirmPayment: async (orderId, token) => {
    const response = await api.get(`/orders/confirm-payment/${orderId}/${token}`);
    return response.data;
  }
};