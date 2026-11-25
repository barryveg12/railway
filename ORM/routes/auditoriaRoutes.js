const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

// Administradores y Bibliotecarios pueden consultar la auditoría
router.get('/libros', verificarToken, requerirRol('admin', 'bibliotecario'), auditoriaController.obtenerAuditorias);

module.exports = router;

