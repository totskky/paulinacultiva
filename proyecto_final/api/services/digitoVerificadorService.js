// services/digitoVerificadorService.js

/**
 * Calcular DVH (Dígito Verificador Horizontal) para un registro
 */
function calcularDVH(registro) {
  const datos = Object.entries(registro)
    .filter(([key, _]) => key !== 'dvh' && key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
    .map(([_, v]) => (v === null || v === undefined) ? '' : String(v));

  const str = datos.join('');
  let suma = 0;
  for (let i = 0; i < str.length; i++) {
    suma += str.charCodeAt(i);
  }
  return suma % 7;
}

/**
 * Actualizar DVH para todos los registros de una tabla
 */
async function actualizarDVH(modelo) {
  try {
    const registros = await modelo.findAll();

    for (const registro of registros) {
      const dvhCalculado = calcularDVH(registro.dataValues);

      if ((registro.dvh || null) !== dvhCalculado) {
        await registro.update({ dvh: dvhCalculado });
      }
    }

    return { success: true, registrosActualizados: registros.length };
  } catch (error) {
    console.error('Error al actualizar DVH:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Calcular y actualizar DVV (Dígito Verificador Vertical) para una tabla
 */
async function actualizarDVV(modelo, nombreTabla) {
  try {
    const registros = await modelo.findAll({ attributes: ['dvh'] });
    const sumaDVH = registros.reduce((acc, registro) => {
      return acc + (Number(registro.dvh) || 0);
    }, 0);

    // Importar modelos dinámicamente para evitar dependencias circulares
    const { DigitoVerificador } = require("../models");

    if (DigitoVerificador) {
      await DigitoVerificador.upsert({
        nombre_tabla: nombreTabla,
        suma_dvh: sumaDVH,
        fecha_calculo: new Date()
      });
    }

    return { success: true, sumaDVH, tabla: nombreTabla };
  } catch (error) {
    console.error('Error al actualizar DVV:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Actualizar DVH y DVV para una tabla completa
 */
async function actualizarDigitosVerificadores(modelo, nombreTabla) {
  try {
    // Primero actualizar DVH de todos los registros
    const resultadoDVH = await actualizarDVH(modelo);

    if (!resultadoDVH.success) {
      return resultadoDVH;
    }

    // Luego actualizar DVV
    const resultadoDVV = await actualizarDVV(modelo, nombreTabla);

    return {
      success: resultadoDVV.success,
      dvh: resultadoDVH,
      dvv: resultadoDVV
    };
  } catch (error) {
    console.error('Error al actualizar dígitos verificadores:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Verificar integridad de una tabla
 */
async function verificarIntegridadTabla(modelo, nombreTabla) {
  try {
    // Importar modelos dinámicamente para evitar dependencias circulares
    const { DigitoVerificador } = require("../models");

    // Obtener DVV almacenado
    let registroDVV = null;
    if (DigitoVerificador) {
      registroDVV = await DigitoVerificador.findOne({
        where: { nombre_tabla: nombreTabla }
      });
    }

    if (!registroDVV) {
      return {
        integridad: false,
        error: `No se encuentra registro DVV para la tabla ${nombreTabla}`,
        requiereRecalculo: true
      };
    }

    // Calcular DVV actual
    const resultadoDVV = await actualizarDVV(modelo, nombreTabla);

    if (!resultadoDVV.success) {
      return {
        integridad: false,
        error: resultadoDVV.error,
        requiereRecalculo: true
      };
    }

    const integridadOK = registroDVV.suma_dvh === resultadoDVV.sumaDVH;

    return {
      integridad: integridadOK,
      sumaAlmacenada: registroDVV.suma_dvh,
      sumaCalculada: resultadoDVV.sumaDVH,
      tabla: nombreTabla,
      fechaUltimoCalculo: registroDVV.fecha_calculo,
      requiereRecalculo: !integridadOK
    };
  } catch (error) {
    return {
      integridad: false,
      error: error.message,
      requiereRecalculo: true
    };
  }
}

/**
 * Verificar integridad de todos los registros individualmente
 */
async function verificarIntegridadDetallada(modelo, nombreTabla) {
  try {
    const registros = await modelo.findAll();
    const errores = [];

    for (const registro of registros) {
      const dvhCalculado = calcularDVH(registro.dataValues);
      const dvhAlmacenado = registro.dvh;

      if (dvhCalculado !== dvhAlmacenado) {
        errores.push({
          id: registro.id,
          dvhAlmacenado,
          dvhCalculado,
          registro: registro.dataValues
        });
      }
    }

    return {
      totalRegistros: registros.length,
      registrosConErrores: errores.length,
      errores,
      integridadOK: errores.length === 0
    };
  } catch (error) {
    return {
      integridadOK: false,
      error: error.message,
      totalRegistros: 0,
      registrosConErrores: 0,
      errores: []
    };
  }
}

/**
 * Registrar error de integridad en bitácora
 */
async function registrarErrorIntegridad(nombreTabla, errorDetalles, usuarioId = null, ip = null) {
  try {
    // Importar modelos dinámicamente para evitar dependencias circulares
    const { Bitacora } = require("../models");

    if (Bitacora) {
      await Bitacora.create({
        accion: 'ERROR_INTEGRIDAD_DVH',
        entidad: nombreTabla,
        entidad_id: 'SISTEMA',
        usuario_id: usuarioId,
        antes: errorDetalles,
        criticidad: 3, // Alta criticidad
        ip: ip || 'SISTEMA',
        user_agent: 'DIGITO_VERIFICADOR_SERVICE'
      });
    }
  } catch (error) {
    console.error('Error al registrar error de integridad en bitácora:', error);
  }
}

/**
 * Recalcular absolutamente todos los dígitos verificadores
 */
async function recalcularTodo(modelos) {
  const resultados = [];
  const errores = [];

  for (const [nombreTabla, modelo] of Object.entries(modelos)) {
    try {

      const resultado = await actualizarDigitosVerificadores(modelo, nombreTabla);

      if (resultado.success) {
        resultados.push({
          tabla: nombreTabla,
          exito: true,
          registrosActualizados: resultado.dvh?.registrosActualizados || 0,
          sumaDVH: resultado.dvv?.sumaDVH || 0
        });

      } else {
        errores.push({
          tabla: nombreTabla,
          error: resultado.error
        });

        console.error(`❌ ${nombreTabla}: ${resultado.error}`);

        // Registrar error en bitácora
        await registrarErrorIntegridad(nombreTabla, resultado.error);
      }
    } catch (error) {
      const errorMsg = `Error crítico al recalcular ${nombreTabla}: ${error.message}`;
      errores.push({
        tabla: nombreTabla,
        error: errorMsg
      });

      console.error(`❌ ${nombreTabla}: ${errorMsg}`);

      // Registrar error en bitácora
      await registrarErrorIntegridad(nombreTabla, errorMsg);
    }
  }

  return {
    success: errores.length === 0,
    tablasProcesadas: resultados.length,
    errores,
    resultados
  };
}

module.exports = {
  calcularDVH,
  actualizarDVH,
  actualizarDVV,
  actualizarDigitosVerificadores,
  verificarIntegridadTabla,
  verificarIntegridadDetallada,
  registrarErrorIntegridad,
  recalcularTodo
};