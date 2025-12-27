import api from './api';

const favoriteService = {
  getFavorites: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  addFavorite: async (productId) => {
    const response = await api.post(`/favorites/${productId}`);
    return response.data;
  },

  removeFavorite: async (productId) => {
    const response = await api.delete(`/favorites/${productId}`);
    return response.data;
  },

  isFavorite: async (productId) => {
    const response = await api.get(`/favorites/${productId}/check`);
    return response.data;
  },

  toggleFavorite: async (productId, isFavorite) => {
    if (isFavorite) {
      return await favoriteService.removeFavorite(productId);
    } else {
      return await favoriteService.addFavorite(productId);
    }
  }
};

export default favoriteService;
