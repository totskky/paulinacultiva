const { User } = require('../models');

// Middleware para verificar si el usuario es moderador
const isModerator = async (req, res, next) => {

  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }


    const user = await User.findByPk(req.user.id);

    if (!user || user.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    if (user.role !== 'moderator') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requiere rol de moderador'
      });
    }


    req.moderator = user;
    next();
  } catch (error) {
    console.error('Error en middleware de moderador:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

// Middleware para verificar si es moderador o el propio usuario
const isModeratorOrSelf = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado'
      });
    }

    const user = await User.findByPk(req.user.id);
    const targetUserId = req.params.userId || req.params.id;

    if (!user || user.estado !== 'activo') {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    // Permitir si es moderador o si es el propio usuario
    if (user.role === 'moderator' || user.id === parseInt(targetUserId)) {
      req.moderator = user;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Acceso denegado'
    });
  } catch (error) {
    console.error('Error en middleware isModeratorOrSelf:', error);
    res.status(500).json({
      success: false,
      message: 'Error del servidor'
    });
  }
};

module.exports = {
  isModerator,
  isModeratorOrSelf
};