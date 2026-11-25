import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { register, obtenerRoles } from '../services/authService';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nombre: '',
    correo: '',
    password: '',
    edad: '',
    rolNombre: 'usuario'
  });
  const [roles, setRoles] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(null);

  useEffect(() => {
    const cargarRoles = async () => {
      const data = await obtenerRoles();
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
      }
    };
    cargarRoles();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);
    setExito(null);

    try {
      await register({
        nombre: formData.nombre,
        correo: formData.correo,
        password: formData.password,
        edad: formData.edad ? parseInt(formData.edad, 10) : null,
        rolNombre: formData.rolNombre
      });

      setExito('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Error al registrar usuario');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>📝</div>
          <h2 style={styles.title}>Crear Cuenta</h2>
          <p style={styles.subtitle}>Registro de Usuario y Asignación de Rol</p>
        </div>

        {exito && <div style={styles.alertSuccess}>{exito}</div>}
        {error && <div style={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="nombre">
              Nombre Completo
            </label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Ej: Juan Pérez"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="correo">
              Correo Electrónico
            </label>
            <input
              id="correo"
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="juan@correo.com"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label} htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              required
              style={styles.input}
            />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="edad">
                Edad
              </label>
              <input
                id="edad"
                type="number"
                name="edad"
                value={formData.edad}
                onChange={handleChange}
                placeholder="Ej: 25"
                style={styles.input}
              />
            </div>

            <div style={{ ...styles.formGroup, flex: 1 }}>
              <label style={styles.label} htmlFor="rolNombre">
                Rol
              </label>
              <select
                id="rolNombre"
                name="rolNombre"
                value={formData.rolNombre}
                onChange={handleChange}
                style={styles.select}
              >
                {roles.length > 0 ? (
                  roles.map((r) => (
                    <option key={r.id} value={r.nombre}>
                      {r.nombre.toUpperCase()}
                    </option>
                  ))
                ) : (
                  <>
                    <option value="usuario">USUARIO</option>
                    <option value="admin">ADMIN</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              ...styles.submitButton,
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? 'Registrando...' : 'Registrar Cuenta'}
          </button>
        </form>

        <div style={styles.footer}>
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" style={styles.link}>
            Inicia sesión aquí
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
    padding: '35px 30px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  iconCircle: {
    width: '54px',
    height: '54px',
    margin: '0 auto 12px auto',
    backgroundColor: '#ede9fe',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '26px'
  },
  title: {
    margin: '0 0 6px 0',
    fontSize: '24px',
    color: '#1e293b',
    fontWeight: '700'
  },
  subtitle: {
    margin: 0,
    fontSize: '14px',
    color: '#64748b'
  },
  alertSuccess: {
    padding: '10px 14px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  alertError: {
    padding: '10px 14px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: '8px',
    fontSize: '13px',
    marginBottom: '16px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  row: {
    display: 'flex',
    gap: '12px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#334155'
  },
  input: {
    padding: '10px 13px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    width: '100%'
  },
  select: {
    padding: '10px 13px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box',
    width: '100%'
  },
  submitButton: {
    marginTop: '8px',
    padding: '12px',
    backgroundColor: '#4f46e5',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#64748b'
  },
  link: {
    color: '#4f46e5',
    textDecoration: 'none',
    fontWeight: '600'
  }
};

