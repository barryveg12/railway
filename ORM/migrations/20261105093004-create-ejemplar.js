'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Ejemplares', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      libroId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Libros',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      codigo_barras: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      ubicacion_estante: {
        type: Sequelize.STRING
      },
      estado: {
        type: Sequelize.ENUM('disponible', 'prestado', 'en_reparacion', 'danado'),
        defaultValue: 'disponible',
        allowNull: false
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Ejemplares');
  }
};

