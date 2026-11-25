'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Autores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nombre_autor: {
        type: Sequelize.STRING,
        allowNull: false
      },
      edad_autor: {
        type: Sequelize.INTEGER
      },
      telefono_autor: {
        type: Sequelize.STRING
      },
      correo_autor: {
        type: Sequelize.STRING
      },
      nacionalidad: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Autores');
  }
};
