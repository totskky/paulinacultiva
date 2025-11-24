const { actualizarIntegridadCompleta } = require('../controller/dvh/dvh');
const {
  User,
  Post,
  Comment,
  Calification,
  DigitoVerificador
} = require('../models');

/**
 * Script para actualizar la integridad de datos de todas las tablas
 * Calcula DVH para cada registro y DVV para cada tabla
 */

async function actualizarIntegridadGeneral() {
  console.log('🚀 Iniciando actualización de integridad de datos...\n');

  try {
    // Sincronizar primero el modelo DigitoVerificador
    await DigitoVerificador.sync();

    // Configuración de tablas a procesar
    const tablas = [
      { modelo: User, nombre: 'Usuarios' },
      { modelo: Post, nombre: 'Posts' },
      { modelo: Comment, nombre: 'Comentarios' },
      { modelo: Calification, nombre: 'Calificaciones' }
    ];

    let totalRegistrosActualizados = 0;

    // Procesar cada tabla
    for (const tabla of tablas) {
      try {
        console.log(`📊 Procesando tabla: ${tabla.nombre}`);

        const resultado = await actualizarIntegridadCompleta(tabla.modelo, tabla.nombre);

        console.log(`✅ Tabla ${tabla.nombre} actualizada:`);
        console.log(`   - DVV calculado: ${resultado.dvv}`);
        console.log(`   - Registros procesados: ${resultado.registrosActualizados}`);

        totalRegistrosActualizados += resultado.registrosActualizados;

      } catch (error) {
        console.error(`❌ Error al procesar tabla ${tabla.nombre}:`, error.message);
      }

      console.log(''); // Línea en blanco para separación
    }

    console.log('🎉 Actualización de integridad completada!');
    console.log(`📈 Total de registros procesados: ${totalRegistrosActualizados}`);

    // Mostrar resumen de DVV calculados
    console.log('\n📋 Resumen de Dígito Verificador Vertical (DVV):');
    const dvvRegistros = await DigitoVerificador.findAll({
      where: { id_registro: 0 }, // Solo registros DVV
      order: [['nombre_tabla', 'ASC']]
    });

    for (const dvv of dvvRegistros) {
      console.log(`   - ${dvv.nombre_tabla}: ${dvv.dv} (${dvv.fecha_calculo.toLocaleString()})`);
    }

  } catch (error) {
    console.error('❌ Error fatal en la actualización de integridad:', error);
    throw error;
  }
}

/**
 * Verifica la integridad de los datos comparando DVH almacenados con los calculados
 */
async function verificarIntegridad() {
  console.log('🔍 Verificando integridad de datos...\n');

  try {
    const { verificarDVH } = require('../controller/dvh/dvh');

    const tablas = [
      { modelo: User, nombre: 'Usuarios' },
      { modelo: Post, nombre: 'Posts' },
      { modelo: Comment, nombre: 'Comentarios' },
      { modelo: Calification, nombre: 'Calificaciones' }
    ];

    let totalInconsistencias = 0;

    for (const tabla of tablas) {
      try {
        console.log(`🔍 Verificando tabla: ${tabla.nombre}`);

        const registros = await tabla.modelo.findAll();
        let inconsistencias = 0;

        for (const registro of registros) {
          const datos = registro.get({ plain: true });
          const dvhValido = verificarDVH(datos);

          if (!dvhValido) {
            inconsistencias++;
            totalInconsistencias++;
            console.log(`   ⚠️  Registro ID ${registro.id} con DVH inválido`);
          }
        }

        if (inconsistencias === 0) {
          console.log(`   ✅ Todos los registros de ${tabla.nombre} son válidos`);
        } else {
          console.log(`   ❌ ${inconsistencias} registros con DVH inválido en ${tabla.nombre}`);
        }

      } catch (error) {
        console.error(`❌ Error al verificar tabla ${tabla.nombre}:`, error.message);
      }

      console.log(''); // Línea en blanco para separación
    }

    if (totalInconsistencias === 0) {
      console.log('🎉 Todas las verificaciones de integridad son correctas!');
    } else {
      console.log(`⚠️  Se encontraron ${totalInconsistencias} inconsistencias en total`);
    }

  } catch (error) {
    console.error('❌ Error en la verificación de integridad:', error);
    throw error;
  }
}

// Si se ejecuta directamente
if (require.main === module) {
  const accion = process.argv[2];

  if (accion === 'verificar') {
    verificarIntegridad()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  } else {
    // Acción por defecto: actualizar integridad
    actualizarIntegridadGeneral()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error(error);
        process.exit(1);
      });
  }
}

module.exports = {
  actualizarIntegridadGeneral,
  verificarIntegridad
};