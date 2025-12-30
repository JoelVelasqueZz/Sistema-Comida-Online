import api from './api';
import emailjs from '@emailjs/browser';

const twoFactorService = {
  /**
   * Genera un código 2FA para el usuario
   * @param {string} userId - ID del usuario
   * @param {string} email - Email del usuario
   * @returns {Promise} Respuesta con el código generado
   */
  generateCode: async (userId, email) => {
    try {
      console.log('📧 [2FA Service] Generando código para:', { userId, email });
      const response = await api.post('/auth/2fa/generate', {
        user_id: userId,
        email
      });
      console.log('✅ [2FA Service] Código generado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ [2FA Service] Error generando código:', error);
      throw error;
    }
  },

  /**
   * Verifica un código 2FA
   * @param {string} userId - ID del usuario
   * @param {string} code - Código a verificar
   * @returns {Promise} Respuesta con tokens si es válido
   */
  verifyCode: async (userId, code) => {
    try {
      console.log('🔍 [2FA Service] Verificando código para userId:', userId);
      const response = await api.post('/auth/2fa/verify', {
        user_id: userId,
        code
      });
      console.log('✅ [2FA Service] Código verificado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ [2FA Service] Error verificando código:', error);
      throw error;
    }
  },

  /**
   * Obtiene el estado de 2FA del usuario
   * @returns {Promise} Estado de 2FA
   */
  getStatus: async () => {
    try {
      console.log('📡 [2FA Service] Obteniendo estado de 2FA...');
      const response = await api.get('/auth/2fa/status');
      console.log('📡 [2FA Service] Respuesta completa:', response.data);
      console.log('📡 [2FA Service] Enabled:', response.data.enabled);
      console.log('📡 [2FA Service] Method:', response.data.method);
      return response.data;
    } catch (error) {
      console.error('❌ [2FA Service] Error obteniendo estado:', error);
      console.error('❌ [2FA Service] Error detalle:', error.response?.data);
      throw error;
    }
  },

  /**
   * Activa o desactiva 2FA para el usuario
   * @param {boolean} enabled - true para activar, false para desactivar
   * @returns {Promise} Respuesta con el nuevo estado
   */
  toggle: async (enabled) => {
    try {
      console.log('🔄 [2FA Service] Cambiando estado 2FA a:', enabled);
      const response = await api.post('/auth/2fa/toggle', {
        enabled,
        method: 'email'
      });
      console.log('✅ [2FA Service] Estado cambiado exitosamente');
      return response.data;
    } catch (error) {
      console.error('❌ [2FA Service] Error cambiando estado:', error);
      throw error;
    }
  },

  /**
   * Envía el código 2FA por email usando EmailJS
   * @param {string} email - Email del destinatario
   * @param {string} code - Código de verificación
   * @param {string} userName - Nombre del usuario (opcional)
   * @returns {Promise} Resultado del envío
   */
  sendCodeByEmail: async (email, code, userName = 'Usuario') => {
    try {
      console.log('📧 [2FA Service] Enviando código por email a:', email);

      // Inicializar EmailJS si no está inicializado
      emailjs.init('NVpawW2V7U5qmoWQH');

      const templateParams = {
        customer_name: userName,
        customer_email: email,
        order_id: code,
        expires_in: '10 minutos'
      };

      console.log('📨 [2FA Service] Parámetros del template:', templateParams);

      const result = await emailjs.send(
      'service_nkiq6fm',      
      'template_g43uzzj',     
      templateParams,
      'NVpawW2V7U5qmoWQH'   
    );

      console.log('✅ [2FA Service] Email enviado exitosamente:', result);
      return result;
    } catch (error) {
      console.error('❌ [2FA Service] Error enviando email:', error);
      throw error;
    }
  }
};

export default twoFactorService;
