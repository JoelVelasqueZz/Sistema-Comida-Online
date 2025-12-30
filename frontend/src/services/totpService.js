import api from './api';

const totpService = {
  /**
   * Inicia la configuración de TOTP (genera SECRET y QR)
   */
  setupTotp: async () => {
    const response = await api.post('/auth/totp/setup');
    return response.data;
  },

  /**
   * Activa TOTP después de verificar el código
   */
  enableTotp: async (code, secret) => {
    const response = await api.post('/auth/totp/enable', {
      code,
      secret
    });
    return response.data;
  },

  /**
   * Verifica un código TOTP durante el login
   */
  verifyTotp: async (userId, code) => {
    const response = await api.post('/auth/totp/verify', {
      user_id: userId,
      code
    });
    return response.data;
  },

  /**
   * Desactiva TOTP
   */
  disableTotp: async () => {
    const response = await api.post('/auth/totp/disable');
    return response.data;
  }
};

export default totpService;
