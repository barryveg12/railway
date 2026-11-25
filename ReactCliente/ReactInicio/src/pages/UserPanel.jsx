import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import UserNavbar from '../componets/UserNavbar';
import ChatLibros from '../componets/chatLibros';
import { getUsuarioActual, logout } from '../services/authService';
import { obtenerLibros } from '../services/librosService';
import { obtenerCategorias } from '../services/adminService';
import {
  obtenerMisPrestamos,
  obtenerMisReservas,
  solicitarReserva,
  cancelarReserva
} from '../services/userService';

export default function UserPanel() {
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState(null);
  const [tabActiva, setTabActiva] = useState('inicio');

  const [libros, setLibros] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [misPrestamos, setMisPrestamos] = useState([]);
  const [misReservas, setMisReservas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // Filtros de búsqueda en catálogo
  const [busqueda, setBusqueda] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');

  // Notificaciones
  const [mensajeToast, setMensajeToast] = useState(null);

  useEffect(() => {
    const usuarioLogueado = getUsuarioActual();
    if (!usuarioLogueado) {
      navigate('/login');
      return;
    }
    setUsuario(usuarioLogueado);
    cargarDatos(usuarioLogueado.id);
  }, [navigate]);

  const cargarDatos = async (usuarioId) => {
    setCargando(true);
    try {
      const [librosData, catsData, prestamosData, reservasData] = await Promise.all([
        obtenerLibros().catch(() => []),
        obtenerCategorias().catch(() => []),
        obtenerMisPrestamos(usuarioId).catch(() => []),
        obtenerMisReservas(usuarioId).catch(() => [])
      ]);

      setLibros(Array.isArray(librosData) ? librosData : []);
      setCategorias(Array.isArray(catsData) ? catsData : []);
      setMisPrestamos(Array.isArray(prestamosData) ? prestamosData : []);
      setMisReservas(Array.isArray(reservasData) ? reservasData : []);
    } catch (err) {
      console.error('Error al cargar datos del usuario:', err);
    } finally {
      setCargando(false);
    }
  };

  const mostrarToast = (texto) => {
    setMensajeToast(texto);
    setTimeout(() => setMensajeToast(null), 4000);
  };

  const handleCerrarSesion = () => {
    logout();
    navigate('/login');
  };

  const handleReservar = async (libroId, titulo) => {
    try {
      await solicitarReserva(libroId, usuario.id);
      mostrarToast(`¡Reserva confirmada para "${titulo}"! Te avisaremos cuando haya un ejemplar.`);
      cargarDatos(usuario.id);
    } catch (err) {
      alert(err.message || 'Error al solicitar reserva');
    }
  };

  const handleCancelarReserva = async (reservaId) => {
    if (!window.confirm('¿Deseas cancelar esta reserva?')) return;
    try {
      await cancelarReserva(reservaId);
      mostrarToast('Reserva cancelada');
      cargarDatos(usuario.id);
    } catch (err) {
      alert(err.message || 'Error al cancelar reserva');
    }
  };

  // Cálculo de préstamos activos y multas
  const prestamosActivos = misPrestamos.filter((p) => p.estado === 'activo');
  const totalMultas = misPrestamos
    .filter((p) => p.multa && p.multa.estado_pago === 'pendiente')
    .reduce((acc, p) => acc + Number(p.multa.monto), 0);

  // Filtrado de libros en el catálogo
  const librosFiltrados = libros.filter((libro) => {
    const coincideTexto =
      libro.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
      (libro.isbn && libro.isbn.includes(busqueda)) ||
      (libro.descripcion && libro.descripcion.toLowerCase().includes(busqueda.toLowerCase()));

    const coincideCategoria =
      !filtroCategoria || String(libro.categoriaId || libro.categoria?.id) === String(filtroCategoria);

    return coincideTexto && coincideCategoria;
  });

  if (!usuario) return null;

  return (
    <div style={styles.page}>
      {/* Barra de Navegación Superior */}
      <UserNavbar
        tabActiva={tabActiva}
        setTabActiva={setTabActiva}
        usuario={usuario}
        onCerrarSesion={handleCerrarSesion}
        totalPrestamosActivos={prestamosActivos.length}
      />

      <main style={styles.container}>
        {mensajeToast && <div style={styles.toast}>{mensajeToast}</div>}

        {/* 1. SECCIÓN: INICIO / RESUMEN */}
        {tabActiva === 'inicio' && (
          <div style={styles.section}>
            {/* Banner de Bienvenida */}
            <div style={styles.welcomeBanner}>
              <div>
                <h2 style={styles.welcomeTitle}>¡Hola, {usuario.nombre}! 📖</h2>
                <p style={styles.welcomeText}>
                  Bienvenido a tu panel de lector. Aquí puedes explorar el catálogo, revisar tus libros prestados y consultar recomendaciones con nuestro Asistente de IA.
                </p>
              </div>
              <button onClick={() => setTabActiva('catalogo')} style={styles.bannerButton}>
                Explorar Catálogo →
              </button>
            </div>

            {/* Tarjetas de Resumen */}
            <div style={styles.kpiGrid}>
              <div style={styles.kpiCard}>
                <div style={styles.kpiIcon}>📖</div>
                <div>
                  <div style={styles.kpiLabel}>Libros en mi poder</div>
                  <div style={styles.kpiValue}>{prestamosActivos.length}</div>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIcon}>🔖</div>
                <div>
                  <div style={styles.kpiLabel}>Mis Reservas Activas</div>
                  <div style={styles.kpiValue}>{misReservas.filter((r) => r.estado === 'pendiente').length}</div>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIcon}>📚</div>
                <div>
                  <div style={styles.kpiLabel}>Títulos Disponibles</div>
                  <div style={styles.kpiValue}>{libros.length}</div>
                </div>
              </div>

              <div style={styles.kpiCard}>
                <div style={styles.kpiIcon}>⚠️</div>
                <div>
                  <div style={styles.kpiLabel}>Multas Pendientes</div>
                  <div style={{ ...styles.kpiValue, color: totalMultas > 0 ? '#ef4444' : '#10b981' }}>
                    ${totalMultas}
                  </div>
                </div>
              </div>
            </div>

            {/* Alertas de préstamos próximos a vencer */}
            {prestamosActivos.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.cardHeader}>⏰ Préstamos Actuales</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {prestamosActivos.map((p) => (
                    <div key={p.id} style={styles.loanRow}>
                      <div>
                        <strong>{p.ejemplar?.libro?.titulo || 'Libro'}</strong>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Copia: <code>{p.ejemplar?.codigo_barras}</code> | Retirado el {p.fecha_prestamo}
                        </div>
                      </div>
                      <div style={styles.deadlineBadge}>
                        Devolución: {p.fecha_devolucion_limite}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 2. SECCIÓN: EXPLORAR CATÁLOGO */}
        {tabActiva === 'catalogo' && (
          <div style={styles.section}>
            {/* Buscador y Filtros */}
            <div style={styles.filterBar}>
              <input
                type="text"
                placeholder="🔍 Buscar por título, autor, ISBN..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={styles.searchInput}
              />

              <select
                value={filtroCategoria}
                onChange={(e) => setFiltroCategoria(e.target.value)}
                style={styles.selectFilter}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                ))}
              </select>
            </div>

            {/* Grid de Libros */}
            {cargando ? (
              <p>Cargando libros...</p>
            ) : librosFiltrados.length === 0 ? (
              <div style={styles.emptyState}>
                No se encontraron libros con los filtros seleccionados.
              </div>
            ) : (
              <div style={styles.bookGrid}>
                {librosFiltrados.map((libro) => {
                  const copiasDisponibles = libro.ejemplares
                    ? libro.ejemplares.filter((e) => e.estado === 'disponible').length
                    : 0;

                  return (
                    <div key={libro.id} style={styles.bookCard}>
                      <div style={styles.bookHeader}>
                        <span style={styles.bookCategory}>
                          {libro.categoria?.nombre || 'General'}
                        </span>
                        {libro.isbn && <span style={styles.bookIsbn}>ISBN: {libro.isbn}</span>}
                      </div>

                      <h4 style={styles.bookTitle}>{libro.titulo}</h4>

                      {libro.autores && libro.autores.length > 0 && (
                        <div style={styles.bookAuthors}>
                          Por: {libro.autores.map((a) => a.nombre_autor || a.nombre).join(', ')}
                        </div>
                      )}

                      <p style={styles.bookDescription}>
                        {libro.descripcion || 'Sin descripción disponible.'}
                      </p>

                      <div style={styles.bookFooter}>
                        {copiasDisponibles > 0 ? (
                          <div style={styles.stockAvailable}>
                            🟢 {copiasDisponibles} copia(s) física(s) disponible(s)
                          </div>
                        ) : (
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <span style={styles.stockUnavailable}>🔴 Agotado</span>
                            <button
                              onClick={() => handleReservar(libro.id, libro.titulo)}
                              style={styles.reserveButton}
                            >
                              🔖 Reservar
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. SECCIÓN: MIS PRÉSTAMOS */}
        {tabActiva === 'prestamos' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <h3 style={styles.cardHeader}>🔄 Mis Préstamos en la Biblioteca</h3>
              {misPrestamos.length === 0 ? (
                <div style={styles.emptyState}>No tienes préstamos registrados actualmente.</div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Libro</th>
                        <th style={styles.th}>Ejemplar</th>
                        <th style={styles.th}>Fecha Retiro</th>
                        <th style={styles.th}>Límite Devolución</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Multa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misPrestamos.map((p) => (
                        <tr key={p.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '600' }}>
                            {p.ejemplar?.libro?.titulo || 'Libro'}
                          </td>
                          <td style={styles.td}><code>{p.ejemplar?.codigo_barras}</code></td>
                          <td style={styles.td}>{p.fecha_prestamo}</td>
                          <td style={styles.td}>{p.fecha_devolucion_limite}</td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                backgroundColor: p.estado === 'activo' ? '#f59e0b' : '#10b981'
                              }}
                            >
                              {p.estado.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {p.multa ? (
                              <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                ${p.multa.monto} ({p.multa.estado_pago})
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4. SECCIÓN: MIS RESERVAS */}
        {tabActiva === 'reservas' && (
          <div style={styles.section}>
            <div style={styles.card}>
              <h3 style={styles.cardHeader}>🔖 Mis Reservas de Libros</h3>
              {misReservas.length === 0 ? (
                <div style={styles.emptyState}>No tienes reservas activas en este momento.</div>
              ) : (
                <div style={styles.tableResponsive}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>Libro Solicitado</th>
                        <th style={styles.th}>Fecha de Solicitud</th>
                        <th style={styles.th}>Estado</th>
                        <th style={styles.th}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {misReservas.map((r) => (
                        <tr key={r.id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '600' }}>
                            {r.libro?.titulo || 'Libro'}
                          </td>
                          <td style={styles.td}>
                            {new Date(r.fecha_reserva || r.createdAt).toLocaleDateString()}
                          </td>
                          <td style={styles.td}>
                            <span
                              style={{
                                ...styles.badge,
                                backgroundColor: r.estado === 'pendiente' ? '#3b82f6' : r.estado === 'completada' ? '#10b981' : '#64748b'
                              }}
                            >
                              {r.estado.toUpperCase()}
                            </span>
                          </td>
                          <td style={styles.td}>
                            {r.estado === 'pendiente' && (
                              <button
                                onClick={() => handleCancelarReserva(r.id)}
                                style={styles.cancelButton}
                              >
                                Cancelar
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. SECCIÓN: ASISTENTE IA (CLAUDE) */}
        {tabActiva === 'ia' && (
          <div style={{ maxWidth: '650px', margin: '0 auto' }}>
            <ChatLibros />
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f8fafc',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '30px 24px',
    boxSizing: 'border-box'
  },
  section: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  welcomeBanner: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderRadius: '16px',
    padding: '28px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
    boxShadow: '0 10px 15px -3px rgba(2, 132, 199, 0.2)'
  },
  welcomeTitle: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    fontWeight: '700'
  },
  welcomeText: {
    margin: 0,
    fontSize: '14px',
    color: '#e0f2fe',
    maxWidth: '600px',
    lineHeight: '1.5'
  },
  bannerButton: {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    color: '#0284c7',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'transform 0.15s ease'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px'
  },
  kpiCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
  },
  kpiIcon: {
    fontSize: '28px'
  },
  kpiLabel: {
    fontSize: '12px',
    color: '#64748b',
    fontWeight: '500'
  },
  kpiValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#0f172a',
    marginTop: '2px'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
  },
  cardHeader: {
    margin: '0 0 16px 0',
    fontSize: '16px',
    color: '#0f172a'
  },
  loanRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 14px',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e2e8f0'
  },
  deadlineBadge: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: '12px',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '6px'
  },
  filterBar: {
    display: 'flex',
    gap: '14px',
    flexWrap: 'wrap'
  },
  searchInput: {
    flex: 1,
    minWidth: '240px',
    padding: '11px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff'
  },
  selectFilter: {
    padding: '11px 16px',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  bookGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px'
  },
  bookCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.03)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  bookHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  bookCategory: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#0284c7',
    backgroundColor: '#e0f2fe',
    padding: '3px 8px',
    borderRadius: '4px'
  },
  bookIsbn: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  bookTitle: {
    margin: '0 0 6px 0',
    fontSize: '17px',
    fontWeight: '700',
    color: '#0f172a'
  },
  bookAuthors: {
    fontSize: '12px',
    color: '#64748b',
    marginBottom: '10px'
  },
  bookDescription: {
    fontSize: '13px',
    color: '#475569',
    lineHeight: '1.5',
    flex: 1,
    margin: '0 0 16px 0',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden'
  },
  bookFooter: {
    borderTop: '1px solid #f1f5f9',
    paddingTop: '14px'
  },
  stockAvailable: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#16a34a'
  },
  stockUnavailable: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#dc2626'
  },
  reserveButton: {
    padding: '6px 12px',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  tableResponsive: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
    textAlign: 'left'
  },
  th: {
    backgroundColor: '#f8fafc',
    color: '#475569',
    padding: '11px 14px',
    borderBottom: '1px solid #e2e8f0',
    fontWeight: '600'
  },
  tr: {
    borderBottom: '1px solid #f1f5f9'
  },
  td: {
    padding: '12px 14px',
    color: '#334155'
  },
  badge: {
    padding: '3px 8px',
    borderRadius: '4px',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700'
  },
  cancelButton: {
    padding: '4px 8px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    border: '1px solid #fca5a5',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  toast: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    border: '1px solid #86efac',
    borderRadius: '8px',
    padding: '10px 16px',
    marginBottom: '16px',
    fontSize: '13px',
    fontWeight: '600'
  },
  emptyState: {
    padding: '30px',
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '14px'
  }
};

