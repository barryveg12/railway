const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const reporteAgenteService = require('../services/reporteAgenteService');

// Historial en memoria de los últimos reportes generados automáticamente
const historialReportesAuto = [];
const MAX_HISTORIAL = 20;

// Directorio para guardar copias locales de los PDFs automáticos si se desea
const DIR_REPORTES = path.join(__dirname, '../reportes_generados');
if (!fs.existsSync(DIR_REPORTES)) {
  fs.mkdirSync(DIR_REPORTES, { recursive: true });
}

let cronJob = null;
let ejecucionEnCurso = false;

/**
 * Función que ejecuta la generación de reporte
 */
async function ejecutarGeneracionAutomatica() {
  if (ejecucionEnCurso) {
    console.log('[CRON REPORTES] Ya hay una generación en curso, omitiendo ciclo...');
    return;
  }

  ejecucionEnCurso = true;
  const timestamp = new Date();
  console.log(`\n==================================================`);
  console.log(`[CRON REPORTES] [${timestamp.toLocaleTimeString()}] Iniciando generación automática con Claude Sonnet 5.5...`);

  try {
    // Tomar la fecha del día actual
    const y = timestamp.getFullYear();
    const m = String(timestamp.getMonth() + 1).padStart(2, '0');
    const d = String(timestamp.getDate()).padStart(2, '0');
    const fechaHoy = `${y}-${m}-${d}`;

    const resultado = await reporteAgenteService.generarReporteDiarioConClaude(fechaHoy);

    const registro = {
      id: `rep_${Date.now()}`,
      horaGeneracion: timestamp.toLocaleTimeString('es-ES'),
      fecha: resultado.datos.fechaStr,
      fechaLegible: resultado.datos.fechaLegible,
      totalAgregados: resultado.datos.totalAgregados,
      totalEliminados: resultado.datos.totalEliminados,
      resumenTexto: resultado.resumenTexto,
      fileId: resultado.fileId,
      nombreArchivo: resultado.nombreArchivo,
      agregados: resultado.datos.agregados,
      eliminados: resultado.datos.eliminados
    };

    // Descargar copia local física en el servidor
    if (resultado.fileId) {
      try {
        const buffer = await reporteAgenteService.descargarArchivoAnthropic(resultado.fileId);
        const rutaArchivo = path.join(DIR_REPORTES, `auto_${Date.now()}_${resultado.nombreArchivo}`);
        fs.writeFileSync(rutaArchivo, buffer);
        registro.rutaLocal = rutaArchivo;
        console.log(`[CRON REPORTES] PDF guardado localmente en: ${rutaArchivo}`);
      } catch (errArchivo) {
        console.error('[CRON REPORTES] Error al guardar copia local:', errArchivo.message);
      }
    }

    // Agregar al historial en memoria (al inicio)
    historialReportesAuto.unshift(registro);
    if (historialReportesAuto.length > MAX_HISTORIAL) {
      historialReportesAuto.pop();
    }

    console.log(`[CRON REPORTES] Reporte completado exitosamente con Claude Sonnet 5.5.`);
    console.log(`[CRON REPORTES] Resumen: Agregados: ${resultado.datos.totalAgregados}, Eliminados: ${resultado.datos.totalEliminados}`);
    console.log(`==================================================\n`);
  } catch (error) {
    console.error('[CRON REPORTES] Error durante la ejecución del cron job:', error.message);
  } finally {
    ejecucionEnCurso = false;
  }
}

/**
 * Inicia el cron job cada 10 minutos
 * Expresion cron: cada 10 minutos
 */
function iniciarCronJobReportes() {
  if (cronJob) {
    console.log('[CRON REPORTES] El cron job ya se encuentra activo.');
    return;
  }

  // Ejecución cada 10 minutos
  cronJob = cron.schedule('*/10 * * * *', () => {
    ejecutarGeneracionAutomatica();
  });

  console.log('[CRON REPORTES] Cron job configurado y activo: se ejecutará cada 10 minutos.');
}

function detenerCronJobReportes() {
  if (cronJob) {
    cronJob.stop();
    cronJob = null;
    console.log('[CRON REPORTES] Cron job detenido.');
  }
}

function getEstadoCron() {
  return {
    activo: cronJob !== null,
    enEjecucion: ejecucionEnCurso,
    totalGenerados: historialReportesAuto.length,
    ultimoReporte: historialReportesAuto[0] || null
  };
}

function getHistorialReportes() {
  return historialReportesAuto;
}

module.exports = {
  iniciarCronJobReportes,
  detenerCronJobReportes,
  ejecutarGeneracionAutomatica,
  getEstadoCron,
  getHistorialReportes
};

