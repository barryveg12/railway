const { Categoria, Libro } = require('../models');

const obtenerCategorias = async (req, res) => {
  try {
    const categorias = await Categoria.findAll({
      include: [{ model: Libro, as: 'libros', attributes: ['id', 'titulo'] }]
    });
    return res.status(200).json(categorias);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener categorías', error: error.message });
  }
};

const crearCategoria = async (req, res) => {
  try {
    const { nombre, descripcion } = req.body;
    if (!nombre || !nombre.trim()) {
      return res.status(400).json({ mensaje: 'El nombre de la categoría es obligatorio' });
    }

    const nueva = await Categoria.create({
      nombre: nombre.trim(),
      descripcion: descripcion ? descripcion.trim() : null
    });

    return res.status(201).json({ mensaje: 'Categoría creada con éxito', categoria: nueva });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear categoría', error: error.message });
  }
};

const eliminarCategoria = async (req, res) => {
  try {
    const { id } = req.params;
    await Categoria.destroy({ where: { id } });
    return res.status(200).json({ mensaje: 'Categoría eliminada con éxito' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al eliminar categoría', error: error.message });
  }
};

module.exports = {
  obtenerCategorias,
  crearCategoria,
  eliminarCategoria
};

