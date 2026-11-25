const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { verificarToken, requerirRol, extraerTokenOpcional } = require('../middlewares/authMiddleware');

router.get('/', extraerTokenOpcional, categoriaController.obtenerCategorias);
router.post('/', verificarToken, requerirRol('admin', 'bibliotecario'), categoriaController.crearCategoria);
router.delete('/:id', verificarToken, requerirRol('admin', 'bibliotecario'), categoriaController.eliminarCategoria);

module.exports = router;

