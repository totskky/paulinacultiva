const nivelesCriticidad = {
  seguridad: 1,      // Operaciones críticas de seguridad
  administracion: 2, // Operaciones administrativas
  contenido: 3       // Operaciones de contenido
};

const registrarBitacora = async (sequelizeInstance, {
  accion,
  entidad,
  entidad_id = null,
  usuario_id = null,
  antes = null,
  despues = null,
  criticidad = nivelesCriticidad.contenido,
  ip = null,
  user_agent = null,
  transaction = null
}) => {
  try {
    // Importar Bitacora dinámicamente para evitar dependencias circulares
    const { Bitacora } = require('../Bitacora');

    await Bitacora.create({
      accion,
      entidad,
      entidad_id: entidad_id?.toString() ?? null,
      usuario_id,
      antes,
      despues,
      criticidad,
      ip,
      user_agent
    }, { transaction });
  } catch (err) {
    // Evitar bucles infinitos: si el error es en la bitácora, no registrar
    if (entidad !== 'Bitacora') {
      console.error('Error en bitácora:', err.message);
    }
  }
};

// Función para obtener usuario del contexto
const obtenerUsuarioContexto = (options) => {
  return options?.context?.usuario_id || null;
};

// Función para obtener metadata del request
const obtenerMetadataRequest = (options) => {
  return {
    ip: options?.context?.ip || null,
    user_agent: options?.context?.user_agent || null
  };
};

// Hook genérico para afterCreate
const afterCreateHook = (modelName, criticidad = nivelesCriticidad.contenido) => {
  return async (instance, options) => {
    try {

      const usuario_id = obtenerUsuarioContexto(options);
      const metadata = obtenerMetadataRequest(options);

      const datos = instance.get({ plain: true });


      await registrarBitacora(instance.constructor.sequelize, {
        accion: 'CREAR',
        entidad: modelName,
        entidad_id: instance.id,
        usuario_id,
        antes: null,
        despues: datos,
        criticidad,
        ...metadata,
        transaction: options.transaction
      });

    } catch (error) {
      console.error(`❌ Error en afterCreate hook para ${modelName}:`, error);
    }
  };
};

// Hook genérico para afterUpdate
const afterUpdateHook = (modelName, criticidad = nivelesCriticidad.contenido) => {
  return async (instance, options) => {
    try {
      const usuario_id = obtenerUsuarioContexto(options);
      const metadata = obtenerMetadataRequest(options);

      const datosActuales = instance.get({ plain: true });

      // Obtener los datos anteriores si están disponibles en _changed
      const datosAnteriores = instance._previousDataValues || {};

      await registrarBitacora(instance.constructor.sequelize, {
        accion: 'MODIFICAR',
        entidad: modelName,
        entidad_id: instance.id,
        usuario_id,
        antes: datosAnteriores,
        despues: datosActuales,
        criticidad,
        ...metadata,
        transaction: options.transaction
      });
    } catch (error) {
      console.error(`Error en afterUpdate hook para ${modelName}:`, error);
    }
  };
};

// Hook genérico para afterDestroy
const afterDestroyHook = (modelName, criticidad = nivelesCriticidad.contenido) => {
  return async (instance, options) => {
    try {
      const usuario_id = obtenerUsuarioContexto(options);
      const metadata = obtenerMetadataRequest(options);

      const datos = instance.get({ plain: true });

      await registrarBitacora(instance.constructor.sequelize, {
        accion: 'BORRAR',
        entidad: modelName,
        entidad_id: instance.id,
        usuario_id,
        antes: datos,
        despues: null,
        criticidad,
        ...metadata,
        transaction: options.transaction
      });
    } catch (error) {
      console.error(`Error en afterDestroy hook para ${modelName}:`, error);
    }
  };
};

// Función para configurar hooks en un modelo
const configurarHooksBitacora = (modelo, modelName, opciones = {}) => {
  const {
    criticidad = nivelesCriticidad.contenido,
    registrarCreacion = true,
    registrarModificacion = true,
    registrarBorrado = true
  } = opciones;

  if (registrarCreacion) {
    modelo.afterCreate(afterCreateHook(modelName, criticidad));
  }

  if (registrarModificacion) {
    modelo.afterUpdate(afterUpdateHook(modelName, criticidad));
  }

  if (registrarBorrado) {
    modelo.afterDestroy(afterDestroyHook(modelName, criticidad));
  }
};

module.exports = {
  registrarBitacora,
  nivelesCriticidad,
  configurarHooksBitacora,
  afterCreateHook,
  afterUpdateHook,
  afterDestroyHook,
  obtenerUsuarioContexto,
  obtenerMetadataRequest
};
