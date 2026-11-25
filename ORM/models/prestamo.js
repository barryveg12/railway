'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Prestamo extends Model {
    static associate(models) {
      // Un préstamo pertenece al usuario que lo solicitó
      Prestamo.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });

      // Un préstamo corresponde a una copia física / ejemplar
      Prestamo.belongsTo(models.Ejemplar, {
        foreignKey: 'ejemplarId',
        as: 'ejemplar'
      });

      // Un préstamo con retraso o daño puede generar una multa
      Prestamo.hasOne(models.Multa, {
        foreignKey: 'prestamoId',
        as: 'multa'
      });
    }
  }

  Prestamo.init({
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuarios',
        key: 'id'
      }
    },
    ejemplarId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Ejemplares',
        key: 'id'
      }
    },
    fecha_prestamo: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    fecha_devolucion_limite: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    fecha_devolucion_real: DataTypes.DATEONLY,
    estado: {
      type: DataTypes.ENUM('activo', 'devuelto', 'vencido'),
      defaultValue: 'activo'
    }
  }, {
    sequelize,
    modelName: 'Prestamo',
    tableName: 'Prestamos'
  });

  return Prestamo;
};

