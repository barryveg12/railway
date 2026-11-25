const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

// Ruta POST para enviar mensajes al agente
router.post('/', chatController.enviarMensaje);

module.exports = router;

