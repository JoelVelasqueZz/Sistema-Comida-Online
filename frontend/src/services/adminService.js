import api from './api';

export const adminService = {
  // Obtener estadísticas del dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  // Obtener todos los pedidos (con filtros)
  getAllOrders: async (filters = {}) => {
    const response = await api.get('/admin/orders', { params: filters });
    return response.data;
  },

  // Actualizar estado de un pedido (admin)
  updateOrderStatus: async (orderId, status, notes = '') => {
    const response = await api.patch(`/admin/orders/${orderId}/status`, {
      status,
      notes
    });
    return response.data;
  }
};
