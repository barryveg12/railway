const { Editorial, Libro } = require('../models');

const obtenerEditoriales = async (req, res) => {
  try {
    const editoriales = await Editorial.findAll({
      include: [{ model: Libro, as: 'libros', attributes: ['id', 'titulo'] }]
    });
    return res.status(200).json(editoriales);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener editoriales', error: error.message });
  }
};

const crearEditorial = async (req, res) => {
  try {
    const { nombre, pais, telefono, sitio_web } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ mensaje: 'El nombre de la editorial es obligatorio' });
    }

    const nueva = await Editorial.create({
      nombre: nombre.trim(),
      pais: pais ? pais.trim() : null,
      telefono: telefono ? telefono.trim() : null,
      sitio_web: sitio_web ? sitio_web.trim() : null
    });

    return res.status(201).json({ mensaje: 'Editorial creada con éxito', editorial: nueva });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear editorial', error: error.message });
  }
};

const eliminarEditorial = async (req, res) => {
  try {
    const { id } = req.params;
    await Editorial.destroy({ where: { id } });
    return res.status(200).json({ mensaje: 'Editorial eliminada con éxito' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar editorial', error: error.message });
  }
};

module.exports = {
  obtenerEditoriales,
  crearEditorial,
  eliminarEditorial
};

