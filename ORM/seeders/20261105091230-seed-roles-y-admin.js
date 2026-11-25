'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Crear roles base si no existen
    const [roles] = await queryInterface.sequelize.query(
      "SELECT id, nombre FROM Roles WHERE nombre IN ('admin', 'usuario')"
    );

    let adminRolId = roles.find((r) => r.nombre === 'admin')?.id;
    let usuarioRolId = roles.find((r) => r.nombre === 'usuario')?.id;

    if (!adminRolId) {
      const [insertAdmin] = await queryInterface.bulkInsert('Roles', [
        {
          nombre: 'admin',
          descripcion: 'Rol de administrador con acceso completo',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
      adminRolId = insertAdmin;
    }

    if (!usuarioRolId) {
      await queryInterface.bulkInsert('Roles', [
        {
          nombre: 'usuario',
          descripcion: 'Rol de usuario estándar',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }

    // 2. Crear usuario administrador de prueba
    const [usuarios] = await queryInterface.sequelize.query(
      "SELECT id FROM Usuarios WHERE correo = 'admin@admin.com'"
    );

    if (usuarios.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await queryInterface.bulkInsert('Usuarios', [
        {
          nombre: 'Administrador Principal',
          correo: 'admin@admin.com',
          password: hashedPassword,
          edad: 30,
          rolId: adminRolId,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Usuarios', { correo: 'admin@admin.com' }, {});
    await queryInterface.bulkDelete('Roles', { nombre: ['admin', 'usuario'] }, {});
  }
};

