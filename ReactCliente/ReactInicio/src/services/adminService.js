const BASE_URL = 'http://localhost:3000/api';

/**
 * Genera cabeceras con el Bearer token JWT almacenado en localStorage
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

// --- CATEGORÍAS ---
export const obtenerCategorias = async () => {
  const res = await fetch(`${BASE_URL}/categorias`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener categorías');
  return await res.json();
};

export const crearCategoria = async (datos) => {
  const res = await fetch(`${BASE_URL}/categorias`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al crear categoría');
  return data;
};

export const eliminarCategoria = async (id) => {
  const res = await fetch(`${BASE_URL}/categorias/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al eliminar categoría');
  return data;
};

// --- EDITORIALES ---
export const obtenerEditoriales = async () => {
  const res = await fetch(`${BASE_URL}/editoriales`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener editoriales');
  return await res.json();
};

export const crearEditorial = async (datos) => {
  const res = await fetch(`${BASE_URL}/editoriales`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al crear editorial');
  return data;
};

export const eliminarEditorial = async (id) => {
  const res = await fetch(`${BASE_URL}/editoriales/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al eliminar editorial');
  return data;
};

// --- EJEMPLARES (COPIAS FÍSICAS) ---
export const obtenerEjemplares = async () => {
  const res = await fetch(`${BASE_URL}/ejemplares`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener ejemplares');
  return await res.json();
};

export const crearEjemplar = async (datos) => {
  const res = await fetch(`${BASE_URL}/ejemplares`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al registrar ejemplar');
  return data;
};

export const eliminarEjemplar = async (id) => {
  const res = await fetch(`${BASE_URL}/ejemplares/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al eliminar ejemplar');
  return data;
};

// --- PRÉSTAMOS ---
export const obtenerPrestamos = async () => {
  const res = await fetch(`${BASE_URL}/prestamos`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener préstamos');
  return await res.json();
};

export const crearPrestamo = async (datos) => {
  const res = await fetch(`${BASE_URL}/prestamos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al registrar préstamo');
  return data;
};

export const devolverLibro = async (id) => {
  const res = await fetch(`${BASE_URL}/prestamos/${id}/devolver`, {
    method: 'PUT',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al procesar devolución');
  return data;
};

// --- AUDITORÍA DE LIBROS ---
export const obtenerAuditoriasLibros = async () => {
  const res = await fetch(`${BASE_URL}/auditoria/libros`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener registros de auditoría');
  return await res.json();
};

// --- ASOCIADOS (CRUD) ---
export const obtenerAsociados = async () => {
  const res = await fetch(`${BASE_URL}/asociados`, { headers: getAuthHeaders() });
  if (!res.ok) throw new Error('Error al obtener asociados');
  return await res.json();
};

export const crearAsociado = async (datos) => {
  const res = await fetch(`${BASE_URL}/asociados`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al crear asociado');
  return data;
};

export const actualizarAsociado = async (id, datos) => {
  const res = await fetch(`${BASE_URL}/asociados/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(datos)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al actualizar asociado');
  return data;
};

export const eliminarAsociado = async (id) => {
  const res = await fetch(`${BASE_URL}/asociados/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al eliminar asociado');
  return data;
};

export const verificarAlertaStock = async () => {
  const res = await fetch(`${BASE_URL}/asociados/verificar-alerta-stock`, {
    method: 'POST',
    headers: getAuthHeaders()
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.mensaje || 'Error al verificar alerta de stock');
  return data.data;
};

export default {
  obtenerCategorias,
  crearCategoria,
  eliminarCategoria,
  obtenerEditoriales,
  crearEditorial,
  eliminarEditorial,
  obtenerEjemplares,
  crearEjemplar,
  eliminarEjemplar,
  obtenerPrestamos,
  crearPrestamo,
  devolverLibro,
  obtenerAuditoriasLibros,
  obtenerAsociados,
  crearAsociado,
  actualizarAsociado,
  eliminarAsociado,
  verificarAlertaStock
};
