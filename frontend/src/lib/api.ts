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
      const token = localStorage.getItem('token');
      const adminToken = localStorage.getItem('admin_token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      } else if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de respuesta: detecta 401 y emite evento para logout global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Emitir evento global para que AuthContext maneje el logout
        window.dispatchEvent(new CustomEvent('session-expired'));
      }
    }
    return Promise.reject(error);
  }
);
