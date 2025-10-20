import api from './api';

export const userService = {
  // ============================================
  // ESTADÍSTICAS GENERALES
  // ============================================
  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  // ============================================
  // OBTENER TODOS LOS USUARIOS
  // ============================================
  getAllUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // ============================================
  // OBTENER USUARIO POR ID
  // ============================================
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // ============================================
  // OBTENER ESTADÍSTICAS DE PEDIDOS DE UN USUARIO
  // ============================================
  getUserOrderStats: async (id) => {
    const response = await api.get(`/users/${id}/stats`);
    return response.data;
  },

  // ============================================
  // CAMBIAR ROL DE USUARIO
  // ============================================
  changeUserRole: async (id, data) => {
    const response = await api.patch(`/users/${id}/role`, data);
    return response.data;
  },

  // ============================================
  // ACTIVAR/DESACTIVAR USUARIO
  // ============================================
  toggleUserStatus: async (id, data) => {
    const response = await api.patch(`/users/${id}/status`, data);
    return response.data;
  },

  // ============================================
  // ELIMINAR USUARIO
  // ============================================
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};
