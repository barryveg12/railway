'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AutorLibros', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      autorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Autores',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
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
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    }, {
      uniqueKeys: {
        autor_libro_unique: {
          fields: ['autorId', 'libroId']
        }
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('AutorLibros');
  }
};
