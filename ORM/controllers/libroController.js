const { Libro, Autor, Categoria, Editorial, Ejemplar, sequelize } = require('../models');
const { registrarAuditoriaLibro } = require('../services/auditoriaService');
const { verificarStockYNotificarAsociados } = require('../services/alertaStockAgenteService');

/**
 * Helper para extraer el ID del usuario de la petición (token o cabecera/body)
 */
const extraerUsuarioId = (req) => {
  return req.usuario?.id || req.body?.usuarioId || req.headers['x-user-id'] || null;
};

/**
 * GET - Obtener todos los libros con sus autores, categoría, editorial y ejemplares
 */
const obtenerLibros = async (req, res) => {
  try {
    const libros = await Libro.findAll({
      include: [
        {
          model: Autor,
          as: 'autores',
          through: { attributes: [] }
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Editorial,
          as: 'editorial',
          attributes: ['id', 'nombre']
        },
        {
          model: Ejemplar,
          as: 'ejemplares',
          attributes: ['id', 'codigo_barras', 'estado']
        }
      ]
    });
    return res.status(200).json(libros);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener los libros',
      error: error.message
    });
  }
};

/**
 * GET - Obtener un libro por ID con sus autores, categoría y editorial asociadas
 */
const obtenerLibroPorId = async (req, res) => {
  try {
    const { id } = req.params;
    const libro = await Libro.findByPk(id, {
      include: [
        {
          model: Autor,
          as: 'autores',
          through: { attributes: [] }
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Editorial,
          as: 'editorial',
          attributes: ['id', 'nombre']
        }
      ]
    });

    if (!libro) {
      return res.status(404).json({
        mensaje: `Libro con ID ${id} no encontrado`
      });
    }

    return res.status(200).json(libro);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener el libro',
      error: error.message
    });
  }
};

/**
 * POST - Crear un nuevo libro usando SQL directo (INSERT INTO) para fines educativos
 */
const crearLibro = async (req, res) => {
  try {
    const { titulo, isbn, paginas, descripcion, autoresIds, categoriaId, editorialId } = req.body;

    if (!titulo) {
      return res.status(400).json({
        mensaje: 'El título del libro es obligatorio'
      });
    }

    const ahora = new Date();
    const paginasVal = paginas ? parseInt(paginas, 10) : null;
    const categoriaIdVal = categoriaId ? parseInt(categoriaId, 10) : null;
    const editorialIdVal = editorialId ? parseInt(editorialId, 10) : null;

    // =========================================================================
    // CONSULTA SQL NATIVA DIRECTA (OMITIENDO EL MODELO ORM Libro.create)
    // Usamos INSERT INTO con replacements para prevenir inyecciones SQL
    // =========================================================================
    const querySQL = `
      INSERT INTO Lib (titul, isbn, paginas, descripcion, categoriaId, editorialId, createdAt, updatedAt)
      VALUES (:titulo, :isbn, :paginas, :descripcion, :categoriaId, :editorialId, :createdAt, :updatedAt)
    `;

                            console.log(querySQL);
    

    const [nuevoId] = await sequelize.query(querySQL, {
      replacements: {
        titulo,
        isbn: isbn || null,
        paginas: paginasVal,
        descripcion: descripcion || null,
        categoriaId: categoriaIdVal,
        editorialId: editorialIdVal,
        createdAt: ahora,
        updatedAt: ahora
      },
      type: sequelize.QueryTypes.INSERT
    });
    

    // Si se envían IDs de autores, se vinculan en la tabla intermedia también con INSERT INTO
    if (autoresIds && Array.isArray(autoresIds) && autoresIds.length > 0) {
      for (const autorId of autoresIds) {
        await sequelize.query(
          `INSERT INTO AutorLibros (libroId, autorId, createdAt, updatedAt) VALUES (:libroId, :autorId, :createdAt, :updatedAt)`,
          {
            replacements: {
              libroId: nuevoId,
              autorId: parseInt(autorId, 10),
              createdAt: ahora,
              updatedAt: ahora
            },
            type: sequelize.QueryTypes.INSERT
          }
        );
      }
    }

    const libroCompleto = await Libro.findByPk(nuevoId, {
      include: [
        {
          model: Autor,
          as: 'autores',
          through: { attributes: [] }
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Editorial,
          as: 'editorial',
          attributes: ['id', 'nombre']
        }
      ]
    });

    // Registrar evento en la auditoría
    const usuarioId = extraerUsuarioId(req);
    await registrarAuditoriaLibro({
      libroId: nuevoId,
      usuarioId,
      accion: 'CREAR',
      valoresNuevos: libroCompleto ? libroCompleto.toJSON() : { id: nuevoId, titulo, isbn },
      req
    });

    return res.status(201).json({
      mensaje: 'Libro creado exitosamente mediante INSERT INTO (SQL Nativo)',
      libro: libroCompleto
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al crear el libro culpa del servidor',
      error: error.message
    });
  }
};

/**
 * PUT - Actualizar un libro existente por ID
 */
const actualizarLibro = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, isbn, paginas, descripcion, autoresIds, categoriaId, editorialId } = req.body;

    const libro = await Libro.findByPk(id);
    if (!libro) {
      return res.status(404).json({
        mensaje: `Libro con ID ${id} no encontrado`
      });
    }

    const valoresAnteriores = libro.toJSON();

    await libro.update({
      titulo: titulo !== undefined ? titulo : libro.titulo,
      isbn: isbn !== undefined ? isbn : libro.isbn,
      paginas: paginas !== undefined ? paginas : libro.paginas,
      descripcion: descripcion !== undefined ? descripcion : libro.descripcion,
      categoriaId: categoriaId !== undefined ? (categoriaId ? parseInt(categoriaId, 10) : null) : libro.categoriaId,
      editorialId: editorialId !== undefined ? (editorialId ? parseInt(editorialId, 10) : null) : libro.editorialId
    });

    // Si se pasa un nuevo listado de IDs de autores, sincroniza la relación
    if (autoresIds && Array.isArray(autoresIds)) {
      await libro.setAutores(autoresIds);
    }

    const libroActualizado = await Libro.findByPk(id, {
      include: [
        {
          model: Autor,
          as: 'autores',
          through: { attributes: [] }
        },
        {
          model: Categoria,
          as: 'categoria',
          attributes: ['id', 'nombre']
        },
        {
          model: Editorial,
          as: 'editorial',
          attributes: ['id', 'nombre']
        }
      ]
    });

    // Registrar evento de actualización en la auditoría
    const usuarioId = extraerUsuarioId(req);
    await registrarAuditoriaLibro({
      libroId: libro.id,
      usuarioId,
      accion: 'ACTUALIZAR',
      valoresAnteriores,
      valoresNuevos: libroActualizado.toJSON(),
      req
    });

    return res.status(200).json({
      mensaje: 'Libro actualizado exitosamente',
      libro: libroActualizado
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al actualizar el libro',
      error: error.message
    });
  }
};

/**
 * DELETE - Eliminar un libro por ID
 */
const eliminarLibro = async (req, res) => {
  try {
    const { id } = req.params;

    const libro = await Libro.findByPk(id);
    if (!libro) {
      return res.status(404).json({
        mensaje: `Libro con ID ${id} no encontrado`
      });
    }

    const valoresAnteriores = libro.toJSON();

    await libro.destroy();

    // Registrar evento de eliminación en la auditoría
    const usuarioId = extraerUsuarioId(req);
    await registrarAuditoriaLibro({
      libroId: id,
      usuarioId,
      accion: 'ELIMINAR',
      valoresAnteriores,
      req
    });

    // Disparar en segundo plano la verificación de stock por si la biblioteca quedó vacía
    verificarStockYNotificarAsociados().catch(errStock => {
      console.error('[AGENTE STOCK] Error al comprobar stock tras eliminación:', errStock.message);
    });

    return res.status(200).json({
      mensaje: `Libro con ID ${id} eliminado exitosamente`
    });
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al eliminar el libro',
      error: error.message
    });
  }
};

module.exports = {
  obtenerLibros,
  obtenerLibroPorId,
  crearLibro,
  actualizarLibro,
  eliminarLibro
};

