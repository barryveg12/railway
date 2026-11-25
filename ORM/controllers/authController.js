const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario, Rol } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'clave_secreta_jwt_biblioteca_2026';

/**
 * Registro de un nuevo usuario
 */
const register = async (req, res) => {
  try {
    const { nombre, correo, password, edad, rolId, rolNombre } = req.body;

    if (!nombre || !correo || !password) {
      return res.status(400).json({
        mensaje: 'Nombre, correo y contraseña son obligatorios'
      });
    }

    // Verificar si el correo ya existe
    const usuarioExistente = await Usuario.findOne({ where: { correo } });
    if (usuarioExistente) {
      return res.status(409).json({
        mensaje: 'Ya existe un usuario registrado con este correo'
      });
    }

    // Determinar el rol: si envían rolNombre o rolId, o por defecto 'usuario'
    let rolAsignadoId = rolId;
    if (!rolAsignadoId) {
      const nombreBuscado = rolNombre || 'usuario';
      const rolEncontrado = await Rol.findOne({ where: { nombre: nombreBuscado } });
      if (rolEncontrado) {
        rolAsignadoId = rolEncontrado.id;
      } else {
        const nuevoRol = await Rol.create({
          nombre: nombreBuscado,
          descripcion: `Rol ${nombreBuscado}`
        });
        rolAsignadoId = nuevoRol.id;
      }
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await Usuario.create({
      nombre,
      correo,
      password: hashedPassword,
      edad: edad ? parseInt(edad, 10) : null,
      rolId: rolAsignadoId
    });

    const usuarioConRol = await Usuario.findByPk(nuevoUsuario.id, {
      include: [{ model: Rol, as: 'rol' }],
      attributes: { exclude: ['password'] }
    });

    // Generar token JWT
    const token = jwt.sign(
      {
        id: usuarioConRol.id,
        correo: usuarioConRol.correo,
        rol: usuarioConRol.rol ? usuarioConRol.rol.nombre : null
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      token,
      usuario: usuarioConRol
    });
  } catch (error) {
    console.error('Error en register:', error);
    return res.status(500).json({
      mensaje: 'Error al registrar el usuario',
      error: error.message
    });
  }
};

/**
 * Inicio de sesión (Login)
 */
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({
        mensaje: 'Correo y contraseña son obligatorios'
      });
    }

    // Buscar al usuario con su rol asociado
    const usuario = await Usuario.findOne({
      where: { correo },
      include: [{ model: Rol, as: 'rol' }]
    });

    if (!usuario) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas (usuario no encontrado)'
      });
    }

    // Verificar contraseña
    const passwordValido = await bcrypt.compare(password, usuario.password || '');
    if (!passwordValido) {
      return res.status(401).json({
        mensaje: 'Credenciales inválidas (contraseña incorrecta)'
      });
    }

    // Generar token
    const token = jwt.sign(
      {
        id: usuario.id,
        correo: usuario.correo,
        rol: usuario.rol ? usuario.rol.nombre : null
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.status(200).json({
      mensaje: 'Inicio de sesión exitoso',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        correo: usuario.correo,
        edad: usuario.edad,
        rolId: usuario.rolId,
        rol: usuario.rol ? usuario.rol.nombre : 'sin_rol'
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({
      mensaje: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

/**
 * Obtener roles disponibles para registro
 */
const obtenerRoles = async (req, res) => {
  try {
    const roles = await Rol.findAll();
    return res.status(200).json(roles);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener roles',
      error: error.message
    });
  }
};

/**
 * Obtener todos los usuarios con sus roles
 */
const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [{ model: Rol, as: 'rol' }],
      attributes: { exclude: ['password'] }
    });
    return res.status(200).json(usuarios);
  } catch (error) {
    return res.status(500).json({
      mensaje: 'Error al obtener usuarios',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  obtenerRoles,
  obtenerUsuarios
};
