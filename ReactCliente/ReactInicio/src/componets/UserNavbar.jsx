export default function UserNavbar({ tabActiva, setTabActiva, usuario, onCerrarSesion, totalPrestamosActivos = 0 }) {
  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: '🏠' },
    { id: 'catalogo', label: 'Explorar Catálogo', icon: '📚' },
    { id: 'prestamos', label: 'Mis Préstamos', icon: '🔄', badge: totalPrestamosActivos > 0 ? totalPrestamosActivos : null },
    { id: 'reservas', label: 'Mis Reservas', icon: '🔖' },
    { id: 'ia', label: 'Asistente IA (Claude)', icon: '🤖' }
  ];

  return (
    <header style={styles.navbar}>
      <div style={styles.navContainer}>
        {/* Marca / Logo */}
        <div style={styles.brand} onClick={() => setTabActiva('inicio')}>
          <div style={styles.logoIcon}>📚</div>
          <div>
            <span style={styles.brandTitle}>Biblioteca Digital</span>
            <span style={styles.brandSubtitle}>Portal del Lector</span>
          </div>
        </div>

        {/* Enlaces de Navegación */}
        <nav style={styles.navLinks}>
          {tabs.map((tab) => {
            const isActive = tabActiva === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTabActiva(tab.id)}
                style={{
                  ...styles.navButton,
                  ...(isActive ? styles.navButtonActive : {})
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                {tab.badge && (
                  <span style={styles.counterBadge}>{tab.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Perfil del Usuario y Salir */}
        <div style={styles.userSection}>
          <div style={styles.userInfo}>
            <div style={styles.avatar}>
              {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={styles.userDetails}>
              <span style={styles.userName}>{usuario?.nombre || 'Lector'}</span>
              <span style={styles.userRole}>LECTOR</span>
            </div>
          </div>

          <button onClick={onCerrarSesion} style={styles.logoutButton} title="Cerrar Sesión">
            Salir 🚪
          </button>
        </div>
      </div>
    </header>
  );
}

const styles = {
  navbar: {
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e2e8f0',
    position: 'sticky',
    top: 0,
    zIndex: 100,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
  },
  navContainer: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px',
    gap: '16px'
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    flexShrink: 0
  },
  logoIcon: {
    width: '38px',
    height: '38px',
    backgroundColor: '#0284c7',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#ffffff'
  },
  brandTitle: {
    display: 'block',
    fontSize: '16px',
    fontWeight: '700',
    color: '#0f172a'
  },
  brandSubtitle: {
    display: 'block',
    fontSize: '11px',
    color: '#64748b'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexWrap: 'nowrap',
    overflowX: 'auto'
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 14px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap'
  },
  navButtonActive: {
    backgroundColor: '#f0f9ff',
    color: '#0284c7',
    fontWeight: '600'
  },
  counterBadge: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '700',
    padding: '2px 6px',
    borderRadius: '10px'
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexShrink: 0
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '15px'
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column'
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1e293b'
  },
  userRole: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#059669',
    letterSpacing: '0.5px'
  },
  logoutButton: {
    padding: '7px 12px',
    borderRadius: '6px',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    color: '#ef4444',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s'
  }
};

