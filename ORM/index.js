require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const { sequelize } = require('./models');
const libroRoutes = require('./routes/libroRoutes');
const chatRoutes = require('./routes/chatRoutes');
const authRoutes = require('./routes/authRoutes');
const categoriaRoutes = require('./routes/categoriaRoutes');
const editorialRoutes = require('./routes/editorialRoutes');
const ejemplarRoutes = require('./routes/ejemplarRoutes');
const prestamoRoutes = require('./routes/prestamoRoutes');
const auditoriaRoutes = require('./routes/auditoriaRoutes');
const reservaRoutes = require('./routes/reservaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const asociadoRoutes = require('./routes/asociadoRoutes');
const { iniciarCronJobReportes } = require('./services/cronReporteService');

const app = express();
const PORT = process.env.PORT || 3000;

// Habilitar CORS para permitir peticiones desde cualquier cliente
app.use(cors());

// Middlewares para procesar el cuerpo de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/libros', libroRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/editoriales', editorialRoutes);
app.use('/api/ejemplares', ejemplarRoutes);
app.use('/api/prestamos', prestamoRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/asociados', asociadoRoutes);

// Servir frontend compilado de React si existe la carpeta dist
const distPath = path.resolve(__dirname, '../ReactCliente/ReactInicio/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  // Middleware catch-all para SPA compatible con Express 5
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api')) {
      return res.sendFile(path.join(distPath, 'index.html'));
    }
    next();
  });
} else {
  // Ruta base informativa cuando no se sirve la SPA
  app.get('/', (req, res) => {
    res.json({
      mensaje: 'API de Biblioteca funcionando correctamente',
      endpoints: {
        auth: '/api/auth',
        libros: '/api/libros',
        chat: '/api/chat',
        categorias: '/api/categorias',
        editoriales: '/api/editoriales',
        ejemplares: '/api/ejemplares',
        prestamos: '/api/prestamos',
        auditoria: '/api/auditoria',
        reservas: '/api/reservas',
        reportes: '/api/reportes',
        asociados: '/api/asociados'
      }
    });
  });
}

// Inicialización de roles y usuario administrador base
const inicializarDatosBase = async () => {
  try {
    const { Rol, Usuario } = require('./models');

    // 1. Crear roles base si no existen
    let [adminRol] = await Rol.findOrCreate({
      where: { nombre: 'admin' },
      defaults: { descripcion: 'Rol de administrador con acceso completo' }
    });
    await Rol.findOrCreate({
      where: { nombre: 'usuario' },
      defaults: { descripcion: 'Rol de usuario estándar' }
    });

    // 2. Crear usuario administrador inicial si no existe
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
    const adminExiste = await Usuario.findOne({ where: { correo: adminEmail } });

    if (!adminExiste) {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await Usuario.create({
        nombre: 'Administrador Principal',
        correo: adminEmail,
        password: hashedPassword,
        edad: 30,
        rolId: adminRol.id
      });
      console.log(`[INIT] Usuario administrador inicial creado: ${adminEmail}`);
    }
  } catch (err) {
    console.warn('[INIT] Advertencia al inicializar datos base:', err.message);
  }
};

// Función para iniciar el servidor y conectar la base de datos con reintentos
const iniciarServidor = async () => {
  const maxIntentos = 10;
  const esperaMs = 3000;

  for (let intento = 1; intento <= maxIntentos; intento++) {
    try {
      console.log(`[BD] Intentando conectar a MySQL (intento ${intento}/${maxIntentos})...`);
      await sequelize.authenticate();
      console.log('Conexión con la base de datos establecida con éxito.');

      // Sincronizar esquemas en la base de datos
      await sequelize.sync();
      console.log('Modelos sincronizados correctamente.');

      // Inicializar roles y admin
      await inicializarDatosBase();
      break;
    } catch (error) {
      console.error(`[BD] Intento ${intento}/${maxIntentos} falló: ${error.message}`);
      if (intento === maxIntentos) {
        console.error('[BD] Continuando inicio de servidor a pesar de fallas en la base de datos.');
      } else {
        await new Promise(r => setTimeout(r, esperaMs));
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor Express corriendo en el puerto ${PORT}`);
    console.log(`Endpoints de API disponibles en /api`);

    // Iniciar Cron Job automático de reportería diaria
    try {
      iniciarCronJobReportes();
    } catch (cronError) {
      console.warn('No se pudo iniciar cron de reportes:', cronError.message);
    }
  });
};

iniciarServidor();

module.exports = app;
