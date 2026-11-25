const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

// Rutas públicas de autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/roles', authController.obtenerRoles);

// Ruta protegida para consultar el perfil del usuario autenticado vía JWT
router.get('/perfil', verificarToken, (req, res) => {
  res.json({
    mensaje: 'Perfil obtenido exitosamente',
    usuario: req.usuario
  });
});

// Rutas protegidas para administración de usuarios (admin y bibliotecario pueden consultar el catálogo de usuarios)
router.get('/usuarios', verificarToken, requerirRol('admin', 'bibliotecario'), authController.obtenerUsuarios);

module.exports = router;
