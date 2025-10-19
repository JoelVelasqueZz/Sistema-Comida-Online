import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Crear instancia de axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Variable para controlar si se está refrescando el token
let isRefreshing = false;
// Cola de peticiones pendientes mientras se refresca el token
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Interceptor para agregar access token en cada request
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    // Debug: Log params para detectar duplicaciones
    if (config.params) {
      console.log('[API] Request params:', config.params);
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores y auto-refresh de tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Si el error es 401 y no es la ruta de refresh-token
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Si ya estamos intentando refrescar el token
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // Usar axios directo para evitar interceptores duplicados
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No hay refresh token, redirigir a login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Intentar refrescar el token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken } = response.data;

        // Guardar nuevo access token
        localStorage.setItem('accessToken', accessToken);

        // Actualizar header de la petición original
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        // Procesar la cola de peticiones pendientes
        processQueue(null, accessToken);

        // IMPORTANTE: Limpiar la marca de retry antes de reintentar
        delete originalRequest._retry;

        // Reintentar la petición original
        return axios(originalRequest);

      } catch (refreshError) {
        // El refresh token también expiró o es inválido
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Error 403 - Sin permisos
    if (error.response?.status === 403) {
      console.error('Acceso denegado:', error.response.data.error);
    }

    return Promise.reject(error);
  }
);

export default api;