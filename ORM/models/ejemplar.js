'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Ejemplar extends Model {
    static associate(models) {
      // Un ejemplar físico pertenece a un libro abstracto
      Ejemplar.belongsTo(models.Libro, {
        foreignKey: 'libroId',
        as: 'libro'
      });

      // Un ejemplar puede registrar varios préstamos a lo largo del tiempo
      Ejemplar.hasMany(models.Prestamo, {
        foreignKey: 'ejemplarId',
        as: 'prestamos'
      });
    }
  }

  Ejemplar.init({
    libroId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Libros',
        key: 'id'
      }
    },
    codigo_barras: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    ubicacion_estante: DataTypes.STRING,
    estado: {
      type: DataTypes.ENUM('disponible', 'prestado', 'en_reparacion', 'danado'),
      defaultValue: 'disponible'
    }
  }, {
    sequelize,
    modelName: 'Ejemplar',
    tableName: 'Ejemplares'
  });

  return Ejemplar;
};

