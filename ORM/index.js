require('dotenv').config();
const express = require('express');
const cors = require('cors');
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

// Habilitar CORS para permitir peticiones desde el cliente React
app.use(cors());

// Middlewares para procesar el cuerpo de las peticiones
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta base de bienvenida / estado
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


// Función para iniciar el servidor y conectar la base de datos
const iniciarServidor = async () => {
  try {
    // Probar conexión a la base de datos MySQL
    await sequelize.authenticate();
    console.log('Conexión con la base de datos establecida con éxito.');

    app.listen(PORT, () => {
      console.log(`Servidor Express corriendo en http://localhost:${PORT}`);
      console.log(`Endpoints de libros disponibles en http://localhost:${PORT}/api/libros`);

      // Iniciar Cron Job automático de reportería diaria (cada 2 minutos)
      iniciarCronJobReportes();
    });
  } catch (error) {
    console.error('Error al conectar con la base de datos:', error.message);
  }
};

iniciarServidor();

module.exports = app;

