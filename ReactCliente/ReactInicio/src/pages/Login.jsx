import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../services/authService';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    correo: '',
    password: ''
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  // Rellenar automáticamente con las credenciales de prueba
  const llenarCredencialesAdminPrueba = () => {
    setFormData({
      correo: 'admin@admin.com',
      password: 'admin123'
    });
    setError(null);
  };

  const llenarCredencialesLectorPrueba = () => {
    setFormData({
      correo: 'lector@biblioteca.com',
      password: 'lector123'
    });
    setError(null);
  };

  const llenarCredencialesBibliotecarioPrueba = () => {
    setFormData({
      correo: 'bibliotecario@biblioteca.com',
      password: 'biblio123'
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError(null);

    try {
      const data = await login(formData.correo, formData.password);
      const usuario = data.usuario;

      // Redirigir según el rol: admin y bibliotecario van al panel de admin
      if (usuario.rol === 'admin' || usuario.rol === 'bibliotecario') {
        navigate('/admin');
      } else {
        navigate('/panel');
      }
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.iconCircle}>🔐</div>
          <h2 style={styles.title}>Iniciar Sesión</h2>
          <p style={styles.subtitle}>Sistema de Biblioteca y Gestión</p>
        </div>

        {/* Acceso rápido de prueba */}
        <div style={styles.quickFillBox}>
          <div style={styles.quickFillHeader}>
            <strong>👤 Cuentas de Acceso Rápido:</strong>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={llenarCredencialesAdminPrueba}
              style={styles.quickFillButton}
            >
              👑 Rol Admin
            </button>
            <button
              type="button"
              onClick={llenarCredencialesBibliotecarioPrueba}
              style={{ ...styles.quickFillButton, backgroundColor: '#0d9488' }}
            >
              📚 Rol Bibliotecario
            </button>
            <button
              type="button"
              onClick={llenarCredencialesLectorPrueba}
              style={{ ...styles.quickFillButton, backgroundColor: '#0284c7' }}
            >
              📖 Rol Lector
            </button>
          </div>
        </div>

        {error && <div style={styles.alertError}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
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
              placeholder="ejemplo@correo.com"
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
              placeholder="••••••••"
              required
              style={styles.input}
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            style={{
              ...styles.submitButton,
              opacity: cargando ? 0.7 : 1
            }}
          >
            {cargando ? 'Iniciando sesión...' : 'Entrar al Sistema'}
          </button>
        </form>

        <div style={styles.footer}>
          ¿No tienes una cuenta?{' '}
          <Link to="/register" style={styles.link}>
            Regístrate aquí
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
    maxWidth: '430px',
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
  quickFillBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '12px 14px',
    marginBottom: '20px',
    textAlign: 'center',
    fontSize: '13px',
    color: '#166534'
  },
  quickFillHeader: {
    marginBottom: '4px'
  },
  quickFillText: {
    marginBottom: '8px',
    fontSize: '12px'
  },
  quickFillButton: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 12px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
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
    gap: '16px'
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
    padding: '11px 14px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    boxSizing: 'border-box',
    width: '100%'
  },
  submitButton: {
    marginTop: '6px',
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
    marginTop: '22px',
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

