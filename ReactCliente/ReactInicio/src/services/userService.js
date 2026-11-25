import { API_BASE_URL } from '../config/api';

const BASE_URL = API_BASE_URL;

/**
 * Genera cabeceras con el Bearer token JWT
 */
const getAuthHeaders = () => {
  const headers = { 'Content-Type': 'application/json' };
  try {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const userStr = localStorage.getItem('auth_user');
    if (userStr) {
      const user = JSON.parse(userStr);
      if (user?.id) {
        headers['x-user-id'] = String(user.id);
      }
    }
  } catch {
    // Si no hay sesión, continúa sin header
  }
  return headers;
};

/**
 * Obtiene los préstamos del usuario en sesión
 */
export const obtenerMisPrestamos = async (usuarioId) => {
  const res = await fetch(`${BASE_URL}/prestamos/mis-prestamos`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener mis préstamos');
  return await res.json();
};

/**
 * Obtiene las reservas del usuario en sesión
 */
export const obtenerMisReservas = async (usuarioId) => {
  const res = await fetch(`${BASE_URL}/reservas/mis-reservas`, {
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Error al obtener mis reservas');
  return await res.json();
};

/**
 * Solicita la reserva de un libro
 */
export const solicitarReserva = async (libroId, usuarioId) => {
  const res = await fetch(`${BASE_URL}/reservas`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ libroId, usuarioId })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al solicitar reserva');
  return data;
};

/**
 * Cancela una reserva existente
 */
export const cancelarReserva = async (reservaId) => {
  const res = await fetch(`${BASE_URL}/reservas/${reservaId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al cancelar reserva');
  return data;
};

export default {
  obtenerMisPrestamos,
  obtenerMisReservas,
  solicitarReserva,
  cancelarReserva
};
