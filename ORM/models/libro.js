'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Libro extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Relación muchos a muchos con Autores
      Libro.belongsToMany(models.Autor, {
        through: models.AutorLibro || 'AutorLibros',
        foreignKey: 'libroId',
        otherKey: 'autorId',
        as: 'autores'
      });

      // Relación con Categoría
      Libro.belongsTo(models.Categoria, {
        foreignKey: 'categoriaId',
        as: 'categoria'
      });

      // Relación con Editorial
      Libro.belongsTo(models.Editorial, {
        foreignKey: 'editorialId',
        as: 'editorial'
      });

      // Un libro posee múltiples copias físicas (Ejemplares)
      Libro.hasMany(models.Ejemplar, {
        foreignKey: 'libroId',
        as: 'ejemplares'
      });

      // Un libro puede tener reservas en espera
      Libro.hasMany(models.Reserva, {
        foreignKey: 'libroId',
        as: 'reservas'
      });
    }
  }

  Libro.init({
    titulo: {
      type: DataTypes.STRING,
      allowNull: false
    },
    isbn: DataTypes.STRING,
    paginas: DataTypes.INTEGER,
    descripcion: DataTypes.TEXT,
    categoriaId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Categorias',
        key: 'id'
      }
    },
    editorialId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Editoriales',
        key: 'id'
      }
    }
  }, {
    sequelize,
    modelName: 'Libro',
    tableName: 'Libros',
  });

  return Libro;
};

