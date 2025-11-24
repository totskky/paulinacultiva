// controller/comment.js
const { Comment } = require("../models/Comment");
const { Post } = require("../models/Post");
const { User } = require("../models/User");
const { registrarBitacora, nivelesCriticidad } = require('../models/hooks/bitacora');
const NotificationService = require('../services/notificationService');

async function addComment(req, res) {
  const { postId } = req.params;
  const autorId = req.user.id;
  const { contenido } = req.body;
  if (!contenido) return res.status(400).json({ message: "Falta el contenido del comentario" });

  const post = await Post.findByPk(postId);
  if (!post) return res.status(404).json({ message: "Post no encontrado" });

  try {
    // Crear el comentario
    const comentario = await Comment.create({
      PostId: postId,
      autorId,
      contenido,
      fechaComentario: new Date()
    });

    // Obtener el comentario con la información del autor
    const comentarioCompleto = await Comment.findByPk(comentario.id, {
      include: [{
        model: User,
        as: 'autor',
        attributes: ['id', 'username']
      }]
    });

    // Formatear la respuesta para que coincida con lo que espera el frontend
    const comentarioFormateado = {
      id: comentarioCompleto.id,
      contenido: comentarioCompleto.contenido,
      texto: comentarioCompleto.contenido, // Para compatibilidad
      fecha: comentarioCompleto.fechaComentario,
      createdAt: comentarioCompleto.fechaComentario, // Para compatibilidad
      author: comentarioCompleto.autor || { // Importante: 'author' en lugar de 'autor'
        id: autorId,
        username: 'Usuario'
      },
      autor: comentarioCompleto.autor || { // Mantener también 'autor' por compatibilidad
        id: autorId,
        username: 'Usuario'
      },
      rating: 0
    };

    // Obtener el total de comentarios después de agregar el nuevo
    const totalComments = await Comment.count({
      where: { PostId: postId }
    });

    // Crear notificación si el comentario no es del autor del post
    if (post.autorId !== autorId) {
      await NotificationService.notifyPostComment(
        post.autorId,
        postId,
        comentario.id,
        autorId
      );
    }

    await registrarBitacora(req.app?.get('db') ?? null, {
      accion: 'create',
      entidad: 'comentario',
      entidad_id: comentario.id,
      usuario_id: req.user.id,
      antes: null,
      despues: comentario.toJSON(),
      criticidad: nivelesCriticidad.contenido,
      ip: req.ip,
      user_agent: req.get('User-Agent')
    });

    res.status(201).json({
      message: "Comentario agregado exitosamente",
      comment: comentarioFormateado,
      totalComments
    });
  } catch (error) {
    console.error('Error en addComment:', error);
    res.status(500).json({ message: "Error al agregar comentario" });
  }
}

async function getComments(req, res) {
  const { postId } = req.params;

  try {

    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    const comentarios = await Comment.findAll({
      where: {
        PostId: postId,
        estado: 'activo'  // Solo mostrar comentarios activos
      },
      include: [{
        model: User,
        as: 'autor',
        attributes: ['id', 'username']
      }],
      order: [['fechaComentario', 'ASC']]
    });


    // Formatear los comentarios para que coincidan con lo que espera el frontend
    const comentariosFormateados = comentarios.map(comment => ({
      id: comment.id,
      contenido: comment.contenido,
      texto: comment.contenido, // Para compatibilidad
      fecha: comment.fechaComentario,
      createdAt: comment.fechaComentario, // Para compatibilidad
      author: comment.autor || { // 'author' para compatibilidad
        id: comment.autorId,
        username: 'Usuario Anónimo'
      },
      autor: comment.autor || { // 'autor' para compatibilidad
        id: comment.autorId,
        username: 'Usuario Anónimo'
      },
      rating: 0
    }));

    res.json({
      comments: comentariosFormateados,
      totalComments: comentarios.length
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ message: "Error al obtener los comentarios" });
  }
}

async function deleteComment(req, res) {
  const { postId, commentId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el post existe
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    // Buscar el comentario
    const comment = await Comment.findByPk(commentId);
    if (!comment) return res.status(404).json({ message: "Comentario no encontrado" });

    // Verificar que el comentario pertenece al post
    if (comment.PostId !== parseInt(postId)) {
      return res.status(403).json({ message: "El comentario no pertenece a este post" });
    }

    // Verificar que el usuario es el autor del comentario
    if (comment.autorId !== userId) {
      return res.status(403).json({ message: "No tienes permiso para eliminar este comentario" });
    }

    // Eliminar el comentario
    await comment.destroy();

    // Obtener el nuevo total de comentarios
    const totalComments = await Comment.count({
      where: { PostId: postId }
    });

    res.json({
      message: "Comentario eliminado exitosamente",
      totalComments
    });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);
    res.status(500).json({ message: "Error al eliminar el comentario" });
  }
}

module.exports = {
  addComment,
  getComments,
  deleteComment
}