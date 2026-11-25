'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Editorial extends Model {
    static associate(models) {
      // Una editorial publica múltiples libros
      Editorial.hasMany(models.Libro, {
        foreignKey: 'editorialId',
        as: 'libros'
      });
    }
  }

  Editorial.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false
    },
    pais: DataTypes.STRING,
    telefono: DataTypes.STRING,
    sitio_web: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Editorial',
    tableName: 'Editoriales'
  });

  return Editorial;
};

