const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt_biblioteca_2026';

/**
 * Middleware para verificar si la petición incluye un token JWT válido
 * Espera cabecera: Authorization: Bearer <token>
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];

  if (!authHeader) {
    return res.status(401).json({
      mensaje: 'Acceso denegado: No se proporcionó el token de autenticación (Bearer token)'
    });
  }

  // Soporta formato "Bearer <token>" o token directo
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();

  if (!token) {
    return res.status(401).json({
      mensaje: 'Acceso denegado: Token vacío o formato incorrecto'
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    // Inyectar el usuario autenticado en el objeto request
    req.usuario = payload;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        mensaje: 'Sesión expirada: El token ha caducado. Inicia sesión nuevamente.',
        expirado: true
      });
    }
    return res.status(403).json({
      mensaje: 'Token inválido o corrupto',
      error: error.message
    });
  }
};

/**
 * Middleware opcional: si viene un token válido lo decodifica en req.usuario,
 * pero no bloquea si la ruta es pública.
 */
const extraerTokenOpcional = (req, res, next) => {
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : authHeader.trim();
    if (token) {
      try {
        req.usuario = jwt.verify(token, JWT_SECRET);
      } catch {
        // Ignorar si el token es inválido en rutas públicas
      }
    }
  }
  next();
};

/**
 * Middleware para restringir por roles específicos
 * @param  {...string} rolesPermitidos - Ej: 'admin', 'bibliotecario'
 */
const requerirRol = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ mensaje: 'No autenticado' });
    }

    const rolUsuario = (req.usuario.rol || '').toLowerCase();
    const permitido = rolesPermitidos.some(r => r.toLowerCase() === rolUsuario);

    if (!permitido) {
      return res.status(403).json({
        mensaje: `Acceso restringido: Se requiere uno de los siguientes roles: [${rolesPermitidos.join(', ')}]. Tu rol actual es: ${rolUsuario || 'ninguno'}`
      });
    }

    next();
  };
};

module.exports = {
  verificarToken,
  extraerTokenOpcional,
  requerirRol
};

