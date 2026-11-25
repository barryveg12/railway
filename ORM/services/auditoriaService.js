const { AuditoriaLibro } = require('../models');

/**
 * Registra un evento en la tabla AuditoriaLibros
 */
const registrarAuditoriaLibro = async ({
  libroId,
  usuarioId,
  accion,
  valoresAnteriores = null,
  valoresNuevos = null,
  descripcion = null,
  req = null
}) => {
  try {
    let ipOrigen = null;
    if (req) {
      ipOrigen = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || req.ip || null;
    }

    let descFinal = descripcion;
    if (!descFinal) {
      if (accion === 'CREAR') {
        descFinal = `Se registró el libro "${valoresNuevos?.titulo || 'ID ' + libroId}"`;
      } else if (accion === 'ELIMINAR') {
        descFinal = `Se eliminó el libro "${valoresAnteriores?.titulo || 'ID ' + libroId}"`;
      } else if (accion === 'ACTUALIZAR') {
        const cambios = [];
        if (valoresAnteriores && valoresNuevos) {
          const campos = ['titulo', 'isbn', 'paginas', 'descripcion', 'categoriaId', 'editorialId'];
          for (const campo of campos) {
            const valAnt = valoresAnteriores[campo];
            const valNue = valoresNuevos[campo];
            if (valAnt != valNue && !(valAnt === null && valNue === undefined)) {
              cambios.push(`${campo}: "${valAnt ?? 'ninguno'}" ➔ "${valNue ?? 'ninguno'}"`);
            }
          }
        }
        descFinal = cambios.length > 0 ? `Campos modificados: ${cambios.join(', ')}` : 'Actualización general del libro';
      }
    }

    await AuditoriaLibro.create({
      libroId: libroId ? parseInt(libroId, 10) : null,
      usuarioId: usuarioId ? parseInt(usuarioId, 10) : null,
      accion,
      valores_anteriores: valoresAnteriores,
      valores_nuevos: valoresNuevos,
      descripcion_cambio: descFinal,
      ip_origen: ipOrigen
    });
  } catch (error) {
    console.error('Error al guardar auditoría de libro:', error);
  }
};

module.exports = {
  registrarAuditoriaLibro
};

