import api from './api';

const addressService = {
  // ============================================
  // OBTENER TODAS LAS DIRECCIONES DEL USUARIO
  // ============================================
  getAddresses: async () => {
    const response = await api.get('/addresses');
    return response.data;
  },

  // ============================================
  // CREAR NUEVA DIRECCIÓN
  // ============================================
  createAddress: async (addressData) => {
    const response = await api.post('/addresses', addressData);
    return response.data;
  },

  // ============================================
  // ACTUALIZAR DIRECCIÓN
  // ============================================
  updateAddress: async (id, addressData) => {
    const response = await api.patch(`/addresses/${id}`, addressData);
    return response.data;
  },

  // ============================================
  // MARCAR DIRECCIÓN COMO PREDETERMINADA
  // ============================================
  setDefault: async (id) => {
    const response = await api.patch(`/addresses/${id}/default`);
    return response.data;
  },

  // ============================================
  // ELIMINAR DIRECCIÓN
  // ============================================
  deleteAddress: async (id) => {
    const response = await api.delete(`/addresses/${id}`);
    return response.data;
  }
};

export default addressService;
