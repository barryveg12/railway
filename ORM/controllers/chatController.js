const { procesarMensajeConClaude } = require('../services/claudeAgent');

/**
 * Manejador del chat con el agente de Claude
 */
const enviarMensaje = async (req, res) => {
  try {
    const { mensaje, historial } = req.body;

    if (!mensaje || typeof mensaje !== 'string' || mensaje.trim() === '') {
      return res.status(400).json({
        mensaje: 'El mensaje del usuario es obligatorio.'
      });
    }

    const resultado = await procesarMensajeConClaude(mensaje.trim(), historial || []);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('Error en enviarMensaje controller:', error);
    return res.status(500).json({
      mensaje: 'Error interno en el servidor al procesar el mensaje.',
      error: error.message
    });
  }
};

module.exports = {
  enviarMensaje
};

