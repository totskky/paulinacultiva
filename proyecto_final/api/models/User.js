// models/User.js
const { sequelize } = require("../config/db");
const { DataTypes } = require('sequelize');
const { configurarHooksBitacora, nivelesCriticidad } = require('./hooks/bitacora');
const { agregarHooksDV } = require('../services/dvhHooksService');

const User = sequelize.define('Usuario', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'El nombre de usuario no puede estar vacío'
      },
      isValidUsername(value) {
        // Letras, números, guiones, guiones bajos y caracteres comunes
        const regex = /^[a-zA-Z0-9_\-|@#$%&*+=.?¡!¿]+$/;
        if (!regex.test(value)) {
          throw new Error('El nombre de usuario solo puede contener letras, números y caracteres especiales comunes (_, -, |, @, #, $, %, &, *, +, =, ., ?, ¡, !, ¿)');
        }
      },
      noSpaces(value) {
        if (/\s/.test(value)) {
          throw new Error('El nombre de usuario no puede contener espacios');
        }
      }
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      },
      isValidEmail(value) {
        if (value) {
          // Regex basado en las reglas de Gmail/Google:
          // - Letras, números, puntos (.)
          // - Signos + permitidos antes del @
          // - No puede empezar ni terminar con punto
          // - No puede tener puntos consecutivos
          const regex = /^[a-zA-Z0-9]+([._+][a-zA-Z0-9]+)*@[a-zA-Z0-9-]+\.[a-zA-Z]{2,}$/;
          if (!regex.test(value)) {
            throw new Error('El email solo puede contener letras, números, puntos (.), guiones bajos (_) y el signo más (+)');
          }
        }
      },
      noSpaces(value) {
        if (value && /\s/.test(value)) {
          throw new Error('El email no puede contener espacios');
        }
      }
    }
  },
  estado: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'activo'
  },
  role: {
    type: DataTypes.ENUM('user', 'moderator'),
    allowNull: false,
    defaultValue: 'user'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verificationCode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: 'Código de verificación de email'
  },
  verificationCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del código de verificación'
  },
  passwordResetCode: {
    type: DataTypes.STRING(6),
    allowNull: true,
    comment: 'Código de recuperación de contraseña'
  },
  passwordResetCodeExpires: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del código de recuperación'
  },
  dvh: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 6
    }
  }
}, {
  timestamps: true,
  tableName: 'Usuarios'
});

// Configurar hooks de bitácora para el modelo Usuario (temporalmente deshabilitado)
// configurarHooksBitacora(User, 'Usuario', {
//   criticidad: nivelesCriticidad.seguridad, // Operaciones de usuarios son de seguridad
//   registrarCreacion: true,
//   registrarModificacion: true,
//   registrarBorrado: true
// });

// Configurar hooks de DVH para el modelo Usuario (temporalmente deshabilitado)
agregarHooksDV(User, 'usuarios');

// Definir asociaciones
User.associate = (models) => {
    User.hasMany(models.Comment, {
        foreignKey: 'autorId',
        as: 'comentarios',
        onDelete: 'CASCADE'
    });
    User.hasMany(models.Post, {
        foreignKey: 'autorId',
        as: 'posts',
        onDelete: 'CASCADE'
    });
    User.hasMany(models.Favorite, {
        foreignKey: 'userId',
        as: 'favorites',
        onDelete: 'CASCADE'
    });
    User.hasMany(models.Notification, {
        foreignKey: 'userId',
        as: 'notifications',
        onDelete: 'CASCADE'
    });
};

module.exports = User;
module.exports.User = User;