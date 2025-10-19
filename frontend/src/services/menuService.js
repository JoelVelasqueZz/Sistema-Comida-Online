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
  },

  // ============================================
  // CATEGORÍAS - ADMIN
  // ============================================
  getAllCategoriesAdmin: async () => {
    const response = await api.get('/menu/admin/categories');
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await api.post('/menu/admin/categories', categoryData);
    return response.data;
  },

  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/menu/admin/categories/${id}`, categoryData);
    return response.data;
  },

  deleteCategory: async (id) => {
    const response = await api.delete(`/menu/admin/categories/${id}`);
    return response.data;
  },

  // ============================================
  // PRODUCTOS - ADMIN
  // ============================================
  getAllProductsAdmin: async (filters = {}) => {
    const response = await api.get('/menu/admin/products', { params: filters });
    return response.data;
  },

  createProduct: async (productData) => {
    const response = await api.post('/menu/admin/products', productData);
    return response.data;
  },

  updateProduct: async (id, productData) => {
    const response = await api.put(`/menu/admin/products/${id}`, productData);
    return response.data;
  },

  deleteProduct: async (id) => {
    const response = await api.delete(`/menu/admin/products/${id}`);
    return response.data;
  },

  toggleProductAvailability: async (id) => {
    const response = await api.patch(`/menu/admin/products/${id}/availability`);
    return response.data;
  },

  // ============================================
  // EXTRAS - ADMIN
  // ============================================
  getProductExtras: async (productId) => {
    const response = await api.get(`/menu/admin/products/${productId}/extras`);
    return response.data;
  },

  createExtra: async (productId, extraData) => {
    const response = await api.post(`/menu/admin/products/${productId}/extras`, extraData);
    return response.data;
  },

  updateExtra: async (id, extraData) => {
    const response = await api.put(`/menu/admin/extras/${id}`, extraData);
    return response.data;
  },

  deleteExtra: async (id) => {
    const response = await api.delete(`/menu/admin/extras/${id}`);
    return response.data;
  }
};