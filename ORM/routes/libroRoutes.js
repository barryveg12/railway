const express = require('express');
const router = express.Router();
const libroController = require('../controllers/libroController');
const { verificarToken, requerirRol, extraerTokenOpcional } = require('../middlewares/authMiddleware');

// Rutas de Libros
// Lectura pública o con token opcional
router.get('/', extraerTokenOpcional, libroController.obtenerLibros);
router.get('/:id', extraerTokenOpcional, libroController.obtenerLibroPorId);

// Modificación y eliminación protegida (requiere token y rol admin o bibliotecario)
router.post('/', verificarToken, requerirRol('admin', 'bibliotecario'), libroController.crearLibro);
router.put('/:id', verificarToken, requerirRol('admin', 'bibliotecario'), libroController.actualizarLibro);
router.delete('/:id', verificarToken, requerirRol('admin', 'bibliotecario'), libroController.eliminarLibro);

module.exports = router;

