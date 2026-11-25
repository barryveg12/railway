'use strict';
const {
  Model
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AutorLibro extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      AutorLibro.belongsTo(models.Autor, { foreignKey: 'autorId', as: 'autor' });
      AutorLibro.belongsTo(models.Libro, { foreignKey: 'libroId', as: 'libro' });
    }
  }

  
  AutorLibro.init({
    autorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Autores',
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
    }
  }, {
    sequelize,
    modelName: 'AutorLibro',
    tableName: 'AutorLibros',
  });

  return AutorLibro;
};

