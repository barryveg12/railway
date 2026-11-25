const { Reserva, Libro, Usuario } = require('../models');

/**
 * Obtener reservas del usuario autenticado
 */
const obtenerMisReservas = async (req, res) => {
  try {
    const usuarioId = req.headers['x-user-id'] || req.query.usuarioId || req.usuario?.id;
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'Se requiere el ID del usuario' });
    }

    const reservas = await Reserva.findAll({
      where: { usuarioId: parseInt(usuarioId, 10) },
      include: [
        {
          model: Libro,
          as: 'libro',
          attributes: ['id', 'titulo', 'isbn', 'descripcion']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(reservas);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener mis reservas', error: error.message });
  }
};

/**
 * Crear una nueva reserva para un libro
 */
const crearReserva = async (req, res) => {
  try {
    const { libroId, usuarioId } = req.body;
    const uid = usuarioId || req.headers['x-user-id'] || req.usuario?.id;

    if (!libroId || !uid) {
      return res.status(400).json({ mensaje: 'Libro y usuario son obligatorios' });
    }

    // Verificar si el usuario ya tiene una reserva pendiente para este libro
    const reservaExistente = await Reserva.findOne({
      where: {
        usuarioId: parseInt(uid, 10),
        libroId: parseInt(libroId, 10),
        estado: 'pendiente'
      }
    });

    if (reservaExistente) {
      return res.status(400).json({ mensaje: 'Ya tienes una reserva pendiente para este libro' });
    }

    const nueva = await Reserva.create({
      libroId: parseInt(libroId, 10),
      usuarioId: parseInt(uid, 10),
      fecha_reserva: new Date(),
      estado: 'pendiente'
    });

    const reservaCompleta = await Reserva.findByPk(nueva.id, {
      include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
    });

    return res.status(201).json({ mensaje: 'Reserva solicitada exitosamente', reserva: reservaCompleta });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al crear reserva', error: error.message });
  }
};

/**
 * Cancelar una reserva
 */
const cancelarReserva = async (req, res) => {
  try {
    const { id } = req.params;
    const reserva = await Reserva.findByPk(id);

    if (!reserva) {
      return res.status(404).json({ mensaje: 'Reserva no encontrada' });
    }

    await reserva.update({ estado: 'cancelada' });
    return res.status(200).json({ mensaje: 'Reserva cancelada exitosamente' });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al cancelar reserva', error: error.message });
  }
};

module.exports = {
  obtenerMisReservas,
  crearReserva,
  cancelarReserva
};

