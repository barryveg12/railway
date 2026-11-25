'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Autor extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación muchos a muchos con Libros
      Autor.belongsToMany(models.Libro, {
        through: models.AutorLibro || 'AutorLibros',
        foreignKey: 'autorId',
        otherKey: 'libroId',
        as: 'libros'
      });
    }
  }

  Autor.init({
    nombre_autor: {
      type: DataTypes.STRING,
      allowNull: false
    },
    edad_autor: DataTypes.INTEGER,
    telefono_autor: DataTypes.STRING,
    correo_autor: DataTypes.STRING,
    nacionalidad: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Autor',
    tableName: 'Autores',
  });

  return Autor;
};

