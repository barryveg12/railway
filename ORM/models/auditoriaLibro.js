'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AuditoriaLibro extends Model {
    static associate(models) {
      // Relación con el usuario que ejecutó la acción
      AuditoriaLibro.belongsTo(models.Usuario, {
        foreignKey: 'usuarioId',
        as: 'usuario'
      });

      // Relación con el libro auditado
      AuditoriaLibro.belongsTo(models.Libro, {
        foreignKey: 'libroId',
        as: 'libro'
      });
    }
  }

  AuditoriaLibro.init({
    libroId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'id'
      }
    },
    accion: {
      type: DataTypes.ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR'),
      allowNull: false
    },
    valores_anteriores: {
      type: DataTypes.JSON,
      allowNull: true
    },
    valores_nuevos: {
      type: DataTypes.JSON,
      allowNull: true
    },
    descripcion_cambio: {
      type: DataTypes.STRING,
      allowNull: true
    },
    ip_origen: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AuditoriaLibro',
    tableName: 'AuditoriaLibros'
  });

  return AuditoriaLibro;
};

