import { useState, useEffect } from 'react';
import { crearLibro } from '../services/librosService';
import { obtenerCategorias } from '../services/adminService';

export default function FormLibros({ onLibroGuardado }) {
  // Estado inicial con los campos requeridos (todos tipo string por defecto)
  const [formData, setFormData] = useState({
    titulo: 'los tres mosqueteros',
    isbn: '',
    paginas: '',
    descripcion: '',
    categoriaId: ''
  });

  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarCategorias = async () => {
      try {
        const data = await obtenerCategorias();
        if (Array.isArray(data)) {
          setCategorias(data);
        }
      } catch (err) {
        console.error('Error al cargar categorías:', err);
      }
    };
    cargarCategorias();
  }, []);

  // Manejo de cambios en los inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: String(value)
    }));
  };

  // Manejo del envío del formulario para guardar
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMensaje(null);
    setError(null);

    const libroAGuardar = {
      titulo: String(formData.titulo),
      isbn: String(formData.isbn),
      paginas: String(formData.paginas),
      descripcion: String(formData.descripcion),
      categoriaId: formData.categoriaId ? parseInt(formData.categoriaId, 10) : null
    };

    try {
      const respuesta = await crearLibro(libroAGuardar);
      setMensaje('¡Libro guardado exitosamente en la base de datos!');

      // Reiniciar formulario
      setFormData({
        titulo: '',
        isbn: '',
        paginas: '',
        descripcion: '',
        categoriaId: ''
      });

      if (onLibroGuardado) {
        onLibroGuardado(respuesta);
      }
    } catch (err) {
      setError(err.message || 'Error al guardar el libro');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      {/* Encabezado elegante coordinado con el chat */}
      <div style={styles.header}>
        <div style={styles.headerTitleContainer}>
          <span style={styles.badge}>FORM</span>
          <div>
            <h3 style={styles.headerTitle}>Registrar Nuevo Libro</h3>
            <span style={styles.headerSubtitle}>Guarda libros directamente en MySQL</span>
          </div>
        </div>
      </div>

      <div style={styles.body}>
        {mensaje && <div style={styles.alertSuccess}>{mensaje}</div>}
        {error && <div style={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="titulo">
              Título del Libro *
            </label>
            <input
              id="titulo"
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: Los tres mosqueteros"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="isbn">
                ISBN
              </label>
              <input
                id="isbn"
                type="text"
                name="isbn"
                value={formData.isbn}
                onChange={handleChange}
                placeholder="Ej: 978-0140449198"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="paginas">
                Páginas
              </label>
              <input
                id="paginas"
                type="text"
                name="paginas"
                value={formData.paginas}
                onChange={handleChange}
                placeholder="Ej: 350"
                style={styles.input}
              />
            </div>
          </div>

          {/* Selector de Categoría */}
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="categoriaId">
              Categoría / Género
            </label>
            <select
              id="categoriaId"
              name="categoriaId"
              value={formData.categoriaId}
              onChange={handleChange}
              style={styles.select}
            >
              <option value="">Selecciona una categoría (opcional)...</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="descripcion">
              Descripción o Sinopsis
            </label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Escribe un breve resumen de la historia o contenido..."
              rows="4"
              style={styles.textarea}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Guardando en la base de datos...' : '💾 Guardar Libro'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  card: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    height: '620px',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
    overflow: 'hidden',
    boxSizing: 'border-box'
  },
  header: {
    padding: '16px 20px',
    backgroundColor: '#1e293b',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottom: '1px solid #334155'
  },
  headerTitleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  badge: {
    backgroundColor: '#0ea5e9',
    color: '#ffffff',
    fontWeight: 'bold',
    fontSize: '11px',
    padding: '4px 8px',
    borderRadius: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  headerTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '600'
  },
  headerSubtitle: {
    fontSize: '12px',
    color: '#94a3b8'
  },
  body: {
    padding: '20px 22px',
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '13px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '5px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.2s',
    backgroundColor: '#f8fafc'
  },
  select: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%',
    backgroundColor: '#f8fafc'
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
    width: '100%',
    transition: 'border-color 0.2s',
    backgroundColor: '#f8fafc'
  },
  submitButton: {
    marginTop: '6px',
    padding: '12px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  alertSuccess: {
    padding: '10px 14px',
    marginBottom: '12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '8px',
    fontSize: '13px',
    textAlign: 'center'
  },
  alertError: {
    padding: '10px 14px',
    marginBottom: '12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '13px',
    textAlign: 'center'
  }
};
