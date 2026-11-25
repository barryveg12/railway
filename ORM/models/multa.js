'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Multa extends Model {
    static associate(models) {
      // Una multa proviene de un préstamo específico
      Multa.belongsTo(models.Prestamo, {
        foreignKey: 'prestamoId',
        as: 'prestamo'
      });
    }
  }

  Multa.init({
    prestamoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Prestamos',
        key: 'id'
      }
    },
    monto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    dias_retraso: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    motivo: DataTypes.STRING,
    estado_pago: {
      type: DataTypes.ENUM('pendiente', 'pagada', 'condonada'),
      defaultValue: 'pendiente'
    }
  }, {
    sequelize,
    modelName: 'Multa',
    tableName: 'Multas'
  });

  return Multa;
};

