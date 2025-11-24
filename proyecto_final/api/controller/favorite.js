const { Favorite } = require("../models/Favorite");
const { Post } = require("../models/Post");
const NotificationService = require('../services/notificationService');

async function toggleFavorite(req, res) {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    // Verificar que el post existe
    const post = await Post.findByPk(postId);
    if (!post) return res.status(404).json({ message: "Post no encontrado" });

    // Buscar si ya existe el favorito
    const existingFavorite = await Favorite.findOne({
      where: { userId, postId }
    });

    let isFavorite;
    if (existingFavorite) {
      // Si existe, eliminarlo
      await existingFavorite.destroy();
      isFavorite = false;
    } else {
      // Si no existe, crearlo
      await Favorite.create({ userId, postId });
      isFavorite = true;

      // Enviar notificación de favorito al autor del post
      if (post && post.autorId !== userId) {
        await NotificationService.notifyUser(
          post.autorId,
          'Nuevo favorito en tu receta',
          `Alguien agregó tu receta "${post.titulo}" a favoritos`,
          'favorite',
          userId,
          postId
        );
      }
    }

    // Contar el total de favoritos para este post
    const totalFavorites = await Favorite.count({
      where: { postId }
    });

    res.json({
      message: isFavorite ? "Agregado a favoritos" : "Eliminado de favoritos",
      isFavorite,
      totalFavorites
    });
  } catch (error) {
    console.error('Error al toggle favorito:', error);
    res.status(500).json({ message: "Error al procesar la solicitud" });
  }
}

async function getUserFavorites(req, res) {
  const userId = req.user.id;

  try {
    const favorites = await Favorite.findAll({
      where: { userId },
      include: [{
        model: Post,
        as: 'post'
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json(favorites.map(fav => fav.post));
  } catch (error) {
    console.error('Error al obtener favoritos:', error);
    res.status(500).json({ message: "Error al obtener los favoritos" });
  }
}

async function checkFavorite(req, res) {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const favorite = await Favorite.findOne({
      where: { userId, postId }
    });

    // Contar el total de favoritos para este post
    const totalFavorites = await Favorite.count({
      where: { postId }
    });

    res.json({
      isFavorite: !!favorite,
      totalFavorites
    });
  } catch (error) {
    console.error('Error al verificar favorito:', error);
    res.status(500).json({ message: "Error al verificar el favorito" });
  }
}

module.exports = {
  toggleFavorite,
  getUserFavorites,
  checkFavorite
}