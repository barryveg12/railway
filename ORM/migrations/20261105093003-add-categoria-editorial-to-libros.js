'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Libros');

    if (!tableInfo.categoriaId) {
      await queryInterface.addColumn('Libros', 'categoriaId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Categorias',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }

    if (!tableInfo.editorialId) {
      await queryInterface.addColumn('Libros', 'editorialId', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Editoriales',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('Libros');
    if (tableInfo.categoriaId) {
      await queryInterface.removeColumn('Libros', 'categoriaId');
    }
    if (tableInfo.editorialId) {
      await queryInterface.removeColumn('Libros', 'editorialId');
    }
  }
};

