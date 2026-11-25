const { Asociado } = require('../models');

/**
 * Obtener todos los asociados
 */
const obtenerAsociados = async (req, res) => {
  try {
    const asociados = await Asociado.findAll({
      order: [['id', 'DESC']]
    });
    res.json(asociados);
  } catch (error) {
    console.error('Error al obtener asociados:', error);
    res.status(500).json({ mensaje: 'Error al obtener asociados', error: error.message });
  }
};

/**
 * Crear un nuevo asociado
 */
const crearAsociado = async (req, res) => {
  try {
    const { nombre, correo, telefono, empresa, activo } = req.body;

    if (!nombre || !correo) {
      return res.status(400).json({ mensaje: 'El nombre y correo electrónico son obligatorios.' });
    }

    // Verificar si ya existe el correo
    const existe = await Asociado.findOne({ where: { correo } });
    if (existe) {
      return res.status(400).json({ mensaje: 'Ya existe un asociado registrado con este correo electrónico.' });
    }

    const nuevoAsociado = await Asociado.create({
      nombre,
      correo,
      telefono: telefono || null,
      empresa: empresa || null,
      activo: activo !== undefined ? activo : true
    });

    res.status(201).json({
      mensaje: 'Asociado registrado exitosamente',
      asociado: nuevoAsociado
    });
  } catch (error) {
    console.error('Error al crear asociado:', error);
    res.status(500).json({ mensaje: 'Error al registrar asociado', error: error.message });
  }
};

/**
 * Actualizar asociado
 */
const actualizarAsociado = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, correo, telefono, empresa, activo } = req.body;

    const asociado = await Asociado.findByPk(id);
    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    await asociado.update({
      nombre: nombre !== undefined ? nombre : asociado.nombre,
      correo: correo !== undefined ? correo : asociado.correo,
      telefono: telefono !== undefined ? telefono : asociado.telefono,
      empresa: empresa !== undefined ? empresa : asociado.empresa,
      activo: activo !== undefined ? activo : asociado.activo
    });

    res.json({
      mensaje: 'Asociado actualizado exitosamente',
      asociado
    });
  } catch (error) {
    console.error('Error al actualizar asociado:', error);
    res.status(500).json({ mensaje: 'Error al actualizar asociado', error: error.message });
  }
};

/**
 * Eliminar asociado
 */
const eliminarAsociado = async (req, res) => {
  try {
    const { id } = req.params;
    const asociado = await Asociado.findByPk(id);
    if (!asociado) {
      return res.status(404).json({ mensaje: 'Asociado no encontrado' });
    }

    await asociado.destroy();
    res.json({ mensaje: 'Asociado eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar asociado:', error);
    res.status(500).json({ mensaje: 'Error al eliminar asociado', error: error.message });
  }
};

module.exports = {
  obtenerAsociados,
  crearAsociado,
  actualizarAsociado,
  eliminarAsociado
};

