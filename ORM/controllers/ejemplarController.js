const { Ejemplar, Libro } = require('../models');

const obtenerEjemplares = async (req, res) => {
  try {
    const ejemplares = await Ejemplar.findAll({
      include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
    });
    return res.status(200).json(ejemplares);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener ejemplares', error: error.message });
  }
};

const crearEjemplar = async (req, res) => {
  try {
    const { libroId, codigo_barras, ubicacion_estante, estado } = req.body;
    if (!libroId || !codigo_barras) {
      return res.status(400).json({ mensaje: 'El libro y el código de barras son obligatorios' });
    }

    const nuevo = await Ejemplar.create({
      libroId: parseInt(libroId, 10),
      codigo_barras: codigo_barras.trim(),
      ubicacion_estante: ubicacion_estante ? ubicacion_estante.trim() : null,
      estado: estado || 'disponible'
    });

    const ejemplarCompleto = await Ejemplar.findByPk(nuevo.id, {
      include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
    });

    return res.status(201).json({ mensaje: 'Ejemplar registrado con éxito', ejemplar: ejemplarCompleto });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar ejemplar', error: error.message });
  }
};

const eliminarEjemplar = async (req, res) => {
  try {
    const { id } = req.params;
    await Ejemplar.destroy({ where: { id } });
    return res.status(200).json({ mensaje: 'Ejemplar eliminado con éxito' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar ejemplar', error: error.message });
  }
};

module.exports = {
  obtenerEjemplares,
  crearEjemplar,
  eliminarEjemplar
};

