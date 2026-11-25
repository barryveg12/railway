const express = require('express');
const router = express.Router();
const ejemplarController = require('../controllers/ejemplarController');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

router.get('/', verificarToken, requerirRol('admin', 'bibliotecario'), ejemplarController.obtenerEjemplares);
router.post('/', verificarToken, requerirRol('admin', 'bibliotecario'), ejemplarController.crearEjemplar);
router.delete('/:id', verificarToken, requerirRol('admin', 'bibliotecario'), ejemplarController.eliminarEjemplar);

module.exports = router;

