import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Admin from '../pages/Admin';
import UserPanel from '../pages/UserPanel';
import Libros from '../pages/Libros';
import { getUsuarioActual } from '../services/authService';

// Guardia de ruta para Administrador o Bibliotecario
function RutaAdmin({ children }) {
  const usuario = getUsuarioActual();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (usuario.rol !== 'admin' && usuario.rol !== 'bibliotecario') {
    return <Navigate to="/panel" replace />;
  }
  return children;
}

// Guardia de ruta para Usuario estándar
function RutaUsuario({ children }) {
  const usuario = getUsuarioActual();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Redirección inteligente según el rol al ingresar a '/'
function RutaInicio() {
  const usuario = getUsuarioActual();
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  if (usuario.rol === 'admin' || usuario.rol === 'bibliotecario') {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/panel" replace />;
}

export default function Routing() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta base con redirección inteligente según sesión */}
        <Route path="/" element={<RutaInicio />} />

        {/* Autenticación */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Panel de Usuario Lector (con Navbar) */}
        <Route
          path="/panel"
          element={
            <RutaUsuario>
              <UserPanel />
            </RutaUsuario>
          }
        />

        {/* Panel de Administración protegido (con Sidebar) */}
        <Route
          path="/admin"
          element={
            <RutaAdmin>
              <Admin />
            </RutaAdmin>
          }
        />

        {/* Ruta de registro de libros pública */}
        <Route path="/libros" element={<Libros />} />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
