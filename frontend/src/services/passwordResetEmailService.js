import emailjs from '@emailjs/browser';

const passwordResetEmailService = {
  /**
   * Enviar email de recuperación de contraseña
   */
  sendPasswordResetEmail: async (email, token, name) => {
    console.log('📧 [Password Reset Email] Enviando email de recuperación...');

    try {
      const templateParams = {
        user_name: name,
        user_email: email,
        reset_token: token
      };

      const response = await emailjs.send(
        'service_qv9d88e',
        'template_l6rqaae',
        templateParams,
        'A7_9fq0R5JbnCvgtv'
      );

      console.log('✅ [Password Reset Email] Email enviado exitosamente');
      return response;

    } catch (error) {
      console.error('❌ [Password Reset Email] Error:', error);
      throw error;
    }
  }
};

export default passwordResetEmailService;
