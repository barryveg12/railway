const Anthropic = require('@anthropic-ai/sdk');
const { Op } = require('sequelize');
const { Libro, Autor } = require('../models');

// Definición de herramientas para que Claude consulte la base de datos
const tools = [
  {
    name: 'consultar_todos_los_libros',
    description: 'Obtiene todos los libros registrados en la base de datos con sus datos (título, ISBN, páginas, descripción y autores).',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'buscar_libros',
    description: 'Busca libros en la base de datos por término clave en el título, descripción o por código ISBN.',
    input_schema: {
      type: 'object',
      properties: {
        termino: {
          type: 'string',
          description: 'Palabra clave o frase a buscar en el título o descripción del libro.'
        },
        isbn: {
          type: 'string',
          description: 'Código ISBN específico a buscar.'
        }
      }
    }
  },
  {
    name: 'obtener_estadisticas_biblioteca',
    description: 'Calcula estadísticas generales de los libros: cantidad total de libros registrados y promedio o total de páginas.',
    input_schema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Ejecutor de herramientas que interactúa directamente con Sequelize
const ejecutarHerramienta = async (nombre, args) => {
  try {
    switch (nombre) {
      case 'consultar_todos_los_libros': {
        const libros = await Libro.findAll({
          include: [{
            model: Autor,
            as: 'autores',
            through: { attributes: [] }
          }]
        });

        return {
          total: libros.length,
          libros: libros.map((l) => ({
            id: l.id,
            titulo: l.titulo,
            isbn: l.isbn,
            paginas: l.paginas,
            descripcion: l.descripcion,
            autores: l.autores ? l.autores.map((a) => a.nombre || a.nombreCompleto || a) : []
          }))
        };
      }

      case 'buscar_libros': {
        const whereClause = {};
        const conditions = [];

        if (args.isbn) {
          conditions.push({ isbn: { [Op.like]: `%${args.isbn}%` } });
        }
        if (args.termino) {
          conditions.push({ titulo: { [Op.like]: `%${args.termino}%` } });
          conditions.push({ descripcion: { [Op.like]: `%${args.termino}%` } });
        }

        if (conditions.length > 0) {
          whereClause[Op.or] = conditions;
        }

        const libros = await Libro.findAll({
          where: whereClause,
          include: [{
            model: Autor,
            as: 'autores',
            through: { attributes: [] }
          }]
        });

        return {
          coincidencias: libros.length,
          libros: libros.map((l) => ({
            id: l.id,
            titulo: l.titulo,
            isbn: l.isbn,
            paginas: l.paginas,
            descripcion: l.descripcion,
            autores: l.autores ? l.autores.map((a) => a.nombre || a.nombreCompleto || a) : []
          }))
        };
      }

      case 'obtener_estadisticas_biblioteca': {
        const totalLibros = await Libro.count();
        const libros = await Libro.findAll({ attributes: ['paginas'] });
        const paginasValidas = libros
          .map((l) => Number(l.paginas))
          .filter((n) => !isNaN(n) && n > 0);

        const totalPaginas = paginasValidas.reduce((acc, curr) => acc + curr, 0);
        const promedioPaginas = paginasValidas.length > 0
          ? Math.round(totalPaginas / paginasValidas.length)
          : 0;

        return {
          totalLibros,
          totalPaginasCalculadas: totalPaginas,
          promedioPaginas
        };
      }

      default:
        return { error: `Herramienta desconocida: ${nombre}` };
    }
  } catch (err) {
    return { error: `Error al ejecutar consulta en la base de datos: ${err.message}` };
  }
};

/**
 * Procesa un mensaje del usuario mediante el agente de Claude
 * @param {string} mensajeUsuario - Mensaje enviado por el usuario
 * @param {Array} historialPrevio - Mensajes anteriores [{ role: 'user' | 'assistant', content: string }]
 */
const procesarMensajeConClaude = async (mensajeUsuario, historialPrevio = []) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey || apiKey.trim() === '' || apiKey === 'tu_api_key_aqui') {
    return {
      respuesta: '⚠️ **Falta configurar la API Key de Claude.**\n\nPor favor, abre el archivo `ORM/.env` y reemplaza `tu_api_key_aqui` por tu clave de Anthropic (`sk-ant-...`). Luego reinicia el servidor para poder chatear con el agente.',
      requiereApiKey: true
    };
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

  const systemPrompt = `Eres un asistente inteligente para una biblioteca y sistema de gestión de libros.
Tu tarea es responder preguntas sobre los libros registrados en la base de datos (títulos, autores, descripciones, número de páginas, etc.).
Cuentas con herramientas para consultar la base de datos de libros en tiempo real. Úsalas siempre que el usuario pregunte por información que pueda estar en la base de datos.
Responde de manera amable, clara y en español, utilizando formato Markdown cuando sea adecuado. Si no hay libros registrados o no se encuentra alguno, explícaselo amablemente al usuario.`;

  // Formatear mensajes previos asegurando que comiencen con user si hay historial
  const messages = [];

  if (Array.isArray(historialPrevio)) {
    for (const msg of historialPrevio) {
      if (msg.role && msg.content && typeof msg.content === 'string') {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
        });
      }
    }
  }

  // Agregar el mensaje actual del usuario
  messages.push({
    role: 'user',
    content: mensajeUsuario
  });

  try {
    // Primer llamado a Claude
    let response = await anthropic.messages.create({
      model,
      max_tokens: 1024,
      system: systemPrompt,
      tools,
      messages
    });

    // Bucle para resolver tool calls si Claude decide usar herramientas
    while (response.stop_reason === 'tool_use') {
      const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
      if (toolUseBlocks.length === 0) break;

      // Agregamos la respuesta del asistente (con los bloques de tool_use) al historial de la conversación
      messages.push({
        role: 'assistant',
        content: response.content
      });

      // Ejecutamos cada herramienta solicitada y construimos las respuestas de tool_result
      const toolResultBlocks = [];
      for (const block of toolUseBlocks) {
        const resultadoEjecucion = await ejecutarHerramienta(block.name, block.input || {});
        toolResultBlocks.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(resultadoEjecucion)
        });
      }

      // Añadimos los tool_results como mensaje de usuario según la especificación de Anthropic
      messages.push({
        role: 'user',
        content: toolResultBlocks
      });

      // Llamamos nuevamente a Claude con los resultados de las herramientas
      response = await anthropic.messages.create({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        tools,
        messages
      });
    }

    // Extraer texto final de la respuesta
    const textBlocks = response.content.filter((b) => b.type === 'text');
    const respuestaFinal = textBlocks.map((b) => b.text).join('\n') || 'No se obtuvo respuesta de texto.';

    return {
      respuesta: respuestaFinal,
      requiereApiKey: false
    };
  } catch (error) {
    console.error('Error en procesarMensajeConClaude:', error);
    return {
      respuesta: `Ocurrió un error al consultar con el agente de Claude: ${error.message}`,
      error: error.message
    };
  }
};

module.exports = {
  procesarMensajeConClaude
};

