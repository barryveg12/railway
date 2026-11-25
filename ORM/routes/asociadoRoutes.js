const express = require('express');
const router = express.Router();
const asociadoController = require('../controllers/asociadoController');
const alertaStockAgenteService = require('../services/alertaStockAgenteService');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

// CRUD de Asociados (Protegido para Administradores)
router.get('/', verificarToken, requerirRol('admin'), asociadoController.obtenerAsociados);
router.post('/', verificarToken, requerirRol('admin'), asociadoController.crearAsociado);
router.put('/:id', verificarToken, requerirRol('admin'), asociadoController.actualizarAsociado);
router.delete('/:id', verificarToken, requerirRol('admin'), asociadoController.eliminarAsociado);

// Endpoint para probar / disparar la verificación de stock y alerta de Claude (solo admin)
router.post('/verificar-alerta-stock', verificarToken, requerirRol('admin'), async (req, res) => {
  try {
    const resultado = await alertaStockAgenteService.verificarStockYNotificarAsociados();
    res.json({
      success: true,
      data: resultado
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      mensaje: 'Error al verificar stock y notificar',
      error: error.message
    });
  }
});

module.exports = router;

