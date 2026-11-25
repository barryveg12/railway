const API_URL = 'http://localhost:3000/api/libros';

const obtenerHeadersAuth = () => {
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
 * Guarda / crea un nuevo libro en la base de datos
 */
export const crearLibro = async (libroData) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: obtenerHeadersAuth(),
      body: JSON.stringify(libroData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al guardar el libro');
    }

    return data;
  } catch (error) {
    console.error('Error en crearLibro:', error);
    throw error;
  }
};

/**
 * Obtiene todos los libros registrados
 */
export const obtenerLibros = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Error al obtener los libros');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en obtenerLibros:', error);
    throw error;
  }
};

/**
 * Actualiza un libro existente (incluye asignación de categoría o editorial)
 */
export const actualizarLibro = async (id, libroData) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: obtenerHeadersAuth(),
      body: JSON.stringify(libroData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al actualizar el libro');
    }

    return data;
  } catch (error) {
    console.error('Error en actualizarLibro:', error);
    throw error;
  }
};

/**
 * Elimina un libro por ID
 */
export const eliminarLibro = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: obtenerHeadersAuth()
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.mensaje || 'Error al eliminar el libro');
    }

    return data;
  } catch (error) {
    console.error('Error en eliminarLibro:', error);
    throw error;
  }
};

export default {
  crearLibro,
  obtenerLibros,
  actualizarLibro,
  eliminarLibro,
};
