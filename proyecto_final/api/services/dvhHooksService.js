// services/dvhHooksService.js
const { actualizarDigitosVerificadores, verificarIntegridadTabla, registrarErrorIntegridad } = require('./digitoVerificadorService');

/**
 * Agregar hooks automáticos de DVH a un modelo
 */
function agregarHooksDV(modelo, nombreTabla) {
  // Hook afterCreate - después de crear un registro
  modelo.addHook('afterCreate', async (registro, options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterCreate para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterCreate: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  // Hook afterUpdate - después de actualizar un registro
  modelo.addHook('afterUpdate', async (registro, options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterUpdate para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterUpdate: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  // Hook afterDestroy - después de eliminar un registro
  modelo.addHook('afterDestroy', async (registro, options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterDestroy para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterDestroy: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  // Hook afterBulkCreate - después de crear múltiples registros
  modelo.addHook('afterBulkCreate', async (registros, options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterBulkCreate para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterBulkCreate: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  // Hook afterBulkUpdate - después de actualizar múltiples registros
  modelo.addHook('afterBulkUpdate', async (options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterBulkUpdate para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterBulkUpdate: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  // Hook afterBulkDestroy - después de eliminar múltiples registros
  modelo.addHook('afterBulkDestroy', async (options) => {
    try {
      await actualizarDigitosVerificadores(modelo, nombreTabla);
    } catch (error) {
      console.warn(`⚠️ Error en hook afterBulkDestroy para DV de ${nombreTabla}:`, error.message);
      await registrarErrorIntegridad(
        nombreTabla,
        `Error afterBulkDestroy: ${error.message}`,
        options.usuarioId,
        options.ip
      );
    }
  });

  }

/**
 * Verificar integridad periódicamente (opcional para tareas programadas)
 */
async function verificarIntegridadPeriodica(modelos) {
  const resultados = [];

  for (const [nombreTabla, modelo] of Object.entries(modelos)) {
    try {
      const resultado = await verificarIntegridadTabla(modelo, nombreTabla);
      resultados.push({
        tabla: nombreTabla,
        integridad: resultado.integridad,
        sumaAlmacenada: resultado.sumaAlmacenada,
        sumaCalculada: resultado.sumaCalculada,
        requiereRecalculo: resultado.requiereRecalculo
      });

      if (!resultado.integridad) {
        console.error(`❌ Error de integridad detectado en ${nombreTabla}:`, resultado);
        await registrarErrorIntegridad(nombreTabla, resultado);
      }
    } catch (error) {
      console.error(`Error al verificar integridad de ${nombreTabla}:`, error);
      resultados.push({
        tabla: nombreTabla,
        integridad: false,
        error: error.message
      });
    }
  }

  return resultados;
}

module.exports = {
  agregarHooksDV,
  verificarIntegridadPeriodica
};