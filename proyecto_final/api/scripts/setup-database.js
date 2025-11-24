#!/usr/bin/env node

/**
 * Script de instalación y actualización de la base de datos
 * Uso: node setup-database.js [--force] [--seed]
 * Opciones:
 *   --force: Elimina y recrea todas las tablas (PELIGROSO)
 *   --seed: Inserta datos de ejemplo
 */

const mysql = require('mysql2/promise');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Configuración de la base de datos
const DB_NAME = process.env.DB_NAME || 'paulinacultiva';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || '';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_DIALECT = 'mysql';

// Variables del script
const args = process.argv.slice(2);
const FORCE_RECREATE = args.includes('--force');
const INSERT_SEED_DATA = args.includes('--seed');

console.log('🚀 Iniciando script de instalación de base de datos...');
console.log(`📊 Base de datos: ${DB_NAME}`);
console.log(`🔗 Host: ${DB_HOST}`);
console.log(`⚡ Force recreate: ${FORCE_RECREATE}`);
console.log(`🌱 Seed data: ${INSERT_SEED_DATA}`);

async function createConnection() {
  return mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true
  });
}

async function createSequelize() {
  return new Sequelize(DB_NAME, DB_USER, DB_PASS, {
    host: DB_HOST,
    dialect: DB_DIALECT,
    logging: console.log,
    define: {
      timestamps: true,
      underscored: false
    }
  });
}

async function createDatabase(connection) {
  console.log(`📁 Creando base de datos "${DB_NAME}" si no existe...`);

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
    console.log('✅ Base de datos creada/verificada exitosamente');
  } catch (error) {
    console.error('❌ Error al crear base de datos:', error);
    throw error;
  }
}

async function createTables(sequelize) {
  console.log('📋 Creando/Verificando tablas...');

  // Importar todos los modelos
  const {
    User,
    Post,
    Comment,
    Calification,
    Bitacora,
    Notification,
    Favorite,
    Report,
    DigitoVerificador,
    PasswordResetToken
  } = require('../models');

  const models = {
    User,
    Post,
    Comment,
    Calification,
    Bitacora,
    Notification,
    Favorite,
    Report,
    DigitoVerificador,
    PasswordResetToken
  };

  try {
    if (FORCE_RECREATE) {
      console.log('⚠️  Forzando recreación de todas las tablas...');
      await sequelize.sync({ force: true });
    } else {
      console.log('🔄 Sincronizando tablas (preservando datos existentes)...');
      await sequelize.sync({ alter: true });
    }

    console.log('✅ Tablas sincronizadas exitosamente');

    // Verificar que las tablas existan
    const qi = sequelize.getQueryInterface();
    for (const [name, model] of Object.entries(models)) {
      const tableName = model.getTableName ? model.getTableName() : model.tableName || name;
      try {
        await qi.describeTable(tableName);
        console.log(`  ✅ Tabla verificada: ${tableName}`);
      } catch (error) {
        console.error(`  ❌ Error verificando tabla ${tableName}:`, error.message);
      }
    }

  } catch (error) {
    console.error('❌ Error al crear tablas:', error);
    throw error;
  }
}

async function runMigrations(sequelize) {
  console.log('🔄 Ejecutando migraciones...');

  try {
    const fs = require('fs');
    const path = require('path');

    const migrationsDir = path.join(__dirname, '../migrations');

    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 Directorio de migraciones no encontrado, omitiendo...');
      return;
    }

    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    for (const file of migrationFiles) {
      console.log(`📝 Ejecutando migración: ${file}`);
      try {
        const migration = require(path.join(migrationsDir, file));
        if (typeof migration === 'function') {
          await migration(sequelize, Sequelize.DataTypes);
          console.log(`  ✅ Migración ${file} completada`);
        }
      } catch (error) {
        console.warn(`  ⚠️ Error en migración ${file}:`, error.message);
      }
    }

    console.log('✅ Migraciones completadas');
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
  }
}

async function insertSeedData(sequelize) {
  if (!INSERT_SEED_DATA) {
    console.log('🌱 Omitiendo inserción de datos de ejemplo');
    return;
  }

  console.log('🌱 Insertando datos de ejemplo...');

  try {
    const { User } = require('../models');
    const bcrypt = require('bcryptjs');

    // Verificar si ya hay usuarios
    const userCount = await User.count();
    if (userCount > 0) {
      console.log(`📊 Ya existen ${userCount} usuarios, omitiendo seed data`);
      return;
    }

    // Crear usuario administrador
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      isAdmin: true,
      estado: 'activo',
      emailVerified: true
    });

    // Crear usuario moderador
    const moderatorPassword = await bcrypt.hash('mod123', 10);

    await User.create({
      username: 'moderator',
      email: 'moderator@example.com',
      password: moderatorPassword,
      isModerator: true,
      estado: 'activo',
      emailVerified: true
    });

    // Crear usuario regular
    const userPassword = await bcrypt.hash('user123', 10);

    await User.create({
      username: 'usuario',
      email: 'usuario@example.com',
      password: userPassword,
      estado: 'activo',
      emailVerified: true
    });

    console.log('✅ Datos de ejemplo insertados exitosamente');
    console.log('👤 Usuarios creados:');
    console.log('  - admin@example.com (admin123) - Administrador');
    console.log('  - moderator@example.com (mod123) - Moderador');
    console.log('  - usuario@example.com (user123) - Usuario regular');

  } catch (error) {
    console.error('❌ Error al insertar datos de ejemplo:', error);
  }
}

async function verifySetup(sequelize) {
  console.log('🔍 Verificando instalación...');

  try {
    // Probar conexión
    await sequelize.authenticate();
    console.log('✅ Conexión a base de datos verificada');

    // Contar registros en tablas principales
    const { User, Post, Comment, Report } = require('../models');

    const stats = {
      users: await User.count(),
      posts: await Post.count(),
      comments: await Comment.count(),
      reports: await Report.count()
    };

    console.log('📊 Estadísticas de la base de datos:');
    console.log(`  - Usuarios: ${stats.users}`);
    console.log(`  - Posts: ${stats.posts}`);
    console.log(`  - Comentarios: ${stats.comments}`);
    console.log(`  - Reportes: ${stats.reports}`);

    return true;
  } catch (error) {
    console.error('❌ Error en verificación:', error);
    return false;
  }
}

async function main() {
  let connection = null;
  let sequelize = null;

  try {
    // 1. Crear conexión MySQL sin especificar base de datos
    connection = await createConnection();

    // 2. Crear base de datos si no existe
    await createDatabase(connection);

    // 3. Cerrar conexión temporal
    await connection.end();

    // 4. Crear conexión Sequelize con la base de datos
    sequelize = await createSequelize();

    // 5. Crear/sincronizar tablas
    await createTables(sequelize);

    // 6. Ejecutar migraciones
    await runMigrations(sequelize);

    // 7. Insertar datos de ejemplo (si se solicitó)
    await insertSeedData(sequelize);

    // 8. Verificar instalación
    const success = await verifySetup(sequelize);

    if (success) {
      console.log('🎉 ¡Instalación completada exitosamente!');
      console.log('🚀 Base de datos lista para usar');
    } else {
      console.error('❌ La instalación tuvo errores');
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Error crítico en la instalación:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (sequelize) {
      await sequelize.close();
    }
    if (connection) {
      await connection.end();
    }
  }
}

// Manejar interrupción del script
process.on('SIGINT', async () => {
  console.log('\n🛑 Script interrumpido por el usuario');
  process.exit(0);
});

// Ejecutar script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error no manejado:', error);
    process.exit(1);
  });
}

module.exports = { main };