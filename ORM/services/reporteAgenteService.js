const Anthropic = require('@anthropic-ai/sdk');
const https = require('https');
const { Op } = require('sequelize');
const { AuditoriaLibro, Usuario, Libro } = require('../models');

// Inicializar cliente Anthropic
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

/**
 * Descarga el contenido binario de un archivo generado por Claude desde la Files API
 * @param {string} fileId - ID del archivo en Anthropic Files API
 * @returns {Promise<Buffer>}
 */
function descargarArchivoAnthropic(fileId) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: `/v1/files/${fileId}/content`,
      method: 'GET',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-beta': 'files-api-2025-04-14',
        'anthropic-version': '2023-06-01'
      }
    };

    const req = https.request(options, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Error al descargar archivo de Anthropic: HTTP ${res.statusCode}`));
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', (err) => reject(err));
    req.end();
  });
}

/**
 * Obtiene los eventos de auditoría (CREAR y ELIMINAR) para una fecha específica
 * @param {string} fechaStr - Formato YYYY-MM-DD
 */
async function obtenerMovimientosDelDia(fechaStr) {
  // Configurar rango de inicio y fin de día
  let baseDate;
  if (fechaStr && /^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
    const [y, m, d] = fechaStr.split('-').map(Number);
    baseDate = new Date(y, m - 1, d, 0, 0, 0);
  } else {
    baseDate = new Date();
  }

  const inicioDia = new Date(baseDate);
  inicioDia.setHours(0, 0, 0, 0);

  const finDia = new Date(baseDate);
  finDia.setHours(23, 59, 59, 999);

  const registrosAuditoria = await AuditoriaLibro.findAll({
    where: {
      createdAt: {
        [Op.between]: [inicioDia, finDia]
      },
      accion: {
        [Op.in]: ['CREAR', 'ELIMINAR']
      }
    },
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre', 'correo']
      },
      {
        model: Libro,
        as: 'libro',
        attributes: ['id', 'titulo', 'isbn']
      }
    ],
    order: [['createdAt', 'ASC']]
  });

  const agregados = [];
  const eliminados = [];

  for (const reg of registrosAuditoria) {
    const hora = new Date(reg.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const usuarioNombre = reg.usuario?.nombre || 'Administrador / Sistema';

    if (reg.accion === 'CREAR') {
      const datos = reg.valores_nuevos || {};
      agregados.push({
        id: reg.libroId,
        titulo: datos.titulo || reg.libro?.titulo || 'Sin título',
        isbn: datos.isbn || reg.libro?.isbn || 'N/A',
        paginas: datos.paginas || 'N/A',
        categoriaId: datos.categoriaId || 'N/A',
        hora,
        usuario: usuarioNombre
      });
    } else if (reg.accion === 'ELIMINAR') {
      const datos = reg.valores_anteriores || {};
      eliminados.push({
        id: reg.libroId,
        titulo: datos.titulo || reg.descripcion_cambio || 'Libro eliminado',
        isbn: datos.isbn || 'N/A',
        hora,
        usuario: usuarioNombre
      });
    }
  }

  const fechaLegible = baseDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const anio = baseDate.getFullYear();
  const mes = String(baseDate.getMonth() + 1).padStart(2, '0');
  const dia = String(baseDate.getDate()).padStart(2, '0');
  const fechaIso = `${anio}-${mes}-${dia}`;

  return {
    fechaStr: fechaIso,
    fechaLegible,
    agregados,
    eliminados,
    totalAgregados: agregados.length,
    totalEliminados: eliminados.length
  };
}

/**
 * Invoca a Claude Sonnet 5.5 con code_execution para generar el PDF diario
 * @param {string} fechaStr - YYYY-MM-DD
 */
async function generarReporteDiarioConClaude(fechaStr) {
  const datos = await obtenerMovimientosDelDia(fechaStr);

  const promptUsuario = `
Eres el "Agente de Reportería Diaria de la Biblioteca".
Tu misión es generar el reporte oficial del día correspondiente a: **${datos.fechaLegible}**.

DATOS DE ACTIVIDAD DE LIBROS EN ESTE DÍA:
- Total de libros agregados (creados): ${datos.totalAgregados}
- Libros agregados:
${JSON.stringify(datos.agregados, null, 2)}

- Total de libros eliminados: ${datos.totalEliminados}
- Libros eliminados:
${JSON.stringify(datos.eliminados, null, 2)}

INSTRUCCIONES CLAVE:
1. Redacta un resumen narrativo ejecutivo con el formato requerido:
   Por ejemplo: "Hoy ${datos.fechaLegible} se agregaron ${datos.totalAgregados} libros y se eliminaron ${datos.totalEliminados}..." describiendo el impacto en el catálogo y los títulos relevantes.
2. UTILIZA TU HERRAMIENTA DE EJECUCIÓN DE CÓDIGO (Python con ReportLab) para crear un archivo PDF profesional y elegante llamado "reporte_diario_${datos.fechaStr}.pdf" en el directorio indicado por la variable de entorno $OUTPUT_DIR.
3. El PDF debe incluir:
   - Título formal y encabezado institucional ("Biblioteca Central - Reporte Diario de Movimiento de Libros").
   - Fecha de emisión: ${datos.fechaLegible}.
   - Resumen ejecutivo narrativo con el formato solicitado.
   - Tabla estilizada de libros agregados (con columnas: Hora, Título, ISBN, Usuario). Si no hubo agregados, muestra un mensaje indicándolo claramente.
   - Tabla estilizada de libros eliminados (o mensaje indicando que no hubo bajas si el total es 0).
   - Estadísticas del día y pie de página institucional con la fecha y hora de emisión.
4. Asegúrate de ejecutar el script en Python para que el archivo se guarde físicamente en $OUTPUT_DIR/reporte_diario_${datos.fechaStr}.pdf.
`;

  const respuesta = await anthropic.messages.create(
    {
      model: 'claude-sonnet-5-5',
      max_tokens: 4096,
      tools: [
        {
          type: 'code_execution_20250825',
          name: 'code_execution'
        }
      ],
      messages: [
        {
          role: 'user',
          content: promptUsuario
        }
      ]
    },
    {
      headers: {
        'anthropic-beta': 'code-execution-2025-08-25,files-api-2025-04-14'
      }
    }
  );

  // Buscar el file_id en la respuesta y el texto explicativo
  let fileId = null;
  let resumenTexto = '';

  for (const block of respuesta.content) {
    if (block.type === 'text') {
      resumenTexto += block.text + '\n';
    } else if (block.type === 'bash_code_execution_tool_result') {
      if (block.content && Array.isArray(block.content.content)) {
        for (const item of block.content.content) {
          if (item.type === 'bash_code_execution_output' && item.file_id) {
            fileId = item.file_id;
          }
        }
      }
    }
  }

  return {
    datos,
    resumenTexto,
    fileId,
    nombreArchivo: `reporte_diario_${datos.fechaStr}.pdf`
  };
}

module.exports = {
  obtenerMovimientosDelDia,
  generarReporteDiarioConClaude,
  descargarArchivoAnthropic
};
