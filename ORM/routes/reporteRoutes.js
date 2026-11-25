const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { verificarToken, requerirRol } = require('../middlewares/authMiddleware');

// POST /api/reportes/diario -> Genera reporte manual con Claude y devuelve resumen + fileId
router.post('/diario', verificarToken, requerirRol('admin', 'bibliotecario'), reporteController.generarReporteDiario);

// GET /api/reportes/descargar/:fileId -> Descarga el PDF directo desde Anthropic
router.get('/descargar/:fileId', verificarToken, requerirRol('admin', 'bibliotecario'), reporteController.descargarReportePDF);

// GET /api/reportes/cron/estado -> Estado del cron y lista de reportes automáticos generados
router.get('/cron/estado', verificarToken, requerirRol('admin', 'bibliotecario'), reporteController.obtenerEstadoCron);

// POST /api/reportes/cron/disparar -> Forzar ejecución inmediata del cron
router.post('/cron/disparar', verificarToken, requerirRol('admin', 'bibliotecario'), reporteController.dispararCronInmediato);

module.exports = router;
