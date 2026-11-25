'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Usuario extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Un usuario pertenece a un solo rol
      Usuario.belongsTo(models.Rol, {
        foreignKey: 'rolId',
        as: 'rol'
      });

      // Un usuario puede realizar múltiples préstamos
      Usuario.hasMany(models.Prestamo, {
        foreignKey: 'usuarioId',
        as: 'prestamos'
      });

      // Un usuario puede realizar múltiples reservas
      Usuario.hasMany(models.Reserva, {
        foreignKey: 'usuarioId',
        as: 'reservas'
      });
    }
  }
  Usuario.init({
    nombre: DataTypes.STRING,
    correo: DataTypes.STRING,
    password: DataTypes.STRING,
    edad: DataTypes.INTEGER,
    rolId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Roles',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Usuario',
    tableName: 'Usuarios',
  });
  return Usuario;
};
