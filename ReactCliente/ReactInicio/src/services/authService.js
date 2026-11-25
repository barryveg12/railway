import { API_BASE_URL } from '../config/api';

const API_AUTH_URL = `${API_BASE_URL}/auth`;

/**
 * Inicia sesión con correo y contraseña
 */
export const login = async (correo, password) => {
  try {
    const response = await fetch(`${API_AUTH_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ correo, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al iniciar sesión');
    }

    // Guardar en localStorage
    if (data.token) {
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.usuario));
    }

    return data;
  } catch (error) {
    console.error('Error en authService.login:', error);
    throw error;
  }
};

/**
 * Registra un nuevo usuario
 */
export const register = async (usuarioData) => {
  try {
    const response = await fetch(`${API_AUTH_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usuarioData)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al registrar usuario');
    }

    return data;
  } catch (error) {
    console.error('Error en authService.register:', error);
    throw error;
  }
};

/**
 * Obtiene los roles registrados
 */
export const obtenerRoles = async () => {
  try {
    const response = await fetch(`${API_AUTH_URL}/roles`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener roles:', error);
    return [];
  }
};

/**
 * Obtener todos los usuarios (solo administradores vía JWT)
 */
export const obtenerUsuarios = async () => {
  try {
    const token = getToken();
    const response = await fetch(`${API_AUTH_URL}/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return await response.json();
  } catch (error) {
    console.error('Error en obtenerUsuarios:', error);
    return [];
  }
};

/**
 * Obtiene el token JWT actual
 */
export const getToken = () => {
  return localStorage.getItem('auth_token') || null;
};

/**
 * Helper para generar cabeceras HTTP autenticadas con JWT
 */
export const getAuthHeaders = () => {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

/**
 * Obtiene el usuario autenticado actualmente almacenado
 */
export const getUsuarioActual = () => {
  try {
    const userStr = localStorage.getItem('auth_user');
    return userStr ? JSON.parse(userStr) : null;
  } catch {
    return null;
  }
};

/**
 * Cierra la sesión activa
 */
export const logout = () => {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
};

export default {
  login,
  register,
  obtenerRoles,
  obtenerUsuarios,
  getToken,
  getAuthHeaders,
  getUsuarioActual,
  logout
};
