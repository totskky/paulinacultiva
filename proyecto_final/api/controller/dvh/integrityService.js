const { verificarDVH } = require('./dvh');
const { User, Post, Comment, Calification } = require('../../models');

/**
 * Servicio para verificar la integridad de los datos usando DVH
 */
class IntegrityService {
  /**
   * Verifica la integridad de todos los usuarios en la base de datos
   * @returns {Object} - Resultado de la verificación
   */
  static async verificarIntegridadUsuarios() {
    try {
      const usuarios = await User.findAll();
      const resultados = [];

      for (const usuario of usuarios) {
        const esValido = verificarDVH(usuario.dataValues);
        resultados.push({
          id: usuario.id,
          username: usuario.username,
          dvh: usuario.dvh,
          valido: esValido,
          error: esValido ? null : 'DVH no coincide - posible manipulación'
        });
      }

      const total = usuarios.length;
      const validos = resultados.filter(r => r.valido).length;
      const invalidos = total - validos;

      return {
        entidad: 'Usuarios',
        total,
        validos,
        invalidos,
        detalles: resultados
      };
    } catch (error) {
      throw new Error(`Error al verificar integridad de usuarios: ${error.message}`);
    }
  }

  /**
   * Verifica la integridad de todos los posts en la base de datos
   * @returns {Object} - Resultado de la verificación
   */
  static async verificarIntegridadPosts() {
    try {
      const posts = await Post.findAll();
      const resultados = [];

      for (const post of posts) {
        const esValido = verificarDVH(post.dataValues);
        resultados.push({
          id: post.id,
          titulo: post.titulo,
          dvh: post.dvh,
          valido: esValido,
          error: esValido ? null : 'DVH no coincide - posible manipulación'
        });
      }

      const total = posts.length;
      const validos = resultados.filter(r => r.valido).length;
      const invalidos = total - validos;

      return {
        entidad: 'Posts',
        total,
        validos,
        invalidos,
        detalles: resultados
      };
    } catch (error) {
      throw new Error(`Error al verificar integridad de posts: ${error.message}`);
    }
  }

  /**
   * Verifica la integridad de todos los comentarios
   * @returns {Object} - Resultado de la verificación
   */
  static async verificarIntegridadComentarios() {
    try {
      const comentarios = await Comment.findAll();
      const resultados = [];

      for (const comentario of comentarios) {
        const esValido = verificarDVH(comentario.dataValues);
        resultados.push({
          id: comentario.id,
          postId: comentario.PostId,
          autorId: comentario.autorId,
          dvh: comentario.dvh,
          valido: esValido,
          error: esValido ? null : 'DVH no coincide - posible manipulación'
        });
      }

      const total = comentarios.length;
      const validos = resultados.filter(r => r.valido).length;
      const invalidos = total - validos;

      return {
        entidad: 'Comentarios',
        total,
        validos,
        invalidos,
        detalles: resultados
      };
    } catch (error) {
      throw new Error(`Error al verificar integridad de comentarios: ${error.message}`);
    }
  }

  /**
   * Verifica la integridad de todas las calificaciones
   * @returns {Object} - Resultado de la verificación
   */
  static async verificarIntegridadCalificaciones() {
    try {
      const calificaciones = await Calification.findAll();
      const resultados = [];

      for (const calificacion of calificaciones) {
        const esValido = verificarDVH(calificacion.dataValues);
        resultados.push({
          id: calificacion.id,
          userId: calificacion.userId,
          postId: calificacion.postId,
          score: calificacion.score,
          dvh: calificacion.dvh,
          valido: esValido,
          error: esValido ? null : 'DVH no coincide - posible manipulación'
        });
      }

      const total = calificaciones.length;
      const validos = resultados.filter(r => r.valido).length;
      const invalidos = total - validos;

      return {
        entidad: 'Calificaciones',
        total,
        validos,
        invalidos,
        detalles: resultados
      };
    } catch (error) {
      throw new Error(`Error al verificar integridad de calificaciones: ${error.message}`);
    }
  }

  
  
  /**
   * Verifica la integridad de un registro específico
   * @param {string} modelo - Nombre del modelo (User, Post, Comment, etc)
   * @param {number} id - ID del registro
   * @returns {Object} - Resultado de la verificación
   */
  static async verificarRegistro(modelo, id) {
    try {
      let Modelo;
      switch (modelo.toLowerCase()) {
        case 'user':
        case 'usuario':
          Modelo = User;
          break;
        case 'post':
          Modelo = Post;
          break;
        case 'comment':
        case 'comentario':
          Modelo = Comment;
          break;
        case 'calification':
        case 'calificacion':
          Modelo = Calification;
          break;
        case 'friendship':
        case 'amistad':
          Modelo = Friendship;
          break;
        case 'permission':
        case 'permiso':
          Modelo = Permiso;
          break;
        default:
          throw new Error(`Modelo no soportado: ${modelo}. Modelos soportados: user, post, comment, calification, friendship, permission`);
      }

      const registro = await Modelo.findByPk(id);
      if (!registro) {
        throw new Error(`Registro no encontrado: ${modelo} con ID ${id}`);
      }

      const esValido = verificarDVH(registro.dataValues);

      return {
        entidad: modelo,
        id: registro.id,
        datos: registro.dataValues,
        dvh: registro.dvh,
        valido: esValido,
        error: esValido ? null : 'DVH no coincide - posible manipulación de datos'
      };
    } catch (error) {
      throw new Error(`Error al verificar registro: ${error.message}`);
    }
  }

  /**
   * Verificación completa de integridad de toda la base de datos
   * @returns {Object} - Resultado completo
   */
  static async verificacionCompleta() {
    try {
      const [usuarios, posts, comentarios, calificaciones] = await Promise.all([
        this.verificarIntegridadUsuarios(),
        this.verificarIntegridadPosts(),
        this.verificarIntegridadComentarios(),
        this.verificarIntegridadCalificaciones()
      ]);

      const totalRegistros = usuarios.total + posts.total + comentarios.total + calificaciones.total;
      const totalValidos = usuarios.validos + posts.validos + comentarios.validos + calificaciones.validos;
      const totalInvalidos = usuarios.invalidos + posts.invalidos + comentarios.invalidos + calificaciones.invalidos;

      return {
        timestamp: new Date().toISOString(),
        resumen: {
          totalRegistros,
          totalValidos,
          totalInvalidos,
          porcentajeIntegridad: totalRegistros > 0 ? (totalValidos / totalRegistros * 100).toFixed(2) : 0
        },
        detalle: {
          usuarios,
          posts,
          comentarios,
          calificaciones
        }
      };
    } catch (error) {
      throw new Error(`Error en verificación completa: ${error.message}`);
    }
  }
}

module.exports = IntegrityService;