'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Usuarios');
    if (!tableInfo.password) {
      await queryInterface.addColumn('Usuarios', 'password', {
        type: Sequelize.STRING,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Usuarios');
    if (tableInfo.password) {
      await queryInterface.removeColumn('Usuarios', 'password');
    }
  }
};

