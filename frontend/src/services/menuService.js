import api from './api';

export const menuService = {
  // Obtener categorías
  getCategories: async () => {
    const response = await api.get('/menu/categories');
    return response.data;
  },

  // Obtener productos
  getProducts: async (params = {}) => {
    const response = await api.get('/menu/products', { params });
    return response.data;
  },

  // Obtener producto por ID
  getProductById: async (id) => {
    const response = await api.get(`/menu/products/${id}`);
    return response.data;
  },

  // Buscar productos
  searchProducts: async (query) => {
    const response = await api.get('/menu/products/search', {
      params: { q: query }
    });
    return response.data;
  },

  // Obtener productos por categoría
  getProductsByCategory: async (categoryId) => {
    const response = await api.get(`/menu/categories/${categoryId}/products`);
    return response.data;
  }
};