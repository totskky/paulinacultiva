require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { initDatabase, ensureTables, sequelize } = require('./config/db');


// Importar todos los modelos para asegurar que se definan
const {
  User,
  Post,
  Comment,
  Calification,
  Bitacora,
  Notification
} = require('./models');

// Controllers
const {
  getActiveUsers,
  registerUser,
  verifyEmail,
  login,
  me,
  createAdmin,
  getActiveUserProfile,
  changePassword,
  deleteAccount,
  deactivateAccount,
  updateUsername,
  requestPasswordReset,
  verifyResetCode,
  resetPassword,
  scheduleCleanup,
  reactivateAccount,
  permanentDeleteAccount,
  getInactiveAccountInfo
} = require('./controller/user');
const {
  createReport,
  getAllReports,
  updateReportStatus: updateUserReportStatus,
  getReportStats
} = require('./controller/reportController');
const {
  getReports: getModeratorReports,
  getInactiveUsers,
  updateReportStatus,
  toggleUserStatus,
  deleteContent,
  getModeratorStats
} = require('./controller/moderatorController');
const { addComment, getComments, deleteComment } = require('./controller/comment');
const { calificatePost, getUserRating } = require('./controller/calification');
const { toggleFavorite, getUserFavorites, checkFavorite } = require('./controller/favorite');
// Middlewares
const { isAuth, isAdmin, checkUserStatus } = require('./middlewares/auth');
const { isModerator, isModeratorOrSelf } = require('./middlewares/moderator');
const { canRatePost } = require('./middlewares/canRatePost');
const { contextMiddleware } = require('./middlewares/contextMiddleware');
const { getBitacora, getBitacoraById, limpiarBitacora, getEstadisticas } = require('./controller/bitacora');

// Controllers para posts (recetas)
const {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
  searchPosts
} = require('./controller/post');

// Importar multer para upload de archivos
const { uploadSingle } = require('./middlewares/upload');

// Controllers para verificación de integridad
const {
  verificarIntegridadUsuarios,
  verificarIntegridadPosts,
  verificarRegistro,
  verificacionCompleta
} = require('./controller/dvh/integrityController');

// Controllers para gestión de dígitos verificadores (nuevo sistema)
const {
  obtenerEstadoCompleto,
  verificarIntegridadTablaEspecifica,
  recalcularAbsolutamente,
  recalcularTabla,
  obtenerErroresRecientes
} = require('./controller/digitoVerificadorController');

// Inicializador de dígitos verificadores (temporalmente deshabilitado para evitar errores de inicio)
// const { inicializarDigitosVerificadores } = require('./services/dvhInitializer');

// Controllers para recuperación de contraseña (con envío de emails) - Comentado para evitar conflictos
// const {
//   requestPasswordReset,
//   verifyResetToken,
//   resetPassword
// } = require('./controller/passwordResetWithEmail');

// Controllers para administración de usuarios
const {
  getAllUsers,
  blockUser,
  unblockUser,
  deleteUser,
  getUserStats
} = require('./controller/adminController');

// Importar rutas
const adminRoutes = require('./routes/admin');
const verificationRoutes = require('./routes/verification');
const notificationRoutes = require('./routes/notifications');

const server = express();

// Crear servidor HTTP para Socket.IO
const httpServer = http.createServer(server);

// Configurar Socket.IO
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5179",
    methods: ["GET", "POST"]
  }
});

// Hacer io disponible globalmente para los controllers
global.io = io;

// Configurar eventos de Socket.IO
io.on('connection', (socket) => {
  // Eventos de notificaciones en tiempo real
  socket.on('like-post', (data) => {
    socket.to(`user-${data.postAuthorId}`).emit('post-liked', {
      postId: data.postId,
      userId: data.userId
    });
  });

  socket.on('new-comment', (data) => {
    socket.to(`user-${data.postAuthorId}`).emit('comment-added', {
      postId: data.postId,
      comment: data.comment
    });
  });
});


server.use(express.json());
server.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos de la carpeta uploads con CORS
const path = require('path');
server.use('/uploads', (req, res, next) => {
  // Agregar cabeceras CORS específicas para imágenes
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5179'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');

  next();
}, express.static(path.join(__dirname, 'uploads')));

// CORS para vite
server.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5179'];
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Disposition');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// Usuarios / Auth
server.get('/users', isAuth, getActiveUsers);
server.get('/me', isAuth, me);
server.get('/users/profile', isAuth, getActiveUserProfile);

server.post('/users', registerUser);
server.post('/verify-email', verifyEmail);
server.post('/login', login);
server.post('/admin/create', createAdmin);

// Gestión de contraseña y cuenta
server.post('/api/password/change', isAuth, changePassword);
server.delete('/api/password/delete-account', isAuth, deleteAccount);
server.delete('/api/password/deactivate-account', isAuth, deactivateAccount);
server.put('/api/username/update', isAuth, updateUsername);

// Recuperación de contraseña (copiado exactamente del registro)
server.post('/request-password-reset', requestPasswordReset);
server.post('/password-reset-request', requestPasswordReset); // Para compatibilidad con frontend
server.post('/verify-reset-code', verifyResetCode);
server.post('/reset-password', resetPassword);

// Gestión de cuentas desactivadas
server.post('/reactivate-account', reactivateAccount);
server.post('/permanent-delete-account', permanentDeleteAccount);
server.get('/inactive-account-info', getInactiveAccountInfo);

// Recuperación de contraseña (sistema antiguo con tokens - mantener por compatibilidad)
// server.post('/password-reset-request', requestPasswordReset);
// server.get('/password-reset/:token', verifyResetToken);
// server.post('/password-reset', resetPassword);

// Posts (ruta eliminada, usar /recipes en su lugar)
// server.post('/posts', isAuth, checkUserStatus, createPost);

// Comentarios
server.post('/posts/:postId/comments', isAuth, checkUserStatus, addComment);
server.get('/posts/:postId/comments', getComments);
server.delete('/posts/:postId/comments/:commentId', isAuth, checkUserStatus, deleteComment);
server.post('/recipes/:postId/comments', isAuth, checkUserStatus, addComment);
server.get('/recipes/:postId/comments', getComments);
server.delete('/recipes/:postId/comments/:commentId', isAuth, checkUserStatus, deleteComment);

// Reportes de comentarios
server.post('/recipes/:postId/comments/:commentId/report', isAuth, checkUserStatus, createReport);

// Reportes de publicaciones
server.post('/recipes/:postId/report', isAuth, checkUserStatus, createReport);

// Favoritos
server.post('/posts/:postId/favorites', isAuth, checkUserStatus, toggleFavorite);
server.get('/posts/:postId/favorites/check', isAuth, checkUserStatus, checkFavorite);
server.post('/recipes/:postId/favorites', isAuth, checkUserStatus, toggleFavorite);
server.get('/recipes/:postId/favorites/check', isAuth, checkUserStatus, checkFavorite);
server.get('/favorites', isAuth, checkUserStatus, getUserFavorites);

// Calificar
server.post('/posts/:postId/calification', isAuth, canRatePost, calificatePost);
server.get('/posts/:postId/calification', isAuth, getUserRating);
server.post('/recipes/:postId/calification', isAuth, canRatePost, calificatePost);
server.get('/recipes/:postId/calification', isAuth, getUserRating);

// Rutas para Posts (Recetas)
server.get('/recipes', getPosts);
server.get('/recipes/search', searchPosts);
server.get('/recipes/:id', getPostById);
server.post('/recipes', isAuth, checkUserStatus, uploadSingle, createPost);
server.put('/recipes/:id', isAuth, checkUserStatus, updatePost);
server.delete('/recipes/:id', isAuth, checkUserStatus, deletePost);

// Subida de imágenes
// server.post('/upload', isAuth, uploadImage, uploadImageHandler); // Temporalmente comentado

// Bitácora (solo administradores)
server.get('/bitacora', isAuth, isAdmin, getBitacora);
server.get('/bitacora/:id', isAuth, isAdmin, getBitacoraById);
server.get('/bitacora/estadisticas', isAuth, isAdmin, getEstadisticas);
server.delete('/bitacora/limpiar', isAuth, isAdmin, limpiarBitacora);

// Verificación de integridad de datos (DVH) - solo administradores
server.get('/integrity/usuarios', isAuth, isAdmin, verificarIntegridadUsuarios);
server.get('/integrity/posts', isAuth, isAdmin, verificarIntegridadPosts);
server.get('/integrity/:modelo/:id', isAuth, isAdmin, verificarRegistro);
server.get('/integrity/completa', isAuth, isAdmin, verificacionCompleta);

// Gestión mejorada de dígitos verificadores - solo administradores
server.get('/api/digitos-verificadores/estado', isAuth, isAdmin, obtenerEstadoCompleto);
server.get('/api/digitos-verificadores/integridad/:tabla', isAuth, isAdmin, verificarIntegridadTablaEspecifica);
server.post('/api/digitos-verificadores/recalcular-absoluto', isAuth, isAdmin, recalcularAbsolutamente);
server.post('/api/digitos-verificadores/recalcular/:tabla', isAuth, isAdmin, recalcularTabla);
server.get('/api/digitos-verificadores/errores', isAuth, isAdmin, obtenerErroresRecientes);

// Gestión de usuarios - solo moderadores
server.get('/api/moderator/users', isAuth, isModerator, getAllUsers);
server.get('/api/moderator/users/stats', isAuth, isModerator, getUserStats);

// Rutas de notificaciones
server.use('/api/notifications', notificationRoutes);

// Sistema de reportes (para usuarios)
server.post('/api/reports', isAuth, checkUserStatus, createReport);

// Panel de moderador
server.get('/api/moderator/reports', isAuth, isModerator, getModeratorReports);
server.get('/api/moderator/inactive-users', isAuth, isModerator, getInactiveUsers);
server.put('/api/moderator/reports/:id', isAuth, isModerator, updateReportStatus);
server.put('/api/moderator/users/:userId/status', isAuth, isModerator, toggleUserStatus);
server.delete('/api/moderator/content/:type/:id', isAuth, isModerator, deleteContent);
server.get('/api/moderator/stats', isAuth, isModerator, getModeratorStats);

// Verificación de email
server.use('/', verificationRoutes);

// Endpoint de prueba para verificar imágenes
server.get('/test-image', (req, res) => {
  const fs = require('fs');
  const path = require('path');

  const uploadsPath = path.join(__dirname, 'uploads');
  const files = fs.readdirSync(uploadsPath);

  res.json({
    uploadsPath,
    files,
    message: 'Files in uploads directory'
  });
});


async function startServer() {
  try {
    const sequelize = await initDatabase();
    await sequelize.sync({ force: false });

    // Inicializar automáticamente los dígitos verificadores (temporalmente deshabilitado)
    // await inicializarDigitosVerificadores({
    //   usuarios: User,
    //   posts: Post,
    //   comentarios: Comment,
    //   amistades: Friendship,
    //   calificaciones: Calification,
    //   bitacora: Bitacora
    // });

    // Iniciar sistema de limpieza automática de cuentas inactivas
    scheduleCleanup();

    httpServer.listen(3000, () => {
      console.log('El server se está ejecutando en el puerto 3000');
    });
  } catch (error) {
    console.error('✗ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

startServer();