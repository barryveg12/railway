const { AuditoriaLibro, Usuario, Libro } = require('../models');

/**
 * Obtener todos los registros de auditoría de libros
 */
const obtenerAuditorias = async (req, res) => {
  try {
    const auditorias = await AuditoriaLibro.findAll({
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
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(auditorias);
  } catch (error) {
    console.error('Error al obtener auditorías:', error);
    return res.status(500).json({
      mensaje: 'Error al obtener los registros de auditoría',
      error: error.message
    });
  }
};

module.exports = {
  obtenerAuditorias
};

