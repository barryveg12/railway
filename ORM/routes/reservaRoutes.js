const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { verificarToken } = require('../middlewares/authMiddleware');

// Las reservas requieren usuario autenticado vía JWT
router.get('/mis-reservas', verificarToken, reservaController.obtenerMisReservas);
router.post('/', verificarToken, reservaController.crearReserva);
router.delete('/:id', verificarToken, reservaController.cancelarReserva);

module.exports = router;

