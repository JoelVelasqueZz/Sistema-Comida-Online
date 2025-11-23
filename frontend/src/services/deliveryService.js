import api from './api';

const deliveryService = {
  // Obtener pedidos disponibles para recoger
  getAvailableOrders: async () => {
    const response = await api.get('/delivery/available-orders');
    return response.data;
  },

  // Aceptar un pedido
  acceptOrder: async (orderId) => {
    const response = await api.post(`/delivery/accept-order/${orderId}`);
    return response.data;
  },

  // Marcar como en camino
  markAsDelivering: async (orderId) => {
    const response = await api.patch(`/delivery/mark-delivering/${orderId}`);
    return response.data;
  },

  // Confirmar entrega
  confirmDelivery: async (orderId) => {
    const response = await api.patch(`/delivery/confirm-delivery/${orderId}`);
    return response.data;
  },

  // Obtener mis entregas activas
  getMyDeliveries: async () => {
    const response = await api.get('/delivery/my-deliveries');
    return response.data;
  },

  // Obtener historial
  getHistory: async (startDate, endDate) => {
    const response = await api.get('/delivery/history', {
      params: { startDate, endDate }
    });
    return response.data;
  }
};

export default deliveryService;
