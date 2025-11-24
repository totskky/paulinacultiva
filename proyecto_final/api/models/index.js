// models/index.js
const { User } = require('./User');
const { Post } = require('./Post');
const { Comment } = require('./Comment');
const { Calification } = require('./Calification');
const { Bitacora } = require('./Bitacora');
const { DigitoVerificador } = require('./DigitoVerificador');
const PasswordResetToken = require('./PasswordResetToken');
const { Favorite } = require('./Favorite');
const { Notification } = require('./Notification');
const { Report } = require('./Report');

// Importar todos los modelos para que se definan
const models = {
  User,
  Post,
  Comment,
  Calification,
  Bitacora,
  DigitoVerificador,
  PasswordResetToken,
  Favorite,
  Notification,
  Report
};

// Configurar asociaciones
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Exportar todos los modelos
module.exports = {
  ...models,
  sequelize: require('../config/db').sequelize
};