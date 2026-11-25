export default function Sidebar({ seccionActiva, setSeccionActiva, usuario, onCerrarSesion }) {
  const esAdmin = usuario?.rol === 'admin';

  const menuGrupos = [
    {
      titulo: 'GENERAL',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'libros', label: 'Gestión de Libros', icon: '📖' }
      ]
    },
    {
      titulo: 'OPERACIONES',
      items: [
        { id: 'prestamos', label: 'Préstamos y Devoluciones', icon: '🔄' },
        { id: 'ejemplares', label: 'Ejemplares Físicos', icon: '📦' }
      ]
    },
    {
      titulo: 'CATÁLOGO',
      items: [
        { id: 'categorias', label: 'Categorías', icon: '🏷️' },
        { id: 'editoriales', label: 'Editoriales', icon: '🏢' }
      ]
    },
    {
      titulo: 'SISTEMA & REPORTES',
      items: [
        { id: 'reportes', label: 'Reportes Diarios (IA)', icon: '📑' },
        // Solo administradores pueden ver y consultar asociados
        ...(esAdmin ? [{ id: 'asociados', label: 'Asociados y Aliados', icon: '🤝' }] : []),
        { id: 'usuarios', label: 'Usuarios y Roles', icon: '👥' },
        { id: 'auditoria', label: 'Auditoría de Libros', icon: '📜' },
        { id: 'ia', label: 'Asistente IA (Claude)', icon: '🤖' }
      ]
    }
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Cabecera / Marca */}
      <div style={styles.brand}>
        <div style={styles.logoBadge}>📚</div>
        <div>
          <h2 style={styles.brandTitle}>AdminPanel</h2>
          <span style={styles.brandSubtitle}>Sistema de Biblioteca</span>
        </div>
      </div>

      {/* Menú de Navegación con Grupos */}
      <nav style={styles.nav}>
        {menuGrupos.map((grupo, gIdx) => (
          <div key={gIdx} style={styles.groupContainer}>
            <div style={styles.navSectionTitle}>{grupo.titulo}</div>
            {grupo.items.map((item) => {
              const isActive = seccionActiva === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSeccionActiva(item.id)}
                  style={{
                    ...styles.navItem,
                    ...(isActive ? styles.navItemActive : {})
                  }}
                >
                  <span style={styles.itemIcon}>{item.icon}</span>
                  <span style={styles.itemLabel}>{item.label}</span>
                  {isActive && <div style={styles.activeIndicator} />}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Perfil del Usuario y Logout */}
      <div style={styles.footer}>
        <div style={styles.userCard}>
          <div style={styles.avatar}>
            {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : 'A'}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{usuario?.nombre || 'Administrador'}</div>
            <div style={styles.userEmail}>{usuario?.correo || 'admin@admin.com'}</div>
            <span style={styles.roleBadge}>
              {usuario?.rol ? usuario.rol.toUpperCase() : 'ADMIN'}
            </span>
          </div>
        </div>

        <button onClick={onCerrarSesion} style={styles.logoutButton}>
          🚪 Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    position: 'sticky',
    top: 0,
    boxShadow: '4px 0 15px rgba(0, 0, 0, 0.25)',
    boxSizing: 'border-box',
    borderRight: '1px solid #1e293b'
  },
  brand: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },
  logoBadge: {
    width: '40px',
    height: '40px',
    backgroundColor: '#4f46e5',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px'
  },
  brandTitle: {
    margin: 0,
    fontSize: '17px',
    fontWeight: '700',
    letterSpacing: '0.5px'
  },
  brandSubtitle: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    overflowY: 'auto'
  },
  groupContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  navSectionTitle: {
    fontSize: '10px',
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: '0.9px',
    padding: '4px 10px 6px 10px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    textAlign: 'left',
    transition: 'all 0.15s ease',
    position: 'relative'
  },
  navItemActive: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontWeight: '600'
  },
  activeIndicator: {
    position: 'absolute',
    right: 0,
    top: '15%',
    bottom: '15%',
    width: '3px',
    backgroundColor: '#60a5fa',
    borderRadius: '4px 0 0 4px'
  },
  itemIcon: {
    fontSize: '16px'
  },
  itemLabel: {
    flex: 1
  },
  footer: {
    padding: '16px',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    backgroundColor: '#090d16',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  userCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#4f46e5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '15px',
    color: '#ffffff',
    flexShrink: 0
  },
  userInfo: {
    overflow: 'hidden'
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  userEmail: {
    fontSize: '11px',
    color: '#64748b',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  roleBadge: {
    display: 'inline-block',
    marginTop: '2px',
    fontSize: '9px',
    fontWeight: '700',
    padding: '2px 5px',
    backgroundColor: '#059669',
    color: '#ffffff',
    borderRadius: '4px'
  },
  logoutButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    color: '#f87171',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px'
  }
};
