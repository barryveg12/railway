import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../componets/Sidebar';
import FormLibros from '../componets/FormLibros';
import ChatLibros from '../componets/chatLibros';
import { getUsuarioActual, logout, obtenerUsuarios, obtenerRoles } from '../services/authService';
import { obtenerLibros, actualizarLibro, eliminarLibro } from '../services/librosService';
import {
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
} from '../services/adminService';
import {
  generarReporteDiario,
  descargarReportePDF,
  obtenerEstadoCronReportes,
  forzarEjecucionCron
} from '../services/reporteService';

export default function Admin() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [seccionActiva, setSeccionActiva] = useState('dashboard');

  // Datos principales
  const [libros, setLibros] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [editoriales, setEditoriales] = useState([]);
  const [ejemplares, setEjemplares] = useState([]);
  const [prestamos, setPrestamos] = useState([]);
  const [auditorias, setAuditorias] = useState([]);
  const [asociados, setAsociados] = useState([]);
  const [filtroAudit, setFiltroAudit] = useState('TODAS');
  const [detalleAuditModal, setDetalleAuditModal] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  // Estados de formularios individuales
  const [formCat, setFormCat] = useState({ nombre: '', descripcion: '' });
  const [formEdit, setFormEdit] = useState({ nombre: '', pais: '', telefono: '', sitio_web: '' });
  const [formEjem, setFormEjem] = useState({ libroId: '', codigo_barras: '', ubicacion_estante: '', estado: 'disponible' });
  const [formPrest, setFormPrest] = useState({ usuarioId: '', ejemplarId: '', fecha_devolucion_limite: '' });
  const [formAsoc, setFormAsoc] = useState({ nombre: '', correo: '', telefono: '', empresa: '', activo: true });
  const [asociadoEditando, setAsociadoEditando] = useState(null);
  const [verificandoAlertaStock, setVerificandoAlertaStock] = useState(false);

  // Estados de Reportería Diaria con Claude Sonnet 5.5
  const [fechaReporte, setFechaReporte] = useState(() => {
    const hoy = new Date();
    const y = hoy.getFullYear();
    const m = String(hoy.getMonth() + 1).padStart(2, '0');
    const d = String(hoy.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  });
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const [resultadoReporte, setResultadoReporte] = useState(null);
  const [estadoCron, setEstadoCron] = useState(null);

  // Mensajes de feedback
  const [mensajeOperacion, setMensajeOperacion] = useState(null);

  useEffect(() => {
    const usuarioLogueado = getUsuarioActual();

    if (!usuarioLogueado) {
      navigate('/login');
      return;
    }

    if (usuarioLogueado.rol !== 'admin' && usuarioLogueado.rol !== 'bibliotecario') {
      alert('Acceso restringido: Esta sección requiere rol de Administrador o Bibliotecario.');
      navigate('/libros');
      return;
    }

    setUsuario(usuarioLogueado);
    cargarTodosLosDatos();
  }, [navigate]);

  // Recargar datos frescos automáticamente al cambiar de sección (ej: al entrar a Auditoría o Reportes)
  useEffect(() => {
    if (usuario) {
      cargarTodosLosDatos();
    }
  }, [seccionActiva]);

  // Polling suave de estado de Cron Job cada 10 segundos cuando está en la sección de reportes
  useEffect(() => {
    if (seccionActiva !== 'reportes') return;
    const consultarCron = () => {
      obtenerEstadoCronReportes()
        .then(data => setEstadoCron(data))
        .catch(() => {});
    };
    consultarCron();
    const interval = setInterval(consultarCron, 10000);
    return () => clearInterval(interval);
  }, [seccionActiva]);

  const cargarTodosLosDatos = async () => {
    setCargandoDatos(true);
    try {
      const [libs, usrs, rls, cats, edits, ejems, prests, audits, asocs] = await Promise.all([
        obtenerLibros().catch(() => []),
        obtenerUsuarios().catch(() => []),
        obtenerRoles().catch(() => []),
        obtenerCategorias().catch(() => []),
        obtenerEditoriales().catch(() => []),
        obtenerEjemplares().catch(() => []),
        obtenerPrestamos().catch(() => []),
        obtenerAuditoriasLibros().catch(() => []),
        obtenerAsociados().catch(() => [])
      ]);

      setLibros(Array.isArray(libs) ? libs : []);
      setUsuarios(Array.isArray(usrs) ? usrs : []);
      setRoles(Array.isArray(rls) ? rls : []);
      setCategorias(Array.isArray(cats) ? cats : []);
      setEditoriales(Array.isArray(edits) ? edits : []);
      setEjemplares(Array.isArray(ejems) ? ejems : []);
      setPrestamos(Array.isArray(prests) ? prests : []);
      setAuditorias(Array.isArray(audits) ? audits : []);
      setAsociados(Array.isArray(asocs) ? asocs : []);
    } catch (err) {
      console.error('Error al cargar datos en panel admin:', err);
    } finally {
      setCargandoDatos(false);
    }
  };

  const mostrarMensaje = (texto) => {
    setMensajeOperacion(texto);
    setTimeout(() => setMensajeOperacion(null), 4000);
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  // --- CRUD CATEGORÍAS ---
  const handleGuardarCategoria = async (e) => {
    e.preventDefault();
    try {
      await crearCategoria(formCat);
      setFormCat({ nombre: '', descripcion: '' });
      mostrarMensaje('Categoría creada exitosamente');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBorrarCategoria = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta categoría?')) return;
    try {
      await eliminarCategoria(id);
      mostrarMensaje('Categoría eliminada');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCambiarCategoriaLibro = async (libroId, categoriaId) => {
    try {
      await actualizarLibro(libroId, {
        categoriaId: categoriaId ? parseInt(categoriaId, 10) : null
      });
      mostrarMensaje('Categoría asignada al libro correctamente');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message || 'Error al asignar categoría al libro');
    }
  };

  const handleBorrarLibro = async (id, titulo) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el libro "${titulo}"? Esta acción quedará registrada en la auditoría.`)) return;
    try {
      await eliminarLibro(id);
      mostrarMensaje(`Libro "${titulo}" eliminado exitosamente`);
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message || 'Error al eliminar el libro');
    }
  };

  // --- CRUD EDITORIALES ---
  const handleGuardarEditorial = async (e) => {
    e.preventDefault();
    try {
      await crearEditorial(formEdit);
      setFormEdit({ nombre: '', pais: '', telefono: '', sitio_web: '' });
      mostrarMensaje('Editorial creada exitosamente');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBorrarEditorial = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta editorial?')) return;
    try {
      await eliminarEditorial(id);
      mostrarMensaje('Editorial eliminada');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CRUD EJEMPLARES (COPIAS FÍSICAS) ---
  const handleGuardarEjemplar = async (e) => {
    e.preventDefault();
    try {
      await crearEjemplar(formEjem);
      setFormEjem({ libroId: '', codigo_barras: '', ubicacion_estante: '', estado: 'disponible' });
      mostrarMensaje('Ejemplar físico registrado exitosamente');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBorrarEjemplar = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este ejemplar?')) return;
    try {
      await eliminarEjemplar(id);
      mostrarMensaje('Ejemplar eliminado');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- CRUD PRÉSTAMOS ---
  const handleGuardarPrestamo = async (e) => {
    e.preventDefault();
    try {
      await crearPrestamo(formPrest);
      setFormPrest({ usuarioId: '', ejemplarId: '', fecha_devolucion_limite: '' });
      mostrarMensaje('Préstamo registrado exitosamente');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDevolver = async (id) => {
    if (!window.confirm('¿Confirmas la recepción y devolución de este libro?')) return;
    try {
      const res = await devolverLibro(id);
      mostrarMensaje(res.multa ? `Devuelto con multa de $${res.multa.monto} por retraso` : 'Libro devuelto con éxito');
      cargarTodosLosDatos();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!usuario) return null;

  return (
    <div style={styles.layout}>
      {/* Sidebar de Navegación con los módulos CRUD */}
      <Sidebar
        seccionActiva={seccionActiva}
        setSeccionActiva={setSeccionActiva}
        usuario={usuario}
        onCerrarSesion={handleCerrarSesion}
      />

      {/* Contenido Principal Dinámico */}
      <main style={styles.mainContent}>
        <header style={styles.topbar}>
          <div>
            <h1 style={styles.pageTitle}>
              {seccionActiva === 'dashboard' && 'Panel de Control (Dashboard)'}
              {seccionActiva === 'libros' && 'Gestión y Registro de Libros'}
              {seccionActiva === 'prestamos' && 'Gestión de Préstamos y Devoluciones'}
              {seccionActiva === 'ejemplares' && 'Inventario de Ejemplares Físicos'}
              {seccionActiva === 'categorias' && 'Gestión de Categorías'}
              {seccionActiva === 'editoriales' && 'Gestión de Editoriales'}
              {seccionActiva === 'usuarios' && 'Usuarios y Roles del Sistema'}
              {seccionActiva === 'auditoria' && 'Registro de Auditoría de Libros'}
              {seccionActiva === 'asociados' && 'Gestión de Asociados & Aliados (Notificaciones Stock)'}
              {seccionActiva === 'reportes' && 'Agente de Reportería Diaria (Claude Sonnet 5.5)'}
              {seccionActiva === 'ia' && 'Asistente IA (Claude)'}
            </h1>
            <p style={styles.pageSubtitle}>
              Módulo administrativo de biblioteca • Sesión activa: <strong>{usuario.nombre}</strong>
            </p>
          </div>

          <div style={styles.badgeAdmin}>
            {usuario.rol === 'admin' ? '🛡️ Administrador' : '📚 Bibliotecario'}
          </div>
        </header>

        {mensajeOperacion && (
          <div style={styles.toastSuccess}>{mensajeOperacion}</div>
        )}

        {/* 1. SECCIÓN: DASHBOARD */}
        {seccionActiva === 'dashboard' && (
          <div style={styles.sectionContainer}>
            <div style={styles.statsGrid}>
              <div style={{ ...styles.statCard, borderLeft: '4px solid #3b82f6' }}>
                <div style={styles.statIcon}>📚</div>
                <div>
                  <div style={styles.statLabel}>Obras Literarias</div>
                  <div style={styles.statValue}>{libros.length}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, borderLeft: '4px solid #10b981' }}>
                <div style={styles.statIcon}>📦</div>
                <div>
                  <div style={styles.statLabel}>Ejemplares Físicos</div>
                  <div style={styles.statValue}>{ejemplares.length}</div>
                </div>
              </div>

              <div style={{ ...styles.statCard, borderLeft: '4px solid #f59e0b' }}>
                <div style={styles.statIcon}>🔄</div>
                <div>
                  <div style={styles.statLabel}>Préstamos Activos</div>
                  <div style={styles.statValue}>
                    {prestamos.filter((p) => p.estado === 'activo').length}
                  </div>
                </div>
              </div>

              <div style={{ ...styles.statCard, borderLeft: '4px solid #8b5cf6' }}>
                <div style={styles.statIcon}>👥</div>
                <div>
                  <div style={styles.statLabel}>Usuarios Totales</div>
                  <div style={styles.statValue}>{usuarios.length}</div>
                </div>
              </div>
            </div>

            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>📖 Últimos Libros Registrados</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Título</th>
                      <th style={styles.th}>ISBN</th>
                      <th style={styles.th}>Páginas</th>
                      <th style={styles.th}>Descripción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {libros.slice(0, 5).map((l) => (
                      <tr key={l.id} style={styles.tr}>
                        <td style={styles.td}>#{l.id}</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{l.titulo}</td>
                        <td style={styles.td}>{l.isbn || '—'}</td>
                        <td style={styles.td}>{l.paginas || '—'}</td>
                        <td style={styles.td}>{l.descripcion || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. SECCIÓN: GESTIÓN DE LIBROS */}
        {seccionActiva === 'libros' && (
          <div style={styles.sectionContainer}>
            <div style={{ maxWidth: '680px', margin: '0 auto', width: '100%' }}>
              <FormLibros onLibroGuardado={cargarTodosLosDatos} />
            </div>

            {/* Asignación y cambio de categorías para libros existentes */}
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>🏷️ Asignación de Categorías a Libros</h3>
              <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#64748b' }}>
                Selecciona la categoría que deseas asociar a cada libro. El cambio se guarda automáticamente en la base de datos:
              </p>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Título</th>
                      <th style={styles.th}>ISBN</th>
                      <th style={styles.th}>Categoría Actual</th>
                      <th style={styles.th}>Asignar / Cambiar Categoría</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {libros.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>No hay libros registrados</td></tr>
                    ) : (
                      libros.map((l) => (
                        <tr key={l.id} style={styles.tr}>
                          <td style={styles.td}>#{l.id}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{l.titulo}</td>
                          <td style={styles.td}>{l.isbn || '—'}</td>
                          <td style={styles.td}>
                            {l.categoria ? (
                              <span style={{ ...styles.badge, backgroundColor: '#3b82f6' }}>
                                {l.categoria.nombre}
                              </span>
                            ) : (
                              <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '12px' }}>
                                Sin categoría
                              </span>
                            )}
                          </td>
                          <td style={styles.td}>
                            <select
                              value={l.categoriaId || l.categoria?.id || ''}
                              onChange={(e) => handleCambiarCategoriaLibro(l.id, e.target.value)}
                              style={{ ...styles.input, maxWidth: '240px', padding: '6px 10px' }}
                            >
                              <option value="">(Sin Categoría)</option>
                              {categorias.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.nombre}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleBorrarLibro(l.id, l.titulo)}
                              style={styles.dangerButton}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. SECCIÓN: PRÉSTAMOS (CRUD) */}
        {seccionActiva === 'prestamos' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>➕ Registrar Nuevo Préstamo</h3>
              <form onSubmit={handleGuardarPrestamo} style={styles.gridForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Usuario Solicitante</label>
                  <select
                    value={formPrest.usuarioId}
                    onChange={(e) => setFormPrest({ ...formPrest, usuarioId: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecciona un usuario...</option>
                    {usuarios.map((u) => (
                      <option key={u.id} value={u.id}>{u.nombre} ({u.correo})</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Ejemplar Disponible</label>
                  <select
                    value={formPrest.ejemplarId}
                    onChange={(e) => setFormPrest({ ...formPrest, ejemplarId: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecciona un ejemplar disponible...</option>
                    {ejemplares.filter((ej) => ej.estado === 'disponible').map((ej) => (
                      <option key={ej.id} value={ej.id}>
                        {ej.libro?.titulo || 'Libro'} — Código: {ej.codigo_barras} ({ej.ubicacion_estante || 'Sin estante'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Fecha Límite Devolución</label>
                  <input
                    type="date"
                    value={formPrest.fecha_devolucion_limite}
                    onChange={(e) => setFormPrest({ ...formPrest, fecha_devolucion_limite: e.target.value })}
                    required
                    style={styles.input}
                  />
                </div>

                <button type="submit" style={styles.primaryButton}>
                  Registrar Préstamo
                </button>
              </form>
            </div>

            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>📋 Historial y Estado de Préstamos</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Usuario</th>
                      <th style={styles.th}>Libro / Ejemplar</th>
                      <th style={styles.th}>Fecha Préstamo</th>
                      <th style={styles.th}>Límite</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}>Multa</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamos.length === 0 ? (
                      <tr><td colSpan="8" style={{ ...styles.td, textAlign: 'center' }}>No hay préstamos registrados</td></tr>
                    ) : (
                      prestamos.map((p) => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={styles.td}>#{p.id}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{p.usuario?.nombre}</td>
                          <td style={styles.td}>
                            {p.ejemplar?.libro?.titulo} <small style={{ color: '#64748b' }}>({p.ejemplar?.codigo_barras})</small>
                          </td>
                          <td style={styles.td}>{p.fecha_prestamo}</td>
                          <td style={styles.td}>{p.fecha_devolucion_limite}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: p.estado === 'activo' ? '#f59e0b' : '#10b981'
                            }}>
                              {p.estado.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {p.multa ? (
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                ${p.multa.monto} ({p.multa.estado_pago})
                              </span>
                            ) : '—'}
                          </td>
                          <td style={styles.td}>
                            {p.estado === 'activo' && (
                              <button
                                onClick={() => handleDevolver(p.id)}
                                style={styles.actionButton}
                              >
                                Marcar Devuelto
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. SECCIÓN: EJEMPLARES FÍSICOS (CRUD) */}
        {seccionActiva === 'ejemplares' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>➕ Agregar Ejemplar Físico a un Libro</h3>
              <form onSubmit={handleGuardarEjemplar} style={styles.gridForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Libro de Referencia</label>
                  <select
                    value={formEjem.libroId}
                    onChange={(e) => setFormEjem({ ...formEjem, libroId: e.target.value })}
                    required
                    style={styles.input}
                  >
                    <option value="">Selecciona el libro...</option>
                    {libros.map((l) => (
                      <option key={l.id} value={l.id}>{l.titulo} (ISBN: {l.isbn || 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Código de Barras / Placa Única</label>
                  <input
                    type="text"
                    value={formEjem.codigo_barras}
                    onChange={(e) => setFormEjem({ ...formEjem, codigo_barras: e.target.value })}
                    placeholder="Ej: LIB-001-A"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Ubicación en Estante</label>
                  <input
                    type="text"
                    value={formEjem.ubicacion_estante}
                    onChange={(e) => setFormEjem({ ...formEjem, ubicacion_estante: e.target.value })}
                    placeholder="Ej: Pasillo 2, Estante B"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Estado Inicial</label>
                  <select
                    value={formEjem.estado}
                    onChange={(e) => setFormEjem({ ...formEjem, estado: e.target.value })}
                    style={styles.input}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="en_reparacion">En Reparación</option>
                    <option value="danado">Dañado</option>
                  </select>
                </div>

                <button type="submit" style={styles.primaryButton}>
                  Guardar Ejemplar
                </button>
              </form>
            </div>

            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>📦 Inventario de Copias Físicas</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Libro</th>
                      <th style={styles.th}>Código Barras</th>
                      <th style={styles.th}>Ubicación</th>
                      <th style={styles.th}>Estado</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ejemplares.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>No hay ejemplares registrados</td></tr>
                    ) : (
                      ejemplares.map((ej) => (
                        <tr key={ej.id} style={styles.tr}>
                          <td style={styles.td}>#{ej.id}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{ej.libro?.titulo || 'Libro'}</td>
                          <td style={styles.td}><code>{ej.codigo_barras}</code></td>
                          <td style={styles.td}>{ej.ubicacion_estante || '—'}</td>
                          <td style={styles.td}>
                            <span style={{
                              ...styles.badge,
                              backgroundColor: ej.estado === 'disponible' ? '#10b981' : ej.estado === 'prestado' ? '#f59e0b' : '#ef4444'
                            }}>
                              {ej.estado.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleBorrarEjemplar(ej.id)}
                              style={styles.dangerButton}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 5. SECCIÓN: CATEGORÍAS (CRUD) */}
        {seccionActiva === 'categorias' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>➕ Nueva Categoría de Libros</h3>
              <form onSubmit={handleGuardarCategoria} style={styles.inlineForm}>
                <input
                  type="text"
                  placeholder="Nombre de la categoría (ej: Novela, Ciencia)"
                  value={formCat.nombre}
                  onChange={(e) => setFormCat({ ...formCat, nombre: e.target.value })}
                  required
                  style={{ ...styles.input, flex: 1 }}
                />
                <input
                  type="text"
                  placeholder="Descripción breve..."
                  value={formCat.descripcion}
                  onChange={(e) => setFormCat({ ...formCat, descripcion: e.target.value })}
                  style={{ ...styles.input, flex: 2 }}
                />
                <button type="submit" style={styles.primaryButton}>
                  Agregar Categoría
                </button>
              </form>
            </div>

            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>🏷️ Listado de Categorías</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>Descripción</th>
                      <th style={styles.th}>Libros Asociados</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categorias.length === 0 ? (
                      <tr><td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>No hay categorías registradas</td></tr>
                    ) : (
                      categorias.map((cat) => (
                        <tr key={cat.id} style={styles.tr}>
                          <td style={styles.td}>#{cat.id}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{cat.nombre}</td>
                          <td style={styles.td}>{cat.descripcion || '—'}</td>
                          <td style={styles.td}>{cat.libros ? cat.libros.length : 0} libros</td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleBorrarCategoria(cat.id)}
                              style={styles.dangerButton}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. SECCIÓN: EDITORIALES (CRUD) */}
        {seccionActiva === 'editoriales' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>➕ Nueva Casa Editorial</h3>
              <form onSubmit={handleGuardarEditorial} style={styles.gridForm}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Nombre Editorial</label>
                  <input
                    type="text"
                    value={formEdit.nombre}
                    onChange={(e) => setFormEdit({ ...formEdit, nombre: e.target.value })}
                    placeholder="Ej: Penguin Random House"
                    required
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>País</label>
                  <input
                    type="text"
                    value={formEdit.pais}
                    onChange={(e) => setFormEdit({ ...formEdit, pais: e.target.value })}
                    placeholder="Ej: España, México"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="text"
                    value={formEdit.telefono}
                    onChange={(e) => setFormEdit({ ...formEdit, telefono: e.target.value })}
                    placeholder="Ej: +52 55 1234 5678"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Sitio Web</label>
                  <input
                    type="text"
                    value={formEdit.sitio_web}
                    onChange={(e) => setFormEdit({ ...formEdit, sitio_web: e.target.value })}
                    placeholder="https://..."
                    style={styles.input}
                  />
                </div>

                <button type="submit" style={styles.primaryButton}>
                  Agregar Editorial
                </button>
              </form>
            </div>

            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>🏢 Listado de Editoriales</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>País</th>
                      <th style={styles.th}>Teléfono</th>
                      <th style={styles.th}>Sitio Web</th>
                      <th style={styles.th}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editoriales.length === 0 ? (
                      <tr><td colSpan="6" style={{ ...styles.td, textAlign: 'center' }}>No hay editoriales registradas</td></tr>
                    ) : (
                      editoriales.map((ed) => (
                        <tr key={ed.id} style={styles.tr}>
                          <td style={styles.td}>#{ed.id}</td>
                          <td style={{ ...styles.td, fontWeight: '600' }}>{ed.nombre}</td>
                          <td style={styles.td}>{ed.pais || '—'}</td>
                          <td style={styles.td}>{ed.telefono || '—'}</td>
                          <td style={styles.td}>{ed.sitio_web || '—'}</td>
                          <td style={styles.td}>
                            <button
                              onClick={() => handleBorrarEditorial(ed.id)}
                              style={styles.dangerButton}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 7. SECCIÓN: USUARIOS Y ROLES */}
        {seccionActiva === 'usuarios' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <h3 style={styles.cardTitle}>👥 Lista de Usuarios y sus Roles</h3>
              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Nombre</th>
                      <th style={styles.th}>Correo Electrónico</th>
                      <th style={styles.th}>Edad</th>
                      <th style={styles.th}>Rol</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usuarios.map((u) => (
                      <tr key={u.id} style={styles.tr}>
                        <td style={styles.td}>#{u.id}</td>
                        <td style={{ ...styles.td, fontWeight: '600' }}>{u.nombre}</td>
                        <td style={styles.td}>{u.correo}</td>
                        <td style={styles.td}>{u.edad ? `${u.edad} años` : '—'}</td>
                        <td style={styles.td}>
                          <span
                            style={{
                              ...styles.badge,
                              backgroundColor: u.rol?.nombre === 'admin' ? '#10b981' : '#3b82f6'
                            }}
                          >
                            {(u.rol?.nombre || 'sin rol').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. SECCIÓN: AUDITORÍA DE LIBROS */}
        {seccionActiva === 'auditoria' && (
          <div style={styles.sectionContainer}>
            <div style={styles.cardContainer}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>📜 Registro de Auditoría de Libros</h3>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    Trazabilidad de todas las creaciones, modificaciones y eliminaciones
                  </span>
                </div>

                {/* Filtros de acción y botón de recarga */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={cargarTodosLosDatos}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: '1px solid #94a3b8',
                      fontSize: '12px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      backgroundColor: '#f1f5f9',
                      color: '#1e293b'
                    }}
                  >
                    🔄 Recargar
                  </button>
                  {['TODAS', 'CREAR', 'ACTUALIZAR', 'ELIMINAR'].map((acc) => (
                    <button
                      key={acc}
                      onClick={() => setFiltroAudit(acc)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        backgroundColor: filtroAudit === acc ? '#3b82f6' : '#ffffff',
                        color: filtroAudit === acc ? '#ffffff' : '#475569'
                      }}
                    >
                      {acc}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.tableResponsive}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>ID</th>
                      <th style={styles.th}>Fecha y Hora</th>
                      <th style={styles.th}>Acción</th>
                      <th style={styles.th}>Usuario Responsable</th>
                      <th style={styles.th}>Libro Afectado</th>
                      <th style={styles.th}>Descripción del Cambio</th>
                      <th style={styles.th}>IP</th>
                      <th style={styles.th}>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditorias
                      .filter((a) => filtroAudit === 'TODAS' || a.accion === filtroAudit)
                      .length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ ...styles.td, textAlign: 'center', padding: '24px' }}>
                          No hay registros de auditoría para este filtro
                        </td>
                      </tr>
                    ) : (
                      auditorias
                        .filter((a) => filtroAudit === 'TODAS' || a.accion === filtroAudit)
                        .map((a) => {
                          let badgeBg = '#10b981'; // CREAR
                          if (a.accion === 'ACTUALIZAR') badgeBg = '#f59e0b';
                          if (a.accion === 'ELIMINAR') badgeBg = '#ef4444';

                          return (
                            <tr key={a.id} style={styles.tr}>
                              <td style={styles.td}>#{a.id}</td>
                              <td style={{ ...styles.td, whiteSpace: 'nowrap', fontSize: '12px' }}>
                                {new Date(a.createdAt).toLocaleString()}
                              </td>
                              <td style={styles.td}>
                                <span style={{ ...styles.badge, backgroundColor: badgeBg }}>
                                  {a.accion}
                                </span>
                              </td>
                              <td style={{ ...styles.td, fontWeight: '500' }}>
                                {a.usuario ? (
                                  <div>
                                    <div>{a.usuario.nombre}</div>
                                    <small style={{ color: '#64748b' }}>{a.usuario.correo}</small>
                                  </div>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Sistema / Anónimo</span>
                                )}
                              </td>
                              <td style={styles.td}>
                                {a.libro ? (
                                  <strong>{a.libro.titulo}</strong>
                                ) : (
                                  <span style={{ color: '#64748b' }}>Libro ID #{a.libroId || 'N/A'}</span>
                                )}
                              </td>
                              <td style={{ ...styles.td, fontSize: '12px' }}>
                                {a.descripcion_cambio || '—'}
                              </td>
                              <td style={{ ...styles.td, fontSize: '11px', color: '#64748b' }}>
                                {a.ip_origen || '127.0.0.1'}
                              </td>
                              <td style={styles.td}>
                                <button
                                  onClick={() => setDetalleAuditModal(a)}
                                  style={{
                                    padding: '4px 8px',
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🔍 Ver JSON
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 8. SECCIÓN: REPORTERÍA DIARIA (IA CON CLAUDE SONNET 5.5) */}
        {seccionActiva === 'reportes' && (
          <div style={styles.sectionContainer}>
            {/* Cabecera explicativa del agente */}
            <div style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
              color: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(49, 46, 129, 0.15)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
                <span style={{ fontSize: '28px' }}>🤖📑</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                    Agente Autónomo de Reportería Diaria (Claude Sonnet 5.5)
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#c7d2fe' }}>
                    Analiza los movimientos de libros (creaciones y eliminaciones) del día, redacta la narrativa ejecutiva y compila el PDF nativo en el sandbox de Anthropic usando Python ReportLab.
                  </p>
                </div>
              </div>
            </div>

            {/* Banner de Estado del Cron Job (Automático cada 2 minutos) */}
            <div style={{
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              borderRadius: '10px',
              padding: '12px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              fontSize: '13px',
              color: '#334155'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: estadoCron?.enEjecucion ? '#f59e0b' : (estadoCron?.activo ? '#10b981' : '#94a3b8'),
                  boxShadow: estadoCron?.enEjecucion ? '0 0 8px #f59e0b' : '0 0 6px #10b981'
                }} />
                <span>
                  <strong>Cron Job Activo (cada 10 min):</strong>{' '}
                  {estadoCron?.enEjecucion
                    ? '⏳ Ejecutando generación automática en este momento...'
                    : `🟢 En espera activa • Total automáticos generados: ${estadoCron?.totalGenerados || 0}`}
                </span>
              </div>

              {estadoCron?.ultimoReporte && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ color: '#64748b' }}>Último: {estadoCron.ultimoReporte.horaGeneracion}</span>
                  <button
                    type="button"
                    onClick={() => setResultadoReporte(estadoCron.ultimoReporte)}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#0f172a',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Ver Último Auto
                  </button>
                </div>
              )}
            </div>

            {/* Barra de control: Selección de fecha y disparo del agente */}
            <div style={{
              backgroundColor: '#ffffff',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>
                  📅 Fecha del Reporte:
                </label>
                <input
                  type="date"
                  value={fechaReporte}
                  onChange={(e) => setFechaReporte(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const hoy = new Date();
                    const y = hoy.getFullYear();
                    const m = String(hoy.getMonth() + 1).padStart(2, '0');
                    const d = String(hoy.getDate()).padStart(2, '0');
                    setFechaReporte(`${y}-${m}-${d}`);
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    backgroundColor: '#f8fafc',
                    color: '#475569',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Hoy
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  disabled={generandoReporte}
                  onClick={async () => {
                    setGenerandoReporte(true);
                    setResultadoReporte(null);
                    try {
                      const res = await generarReporteDiario(fechaReporte);
                      setResultadoReporte(res.data);
                      mostrarMensaje('Reporte diario y PDF generados con éxito por Claude Sonnet 5.5');
                    } catch (err) {
                      alert('Error al generar reporte: ' + err.message);
                    } finally {
                      setGenerandoReporte(false);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    backgroundColor: generandoReporte ? '#94a3b8' : '#4f46e5',
                    color: '#ffffff',
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: generandoReporte ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(79, 70, 229, 0.25)',
                    transition: 'background-color 0.2s'
                  }}
                >
                  {generandoReporte ? (
                    <>⏳ Claude Sonnet 5.5 analizando y generando PDF...</>
                  ) : (
                    <>✨ Generar Reporte de Fecha Seleccionada</>
                  )}
                </button>
              </div>
            </div>

            {/* Spinner o estado de carga */}
            {generandoReporte && (
              <div style={{
                backgroundColor: '#ffffff',
                padding: '40px 20px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                textAlign: 'center',
                color: '#475569'
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚙️</div>
                <h3 style={{ margin: '0 0 6px 0', color: '#1e293b' }}>Claude Sonnet 5.5 está trabajando...</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#64748b', maxWidth: '500px', marginInline: 'auto' }}>
                  El agente está consultando los registros de auditoría de la base de datos, redactando el análisis institucional y ejecutando un entorno Python aislado para renderizar tu documento PDF.
                </p>
              </div>
            )}

            {/* Resultados y Descarga de PDF */}
            {resultadoReporte && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Banner de descarga de PDF */}
                <div style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '12px',
                  padding: '18px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      backgroundColor: '#22c55e',
                      color: '#ffffff',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '20px'
                    }}>
                      📄
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', color: '#166534' }}>
                        ¡Archivo PDF generado y compilado exitosamente!
                      </h4>
                      <span style={{ fontSize: '13px', color: '#15803d' }}>
                        Archivo: <strong>{resultadoReporte.nombreArchivo}</strong> • Generado en el sandbox de Claude
                      </span>
                    </div>
                  </div>

                  {resultadoReporte.fileId && (
                    <button
                      type="button"
                      onClick={() => descargarReportePDF(resultadoReporte.fileId, resultadoReporte.nombreArchivo)}
                      style={{
                        backgroundColor: '#16a34a',
                        color: '#ffffff',
                        padding: '10px 22px',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '14px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)'
                      }}
                    >
                      ⬇️ Descargar PDF Oficial
                    </button>
                  )}
                </div>

                {/* Métricas rápidas del día */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>FECHA EVALUADA</div>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginTop: '4px' }}>
                      {resultadoReporte.fechaLegible}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>LIBROS AGREGADOS</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a', marginTop: '4px' }}>
                      {resultadoReporte.totalAgregados}
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#ffffff', padding: '16px', borderRadius: '10px', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: '600' }}>LIBROS ELIMINADOS</div>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: '#dc2626', marginTop: '4px' }}>
                      {resultadoReporte.totalEliminados}
                    </div>
                  </div>
                </div>

                {/* Vista previa del informe narrativo */}
                <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📝</span> Narrativa y Resumen Generado por el Agente
                  </h3>
                  <div style={{
                    backgroundColor: '#f8fafc',
                    padding: '18px 20px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    fontSize: '14px',
                    lineHeight: '1.7',
                    color: '#334155',
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {resultadoReporte.resumenTexto}
                  </div>
                </div>

                {/* Tablas de libros agregados y eliminados */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                  {/* Agregados */}
                  <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#16a34a', fontSize: '15px' }}>
                      📗 Libros Agregados Hoy ({resultadoReporte.agregados?.length || 0})
                    </h4>
                    {resultadoReporte.agregados && resultadoReporte.agregados.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {resultadoReporte.agregados.map((item, idx) => (
                          <li key={idx}>
                            <strong>{item.titulo}</strong> (ISBN: {item.isbn}) • <span style={{ color: '#64748b' }}>{item.hora} hrs por {item.usuario}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No se registraron nuevos libros en esta fecha.
                      </p>
                    )}
                  </div>

                  {/* Eliminados */}
                  <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#dc2626', fontSize: '15px' }}>
                      📕 Libros Eliminados Hoy ({resultadoReporte.eliminados?.length || 0})
                    </h4>
                    {resultadoReporte.eliminados && resultadoReporte.eliminados.length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#334155', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {resultadoReporte.eliminados.map((item, idx) => (
                          <li key={idx}>
                            <strong>{item.titulo}</strong> (ISBN: {item.isbn}) • <span style={{ color: '#64748b' }}>{item.hora} hrs por {item.usuario}</span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', fontStyle: 'italic' }}>
                        No se registraron bajas o eliminaciones en esta fecha.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. SECCIÓN: CRUD DE ASOCIADOS & AGENTE STOCK (SOLO ADMIN) */}
        {seccionActiva === 'asociados' && usuario?.rol === 'admin' && (
          <div style={styles.sectionContainer}>
            {/* Banner explicativo del rol de los asociados y el agente */}
            <div style={{
              background: 'linear-gradient(135deg, #0f766e 0%, #115e59 100%)',
              color: '#ffffff',
              padding: '24px',
              borderRadius: '12px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(15, 118, 110, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ fontSize: '30px' }}>🤝📢</span>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>
                      Asociados de la Empresa & Monitoreo Crítico con Claude
                    </h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#ccfbf1' }}>
                      Contactos y entidades aliadas. <strong>No tienen credenciales de acceso al sistema</strong>; cuando el Agente IA detecta que la biblioteca se queda sin libros, les envía una convocatoria formal por correo.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={verificandoAlertaStock}
                  onClick={async () => {
                    setVerificandoAlertaStock(true);
                    try {
                      const res = await verificarAlertaStock();
                      if (res.notificacionEnviada) {
                        alert(`🚨 ALERTA ENVIADA:\nSe enviaron correos a ${res.destinatarios.length} asociados.\nAsunto: ${res.asunto}`);
                        mostrarMensaje(`Alerta enviada a asociados: ${res.destinatarios.join(', ')}`);
                      } else {
                        alert(res.mensaje || 'El inventario cuenta con libros suficientes. No se envió alerta.');
                      }
                    } catch (err) {
                      alert('Error al verificar: ' + err.message);
                    } finally {
                      setVerificandoAlertaStock(false);
                    }
                  }}
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '13px',
                    cursor: verificandoAlertaStock ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)'
                  }}
                >
                  {verificandoAlertaStock ? '⏳ Verificando con Agente...' : '🔍 Evaluar Stock con Agente IA'}
                </button>
              </div>
            </div>

            {/* Layout a dos columnas: Formulario y Tabla */}
            <div style={styles.gridContainer}>
              {/* Formulario de Registro / Edición */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>
                  {asociadoEditando ? '✏️ Editar Asociado' : '➕ Registrar Nuevo Asociado'}
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      if (asociadoEditando) {
                        await actualizarAsociado(asociadoEditando.id, formAsoc);
                        mostrarMensaje('Asociado actualizado exitosamente');
                        setAsociadoEditando(null);
                      } else {
                        await crearAsociado(formAsoc);
                        mostrarMensaje('Asociado registrado exitosamente');
                      }
                      setFormAsoc({ nombre: '', correo: '', telefono: '', empresa: '', activo: true });
                      const lista = await obtenerAsociados();
                      setAsociados(lista);
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  style={styles.form}
                >
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre Completo / Razón Social *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Lic. Carlos Fuentes / Editorial Alfa"
                      value={formAsoc.nombre}
                      onChange={(e) => setFormAsoc({ ...formAsoc, nombre: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Correo Electrónico (Notificaciones) *</label>
                    <input
                      type="email"
                      required
                      placeholder="asociado@empresa.com"
                      value={formAsoc.correo}
                      onChange={(e) => setFormAsoc({ ...formAsoc, correo: e.target.value })}
                      style={styles.input}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Teléfono</label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={formAsoc.telefono || ''}
                        onChange={(e) => setFormAsoc({ ...formAsoc, telefono: e.target.value })}
                        style={styles.input}
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Empresa / Entidad</label>
                      <input
                        type="text"
                        placeholder="Opcional"
                        value={formAsoc.empresa || ''}
                        onChange={(e) => setFormAsoc({ ...formAsoc, empresa: e.target.value })}
                        style={styles.input}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0' }}>
                    <input
                      type="checkbox"
                      id="asocActivo"
                      checked={formAsoc.activo}
                      onChange={(e) => setFormAsoc({ ...formAsoc, activo: e.target.checked })}
                    />
                    <label htmlFor="asocActivo" style={{ fontSize: '13px', color: '#475569', cursor: 'pointer' }}>
                      Asociado Activo (Recibe alertas del Agente IA)
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" style={styles.buttonPrimary}>
                      {asociadoEditando ? 'Guardar Cambios' : 'Registrar Asociado'}
                    </button>
                    {asociadoEditando && (
                      <button
                        type="button"
                        onClick={() => {
                          setAsociadoEditando(null);
                          setFormAsoc({ nombre: '', correo: '', telefono: '', empresa: '', activo: true });
                        }}
                        style={styles.buttonSecondary}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Tabla de Asociados */}
              <div style={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <h3 style={styles.cardTitle}>Directorio de Asociados ({asociados.length})</h3>
                  <span style={{ fontSize: '12px', color: '#64748b' }}>
                    Solo datos de contacto (Sin login)
                  </span>
                </div>

                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Nombre</th>
                        <th style={styles.th}>Correo Electrónico</th>
                        <th style={styles.th}>Empresa</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {asociados.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ ...styles.td, textAlign: 'center', color: '#94a3b8', padding: '24px' }}>
                            No hay asociados registrados. Agrega uno con el formulario.
                          </td>
                        </tr>
                      ) : (
                        asociados.map((item) => (
                          <tr key={item.id}>
                            <td style={styles.td}>
                              <strong>{item.nombre}</strong>
                              {item.telefono && (
                                <div style={{ fontSize: '11px', color: '#64748b' }}>📞 {item.telefono}</div>
                              )}
                            </td>
                            <td style={styles.td}>
                              <a href={`mailto:${item.correo}`} style={{ color: '#0284c7', textDecoration: 'none' }}>
                                ✉️ {item.correo}
                              </a>
                            </td>
                            <td style={styles.td}>{item.empresa || '-'}</td>
                            <td style={styles.td}>
                              <span style={{
                                padding: '3px 8px',
                                borderRadius: '12px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: item.activo ? '#dcfce7' : '#fee2e2',
                                color: item.activo ? '#166534' : '#991b1b'
                              }}>
                                {item.activo ? 'ACTIVO' : 'INACTIVO'}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div style={{ display: 'flex', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setAsociadoEditando(item);
                                    setFormAsoc({
                                      nombre: item.nombre,
                                      correo: item.correo,
                                      telefono: item.telefono || '',
                                      empresa: item.empresa || '',
                                      activo: item.activo
                                    });
                                  }}
                                  style={{
                                    backgroundColor: '#f1f5f9',
                                    border: '1px solid #cbd5e1',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  ✏️
                                </button>
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`¿Eliminar al asociado ${item.nombre}?`)) {
                                      try {
                                        await eliminarAsociado(item.id);
                                        mostrarMensaje('Asociado eliminado');
                                        const lista = await obtenerAsociados();
                                        setAsociados(lista);
                                      } catch (err) {
                                        alert(err.message);
                                      }
                                    }
                                  }}
                                  style={{
                                    backgroundColor: '#fee2e2',
                                    color: '#dc2626',
                                    border: '1px solid #fecaca',
                                    borderRadius: '4px',
                                    padding: '4px 8px',
                                    fontSize: '12px',
                                    cursor: 'pointer'
                                  }}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. SECCIÓN: ASISTENTE IA */}
        {seccionActiva === 'ia' && (
          <div style={{ maxWidth: '650px', margin: '0 auto' }}>
            <ChatLibros />
          </div>
        )}

        {/* Modal de Detalle de Auditoría */}
        {detalleAuditModal && (
          <div style={styles.modalOverlay}>
            <div style={styles.modalContent}>
              <div style={styles.modalHeader}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>
                  Detalle de Auditoría #{detalleAuditModal.id} — Acción: {detalleAuditModal.accion}
                </h3>
                <button
                  onClick={() => setDetalleAuditModal(null)}
                  style={styles.modalCloseButton}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <strong>Descripción: </strong> {detalleAuditModal.descripcion_cambio}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#dc2626' }}>
                      ⏪ Valores Anteriores:
                    </h4>
                    <pre style={styles.jsonBox}>
                      {detalleAuditModal.valores_anteriores
                        ? JSON.stringify(detalleAuditModal.valores_anteriores, null, 2)
                        : '(Ninguno / Creación inicial)'}
                    </pre>
                  </div>

                  <div>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#16a34a' }}>
                      ⏩ Valores Nuevos:
                    </h4>
                    <pre style={styles.jsonBox}>
                      {detalleAuditModal.valores_nuevos
                        ? JSON.stringify(detalleAuditModal.valores_nuevos, null, 2)
                        : '(Ninguno / Eliminado)'}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  layout: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  mainContent: {
    flex: 1,
    padding: '28px 36px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },
  topbar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e2e8f0'
  },
  pageTitle: {
    margin: 0,
    fontSize: '24px',
    color: '#0f172a',
    fontWeight: '700'
  },
  pageSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#64748b'
  },
  badgeAdmin: {
    backgroundColor: '#ecfdf5',
    color: '#047857',
    border: '1px solid #a7f3d0',
    padding: '6px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  toastSuccess: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '20px',
    fontSize: '13px',
    fontWeight: '600'
  },
  sectionContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '22px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '18px'
  },
  statCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0'
  },
  statIcon: {
    fontSize: '28px'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '22px',
    color: '#1e293b',
    fontWeight: '700',
    marginTop: '2px'
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '22px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
    border: '1px solid #e2e8f0'
  },
  cardTitle: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#1e293b',
    fontWeight: '600'
  },
  tableResponsive: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '13px'
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    padding: '11px 13px',
    fontWeight: '600',
    borderBottom: '1px solid #e2e8f0'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '11px 13px',
    color: '#334155'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700'
  },
  gridForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '14px',
    alignItems: 'flex-end'
  },
  inlineForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#475569'
  },
  input: {
    padding: '9px 12px',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '13px',
    outline: 'none',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  },
  primaryButton: {
    padding: '10px 18px',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    height: '38px',
    transition: 'background-color 0.15s'
  },
  actionButton: {
    padding: '5px 10px',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  dangerButton: {
    padding: '5px 10px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  dualSection: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '24px',
    alignItems: 'start',
    width: '100%',
    maxWidth: '1280px',
    margin: '0 auto'
  },
  dualCol: {
    width: '100%',
    display: 'flex',
    justifyContent: 'center'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    maxWidth: '750px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    padding: '16px 20px',
    borderBottom: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  modalCloseButton: {
    background: 'none',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    color: '#64748b'
  },
  jsonBox: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '6px',
    padding: '10px',
    fontSize: '11px',
    fontFamily: 'monospace',
    maxHeight: '280px',
    overflowY: 'auto',
    margin: 0
  }
};
