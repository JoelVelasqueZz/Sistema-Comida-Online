import api from './api';

const passwordResetService = {
  /**
   * Solicitar recuperación de contraseña
   */
  requestReset: async (email) => {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data;
  },

  /**
   * Verificar token de recuperación
   */
  verifyToken: async (token) => {
    const response = await api.get(`/auth/password-reset/verify/${token}`);
    return response.data;
  },

  /**
   * Restablecer contraseña
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/password-reset/reset', {
      token,
      newPassword
    });
    return response.data;
  }
};

export default passwordResetService;
