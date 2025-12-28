import api from './api';

const cardService = {
  // ============================================
  // OBTENER TODAS LAS TARJETAS DEL USUARIO
  // ============================================
  getCards: async () => {
    const response = await api.get('/cards');
    return response.data;
  },

  // ============================================
  // GUARDAR NUEVA TARJETA
  // ============================================
  saveCard: async (cardData) => {
    const response = await api.post('/cards', cardData);
    return response.data;
  },

  // ============================================
  // MARCAR TARJETA COMO PREDETERMINADA
  // ============================================
  setDefault: async (cardId) => {
    const response = await api.patch(`/cards/${cardId}/default`);
    return response.data;
  },

  // ============================================
  // ELIMINAR TARJETA
  // ============================================
  deleteCard: async (cardId) => {
    const response = await api.delete(`/cards/${cardId}`);
    return response.data;
  }
};

export default cardService;
