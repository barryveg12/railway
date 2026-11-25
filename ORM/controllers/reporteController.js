const reporteAgenteService = require('../services/reporteAgenteService');
const cronReporteService = require('../services/cronReporteService');

/**
 * Genera el reporte diario con Claude Sonnet 5.5 y retorna la vista previa con el file_id
 */
const generarReporteDiario = async (req, res) => {
  try {
    const { fecha } = req.body; // YYYY-MM-DD opcional
    const resultado = await reporteAgenteService.generarReporteDiarioConClaude(fecha);
    
    res.json({
      success: true,
      mensaje: 'Reporte diario generado exitosamente con Claude Sonnet 5.5',
      data: {
        fecha: resultado.datos.fechaStr,
        fechaLegible: resultado.datos.fechaLegible,
        totalAgregados: resultado.datos.totalAgregados,
        totalEliminados: resultado.datos.totalEliminados,
        resumenTexto: resultado.resumenTexto,
        fileId: resultado.fileId,
        nombreArchivo: resultado.nombreArchivo,
        agregados: resultado.datos.agregados,
        eliminados: resultado.datos.eliminados
      }
    });
  } catch (error) {
    console.error('Error al generar reporte diario:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al generar reporte diario con Claude',
      error: error.message
    });
  }
};

/**
 * Descarga directamente el PDF generado por Claude desde la Files API
 */
const descargarReportePDF = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { nombre } = req.query;

    if (!fileId) {
      return res.status(400).json({
        success: false,
        mensaje: 'Se requiere el parámetro fileId para descargar el reporte'
      });
    }

    const pdfBuffer = await reporteAgenteService.descargarArchivoAnthropic(fileId);
    const filename = nombre || `reporte_diario_${Date.now()}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Error al descargar PDF:', error);
    res.status(500).json({
      success: false,
      mensaje: 'Error al descargar el PDF generado',
      error: error.message
    });
  }
};

/**
 * Obtener estado del Cron Job y último reporte automático
 */
const obtenerEstadoCron = async (req, res) => {
  try {
    const estado = cronReporteService.getEstadoCron();
    const historial = cronReporteService.getHistorialReportes();
    res.json({
      success: true,
      data: {
        ...estado,
        historial
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Forzar un disparo inmediato del Cron Job
 */
const dispararCronInmediato = async (req, res) => {
  try {
    cronReporteService.ejecutarGeneracionAutomatica(); // Corre en background
    res.json({
      success: true,
      mensaje: 'Generación automática disparada en segundo plano'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  generarReporteDiario,
  descargarReportePDF,
  obtenerEstadoCron,
  dispararCronInmediato
};
