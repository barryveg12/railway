/**
 * Configuración centralizada de la URL de la API.
 * 
 * - Si VITE_API_URL está definida (ej. en Railway o .env), se usa esa URL.
 * - Si estamos en producción y el frontend se sirve desde el mismo servidor (Express), se usa la ruta relativa '/api'.
 * - Si estamos en desarrollo local (Vite dev server), se usa 'http://localhost:3000/api'.
 */

const envApiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/$/, '') : '';

export const API_BASE_URL = envApiUrl 
  ? `${envApiUrl}/api` 
  : (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api');

export default API_BASE_URL;
