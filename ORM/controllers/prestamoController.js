const { Prestamo, Ejemplar, Libro, Usuario, Multa } = require('../models');

const obtenerPrestamos = async (req, res) => {
  try {
    const prestamos = await Prestamo.findAll({
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
        },
        { model: Multa, as: 'multa' }
      ],
      order: [['id', 'DESC']]
    });
    return res.status(200).json(prestamos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener préstamos', error: error.message });
  }
};

/**
 * Obtener préstamos específicos del usuario en sesión
 */
const obtenerMisPrestamos = async (req, res) => {
  try {
    const usuarioId = req.headers['x-user-id'] || req.query.usuarioId || req.usuario?.id;
    if (!usuarioId) {
      return res.status(400).json({ mensaje: 'Se requiere el ID del usuario' });
    }

    const prestamos = await Prestamo.findAll({
      where: { usuarioId: parseInt(usuarioId, 10) },
      include: [
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
        },
        { model: Multa, as: 'multa' }
      ],
      order: [['id', 'DESC']]
    });

    return res.status(200).json(prestamos);
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al obtener mis préstamos', error: error.message });
  }
};

const crearPrestamo = async (req, res) => {
  try {
    const { usuarioId, ejemplarId, fecha_devolucion_limite } = req.body;

    if (!usuarioId || !ejemplarId || !fecha_devolucion_limite) {
      return res.status(400).json({
        mensaje: 'Usuario, ejemplar y fecha límite de devolución son obligatorios'
      });
    }

    // Verificar disponibilidad del ejemplar
    const ejemplar = await Ejemplar.findByPk(ejemplarId);
    if (!ejemplar) {
      return res.status(404).json({ mensaje: 'Ejemplar no encontrado' });
    }

    if (ejemplar.estado !== 'disponible') {
      return res.status(400).json({
        mensaje: `El ejemplar seleccionado no está disponible (Estado actual: ${ejemplar.estado})`
      });
    }

    // Crear el préstamo
    const nuevoPrestamo = await Prestamo.create({
      usuarioId: parseInt(usuarioId, 10),
      ejemplarId: parseInt(ejemplarId, 10),
      fecha_prestamo: new Date().toISOString().split('T')[0],
      fecha_devolucion_limite,
      estado: 'activo'
    });

    // Actualizar estado del ejemplar a 'prestado'
    await ejemplar.update({ estado: 'prestado' });

    const prestamoCompleto = await Prestamo.findByPk(nuevoPrestamo.id, {
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'correo'] },
        {
          model: Ejemplar,
          as: 'ejemplar',
          include: [{ model: Libro, as: 'libro', attributes: ['id', 'titulo', 'isbn'] }]
        }
      ]
    });

    return res.status(201).json({ mensaje: 'Préstamo registrado con éxito', prestamo: prestamoCompleto });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al registrar préstamo', error: error.message });
  }
};

const devolverLibro = async (req, res) => {
  try {
    const { id } = req.params;
    const prestamo = await Prestamo.findByPk(id, {
      include: [{ model: Ejemplar, as: 'ejemplar' }]
    });

    if (!prestamo) {
      return res.status(404).json({ mensaje: 'Préstamo no encontrado' });
    }

    if (prestamo.estado === 'devuelto') {
      return res.status(400).json({ mensaje: 'Este préstamo ya fue marcado como devuelto previamente' });
    }

    const fechaHoy = new Date().toISOString().split('T')[0];
    await prestamo.update({
      estado: 'devuelto',
      fecha_devolucion_real: fechaHoy
    });

    // Liberar ejemplar
    if (prestamo.ejemplar) {
      await prestamo.ejemplar.update({ estado: 'disponible' });
    }

    // Verificar si hubo retraso para generar multa automática ($5 por día)
    let multaGenerada = null;
    const limite = new Date(prestamo.fecha_devolucion_limite);
    const devolucion = new Date(fechaHoy);
    const diferenciaMs = devolucion - limite;
    const diasRetraso = Math.ceil(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diasRetraso > 0) {
      const montoMulta = diasRetraso * 5; // $5.00 por día de mora
      multaGenerada = await Multa.create({
        prestamoId: prestamo.id,
        monto: montoMulta,
        dias_retraso: diasRetraso,
        motivo: `Retraso de ${diasRetraso} día(s) en la devolución del ejemplar`,
        estado_pago: 'pendiente'
      });
    }

    return res.status(200).json({
      mensaje: 'Devolución procesada con éxito',
      prestamo,
      multa: multaGenerada
    });
  } catch (error) {
    return res.status(500).json({ mensaje: 'Error al procesar devolución', error: error.message });
  }
};

module.exports = {
  obtenerPrestamos,
  obtenerMisPrestamos,
  crearPrestamo,
  devolverLibro
};

