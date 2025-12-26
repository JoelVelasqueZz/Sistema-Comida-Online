import api from './api';

export const authService = {
  // Registro
  register: async (userData) => {
    try {
      console.log('📤 Enviando registro para:', userData.email);

      const response = await api.post('/auth/register', userData);

      console.log('📦 Respuesta registro:', response.data);

      if (response.data.token || response.data.accessToken) {
        const token = response.data.token || response.data.accessToken;

        console.log('💾 Guardando tokens en localStorage');

        // Guardar tanto 'token' como 'accessToken' para compatibilidad
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Token guardado:', localStorage.getItem('token') ? 'SÍ' : 'NO');
      } else {
        console.error('❌ No se recibió token en la respuesta');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error en registro:', error);
      throw error;
    }
  },

  // Login
  login: async (credentials) => {
    try {
      console.log('📤 Enviando login para:', credentials.email);

      const response = await api.post('/auth/login', credentials);

      console.log('📦 Respuesta login:', response.data);

      if (response.data.token || response.data.accessToken) {
        const token = response.data.token || response.data.accessToken;

        console.log('💾 Guardando tokens en localStorage');

        // Guardar tanto 'token' como 'accessToken' para compatibilidad
        localStorage.setItem('token', token);
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        console.log('✅ Token guardado:', localStorage.getItem('token') ? 'SÍ' : 'NO');
        console.log('✅ AccessToken guardado:', localStorage.getItem('accessToken') ? 'SÍ' : 'NO');
        console.log('✅ User guardado:', localStorage.getItem('user') ? 'SÍ' : 'NO');
      } else {
        console.error('❌ No se recibió token en la respuesta');
      }

      return response.data;
    } catch (error) {
      console.error('❌ Error en login:', error);
      throw error;
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log('👋 [Auth] Cerrando sesión...');

      // Intentar notificar al backend (opcional)
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          await api.post('/auth/logout', { refreshToken });
        } catch (error) {
          console.error('Error al hacer logout en backend:', error);
        }
      }
    } catch (error) {
      console.error('Error al hacer logout:', error);
    } finally {
      // CRÍTICO: Limpiar TODOS los tokens
      console.log('🧹 [Auth] Limpiando localStorage...');
      localStorage.removeItem('token');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      console.log('✅ [Auth] Sesión cerrada completamente');
    }
  },

  // Refresh Access Token
  refreshAccessToken: async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        throw new Error('No hay refresh token disponible');
      }

      console.log('🔄 [Auth] Refrescando access token...');

      const response = await api.post('/auth/refresh-token', { refreshToken });

      if (response.data.accessToken) {
        // CRÍTICO: Guardar en AMBOS lugares para compatibilidad
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('token', response.data.accessToken);

        console.log('✅ [Auth] Access token refrescado y guardado');

        // Actualizar usuario por si cambió algo
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }

        return response.data.accessToken;
      }

      throw new Error('No se recibió nuevo access token');
    } catch (error) {
      console.error('❌ [Auth] Error al refrescar token:', error);
      throw error;
    }
  },

  // Obtener perfil
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Actualizar perfil
  updateProfile: async (userData) => {
    const response = await api.patch('/auth/profile', userData);
    return response.data;
  },

  // Obtener usuario actual
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Obtener access token
  getAccessToken: () => {
    return localStorage.getItem('accessToken') || localStorage.getItem('token');
  },

  // Obtener token (alias)
  getToken: () => {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  },

  // Obtener refresh token
  getRefreshToken: () => {
    return localStorage.getItem('refreshToken');
  },

  // Verificar si está autenticado
  isAuthenticated: () => {
    return !!(localStorage.getItem('token') || localStorage.getItem('accessToken'));
  }
};