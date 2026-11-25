const express = require('express');
const router = express.Router();
const prestamoController = require('../controllers/prestamoController');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

// Solo usuarios autenticados pueden ver y gestionar préstamos
router.get('/', verificarToken, requerirRol('admin', 'bibliotecario'), prestamoController.obtenerPrestamos);
router.get('/mis-prestamos', verificarToken, prestamoController.obtenerMisPrestamos);
router.post('/', verificarToken, requerirRol('admin', 'bibliotecario'), prestamoController.crearPrestamo);
router.put('/:id/devolver', verificarToken, requerirRol('admin', 'bibliotecario'), prestamoController.devolverLibro);

module.exports = router;

