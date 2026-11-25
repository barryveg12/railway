'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Asociado extends Model {
    static associate(models) {
      // Los asociados son contactos externos que no tienen credenciales de acceso/login
    }
  }

  Asociado.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    correo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true
    },
    empresa: {
      type: DataTypes.STRING,
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    sequelize,
    modelName: 'Asociado',
    tableName: 'Asociados'
  });

  return Asociado;
};
