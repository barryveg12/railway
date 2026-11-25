'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Rol extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un rol puede estar presente en múltiples usuarios (1 a N)
      Rol.hasMany(models.Usuario, {
        foreignKey: 'rolId',
        as: 'usuarios'
      });
    }
  }
  Rol.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    descripcion: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Rol',
    tableName: 'Roles',
  });
  return Rol;
};
