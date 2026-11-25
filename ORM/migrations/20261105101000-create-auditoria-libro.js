'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AuditoriaLibros', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      libroId: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      usuarioId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      accion: {
        type: Sequelize.ENUM('CREAR', 'ACTUALIZAR', 'ELIMINAR'),
        allowNull: false
      },
      valores_anteriores: {
        type: Sequelize.JSON,
        allowNull: true
      },
      valores_nuevos: {
        type: Sequelize.JSON,
        allowNull: true
      },
      descripcion_cambio: {
        type: Sequelize.STRING,
        allowNull: true
      },
      ip_origen: {
        type: Sequelize.STRING,
        allowNull: true
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
    await queryInterface.dropTable('AuditoriaLibros');
  }
};

