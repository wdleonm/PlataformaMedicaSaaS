import axios from 'axios';

// Determina la URL base. Ajustar en producción.
//const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const NEXT_PUBLIC_API_URL = 'http://127.0.0.1:8001'; // Cambiado a 127.0.0.1:8001


export const api = axios.create({
  baseURL: NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar automáticamente el Token JWT si existe
api.interceptors.request.use(
  (config) => {
    // Al ejecutarse en el navegador, buscamos el token en localStorage
    if (typeof window !== 'undefined') {
      const isUrlAdmin = config.url?.includes('/api/admin');
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('admin_token');
      
      if (isUrlAdmin && adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      } else if (!isUrlAdmin && token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: detecta 401 y 403 para redirecciones globales
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      if (error.response?.status === 401) {
        // Token expirado o inválido
        const isUrlAdmin = error.config?.url?.includes('/api/admin');
        if (isUrlAdmin) {
          window.dispatchEvent(new CustomEvent('admin-session-expired'));
        } else {
          window.dispatchEvent(new CustomEvent('session-expired'));
        }
      } else if (error.response?.status === 403) {
        const detail = error.response?.data?.detail || '';
        if (detail.includes('actualizar tu contraseña') || detail.includes('contraseña para continuar')) {
          // Forzar cambio de contraseña - redirigir a seguridad
          window.location.href = '/seguridad';
          return new Promise(() => {}); // Never resolve, page is redirecting
        }
      }
    }
    return Promise.reject(error);
  }
);
