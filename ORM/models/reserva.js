'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Reserva extends Model {
    static associate(models) {
      // Una reserva es realizada por un usuario
      Reserva.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });

      // Una reserva es sobre un libro del catálogo
      Reserva.belongsTo(models.Libro, {
        foreignKey: 'libroId',
        as: 'libro'
      });
    }
  }

  Reserva.init({
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Usuarios',
        key: 'id'
      }
    },
    libroId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Libros',
        key: 'id'
      }
    },
    fecha_reserva: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    estado: {
      type: DataTypes.ENUM('pendiente', 'completada', 'cancelada'),
      defaultValue: 'pendiente'
    }
  }, {
    sequelize,
    modelName: 'Reserva',
    tableName: 'Reservas'
  });

  return Reserva;
};

