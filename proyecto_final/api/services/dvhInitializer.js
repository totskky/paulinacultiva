// services/dvhInitializer.js
const { recalcularTodo } = require('./digitoVerificadorService');

/**
 * Inicializar automáticamente todos los dígitos verificadores al iniciar la aplicación
 */
async function inicializarDigitosVerificadores(modelos) {

  try {

    const resultado = await recalcularTodo(modelos);

    if (resultado.success) {

      resultado.resultados.forEach((info) => {
      });

    } else {
      console.error('❌ Error al inicializar DVH:', resultado.errores);

      resultado.errores.forEach((error) => {
        console.error(`   ❌ ${error.tabla}: ${error.error}`);
      });
    }

    return resultado;
  } catch (error) {
    console.error('💥 Error crítico en inicialización de DVH:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  inicializarDigitosVerificadores
};