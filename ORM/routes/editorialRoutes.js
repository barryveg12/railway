const express = require('express');
const router = express.Router();
const editorialController = require('../controllers/editorialController');
const { verificarToken, requerirRol, extraerTokenOpcional } = require('../middlewares/authMiddleware');

router.get('/', extraerTokenOpcional, editorialController.obtenerEditoriales);
router.post('/', verificarToken, requerirRol('admin', 'bibliotecario'), editorialController.crearEditorial);
router.delete('/:id', verificarToken, requerirRol('admin', 'bibliotecario'), editorialController.eliminarEditorial);

module.exports = router;

