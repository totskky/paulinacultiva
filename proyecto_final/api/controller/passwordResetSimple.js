// passwordResetSimple.js - Versión ultra simplificada sin problemas de dependencias
const { User } = require('../models');
const { sequelize } = require('../config/db');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

// Usamos una tabla simple en memoria para tokens (temporal para desarrollo)
const tokenStore = new Map();

const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email es requerido'
      });
    }

    // Buscar usuario por email
    const user = await User.findOne({ where: { email: email.trim() } });

    // Si no existe el usuario, no revelamos esta información por seguridad
    if (!user) {
      return res.status(200).json({
        success: true,
        message: 'Si el email está registrado, recibirás instrucciones para restablecer tu contraseña'
      });
    }

    // Generar token único
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Establecer expiración (1 hora)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Guardar en memoria (para desarrollo)
    tokenStore.set(resetToken, {
      userId: user.id,
      email: user.email,
      expiresAt: expiresAt.toISOString(),
      isUsed: false
    });


    res.status(200).json({
      success: true,
      message: 'Token de restablecimiento generado',
      resetToken,
      expiresIn: '1 hora',
      userId: user.id
    });

  } catch (error) {
    console.error('Error en requestPasswordReset:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token es requerido'
      });
    }


    // Buscar token en memoria
    const tokenData = tokenStore.get(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o no encontrado'
      });
    }

    // Verificar si no ha sido usado
    if (tokenData.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Este token ya ha sido utilizado'
      });
    }

    // Verificar si no ha expirado
    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicita un nuevo restablecimiento'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(tokenData.userId, {
      attributes: ['id', 'username', 'email']
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }


    res.status(200).json({
      success: true,
      message: 'Token válido',
      user: {
        id: user.id,
        username: user.username,
        email: user.email
      },
      expiresAt: tokenData.expiresAt
    });

  } catch (error) {
    console.error('Error en verifyResetToken:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar token'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y nueva contraseña son requeridos'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }


    // Buscar token en memoria
    const tokenData = tokenStore.get(token);

    if (!tokenData) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o no encontrado'
      });
    }

    // Verificaciones de seguridad
    if (tokenData.isUsed) {
      return res.status(400).json({
        success: false,
        message: 'Este token ya ha sido utilizado'
      });
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expiresAt);
    if (now > expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'Token expirado. Solicita un nuevo restablecimiento'
      });
    }

    // Buscar usuario
    const user = await User.findByPk(tokenData.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que la nueva contraseña no sea igual a la actual
    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña no puede ser igual a la actual'
      });
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Actualizar contraseña del usuario
    await user.update({ password: hashedPassword });

    // Marcar token como usado
    tokenData.isUsed = true;


    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada correctamente'
    });

  } catch (error) {
    console.error('Error en resetPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restablecer contraseña'
    });
  }
};

// Función para limpiar tokens expirados (llamar periódicamente)
const cleanExpiredTokens = () => {
  const now = new Date();
  for (const [token, data] of tokenStore.entries()) {
    if (new Date(data.expiresAt) < now) {
      tokenStore.delete(token);
    }
  }
};

// Limpiar tokens cada 5 minutos
setInterval(cleanExpiredTokens, 5 * 60 * 1000);

module.exports = {
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};