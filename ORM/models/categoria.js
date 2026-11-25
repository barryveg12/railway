'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Categoria extends Model {
    static associate(models) {
      // Una categoría clasifica a múltiples libros
      Categoria.hasMany(models.Libro, {
        foreignKey: 'categoriaId',
        as: 'libros'
      });
    }
  }

  Categoria.init({
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    descripcion: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Categoria',
    tableName: 'Categorias'
  });

  return Categoria;
};

