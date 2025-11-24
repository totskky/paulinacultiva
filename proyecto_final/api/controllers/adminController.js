const { User, Post, Comment, Calification, DigitoVerificador, PasswordResetToken } = require('../models');
const { agregarContexto } = require('../middlewares/contextMiddleware');

class AdminController {
  /**
   * Obtiene todos los usuarios con información detallada
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   */
  async getAllUsers(req, res) {
    try {
      const { page = 1, limit = 10, search = '', status = 'all' } = req.query;
      const offset = (page - 1) * limit;

      // Construir where clause
      let whereClause = {};
      if (search) {
        whereClause[User.sequelize.Sequelize.Op.or] = [
          {
            username: {
              [User.sequelize.Sequelize.Op.like]: `%${search}%`
            }
          },
          {
            email: {
              [User.sequelize.Sequelize.Op.like]: `%${search}%`
            }
          }
        ];
      }

      if (status !== 'all') {
        whereClause.estado = status;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        attributes: {
          exclude: ['password']
        },
        include: [
          {
            model: Post,
            as: 'posts',
            attributes: ['id'],
            required: false
          },
          {
            model: Comment,
            as: 'comments',
            attributes: ['id'],
            required: false
          },
          {
            model: Calification,
            as: 'califications',
            attributes: ['id'],
            required: false
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['createdAt', 'DESC']]
      });

      // Formatear datos para mostrar
      const formattedUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        estado: user.estado,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
        lastLogin: user.updatedAt,
        postsCount: user.posts?.length || 0,
        commentsCount: user.comments?.length || 0,
        calificationsCount: user.califications?.length || 0
      }));

      res.status(200).json({
        success: true,
        users: formattedUsers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalUsers: count,
          usersPerPage: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener usuarios'
      });
    }
  }

  /**
   * Elimina un usuario y todos sus datos asociados
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   */
  async deleteUser(req, res) {
    try {
      const { userId } = req.params;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
      }

      // Obtener el usuario a eliminar
      const user = await User.findByPk(userId, {
        include: [
          {
            model: Post,
            as: 'posts',
            attributes: ['id', 'titulo']
          },
          {
            model: Comment,
            as: 'comments',
            attributes: ['id']
          },
          {
            model: Calification,
            as: 'califications',
            attributes: ['id']
          }
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Evitar que un administrador se elimine a sí mismo
      if (userId === req.userId) {
        return res.status(403).json({
          success: false,
          message: 'No puedes eliminar tu propia cuenta desde aquí. Usa el perfil de usuario.'
        });
      }

      // Agregar contexto de la operación
      const opciones = agregarContexto(req);

      // Eliminar datos relacionados en orden correcto para evitar foreign key constraints
      try {
        // Primero eliminar tokens de restablecimiento de contraseña
        await PasswordResetToken.destroy({ where: { userId } });

        // Eliminar calificaciones del usuario
        await Calification.destroy({ where: { userId } });

        // Eliminar comentarios del usuario
        await Comment.destroy({ where: { autorId: userId } });

        // Eliminar posts del usuario
        await Post.destroy({ where: { autorId: userId } });

        // Finalmente eliminar el usuario
        await user.destroy(opciones);

      } catch (deleteError) {
        console.error('Error al eliminar usuario:', deleteError);
        throw new Error(`Error al eliminar usuario y datos relacionados: ${deleteError.message}`);
      }

      res.status(200).json({
        success: true,
        message: `Usuario "${user.username}" eliminado correctamente`,
        deletedUser: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Error en deleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuario'
      });
    }
  }

  /**
   * Cambia el estado de un usuario (activo/inactivo)
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   */
  async changeUserStatus(req, res) {
    try {
      const { userId } = req.params;
      const { estado } = req.body;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'ID de usuario es requerido'
        });
      }

      if (!['activo', 'inactivo', 'suspendido'].includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      // Evitar que un administrador se desactive a sí mismo
      if (userId === req.userId && estado !== 'activo') {
        return res.status(403).json({
          success: false,
          message: 'No puedes cambiar tu propio estado a inactivo o suspendido'
        });
      }

      // Agregar contexto de la operación
      const opciones = agregarContexto(req);

      const oldStatus = user.estado;
      await user.update({ estado }, opciones);

      res.status(200).json({
        success: true,
        message: `Estado del usuario "${user.username}" cambiado de "${oldStatus}" a "${estado}"`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          oldStatus,
          newStatus: estado
        }
      });

    } catch (error) {
      console.error('Error en changeUserStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cambiar estado del usuario'
      });
    }
  }

  /**
   * Obtiene estadísticas de usuarios
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   */
  async getUserStats(req, res) {
    try {
      // Usuarios totales
      const totalUsers = await User.count();

      // Usuarios por estado
      const usersByStatus = await User.findAll({
        attributes: [
          'estado',
          [User.sequelize.Sequelize.fn('COUNT', User.sequelize.Sequelize.col('id')), 'count']
        ],
        group: ['estado']
      });

      // Usuarios por rol
      const adminUsers = await User.count({
        where: { isAdmin: true }
      });

      const regularUsers = totalUsers - adminUsers;

      // Usuarios registrados en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentUsers = await User.count({
        where: {
          createdAt: {
            [User.sequelize.Sequelize.Op.gte]: thirtyDaysAgo
          }
        }
      });

      // Usuarios más activos (con más posts)
      const topActiveUsers = await User.findAll({
        attributes: [
          'id',
          'username',
          'email',
          [User.sequelize.Sequelize.fn('COUNT', User.sequelize.Sequelize.col('posts.id')), 'postsCount']
        ],
        include: [{
          model: Post,
          as: 'posts',
          attributes: []
        }],
        group: ['User.id'],
        order: [[User.sequelize.Sequelize.literal('postsCount'), 'DESC']],
        limit: 5
      });

      res.status(200).json({
        success: true,
        stats: {
          totalUsers,
          regularUsers,
          adminUsers,
          recentUsers,
          usersByStatus: usersByStatus.map(status => ({
            estado: status.estado,
            count: parseInt(status.dataValues.count)
          })),
          topActiveUsers: topActiveUsers.map(user => ({
            id: user.id,
            username: user.username,
            email: user.email,
            postsCount: parseInt(user.dataValues.postsCount)
          }))
        }
      });

    } catch (error) {
      console.error('Error en getUserStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }

  /**
   * Elimina usuarios masivamente
   * @param {Object} req - Request de Express
   * @param {Object} res - Response de Express
   */
  async bulkDeleteUsers(req, res) {
    try {
      const { userIds } = req.body;

      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Lista de IDs de usuarios es requerida'
        });
      }

      // Evitar que un administrador se elimine a sí mismo
      if (userIds.includes(req.userId)) {
        return res.status(403).json({
          success: false,
          message: 'No puedes incluir tu propio usuario en la eliminación masiva'
        });
      }

      // Obtener los usuarios a eliminar
      const users = await User.findAll({
        where: {
          id: userIds
        },
        attributes: ['id', 'username', 'email']
      });

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No se encontraron usuarios con los IDs proporcionados'
        });
      }

      // Agregar contexto de la operación
      const opciones = agregarContexto(req);

      let deletedCount = 0;
      const deletedUsers = [];

      // Eliminar cada usuario y sus datos relacionados
      for (const user of users) {
        try {
          await PasswordResetToken.destroy({ where: { userId: user.id } });
          await Calification.destroy({ where: { userId: user.id } });
          await Comment.destroy({ where: { autorId: user.id } });
          await Post.destroy({ where: { autorId: user.id } });
          await user.destroy(opciones);

          deletedCount++;
          deletedUsers.push({
            id: user.id,
            username: user.username,
            email: user.email
          });
        } catch (error) {
          console.error(`Error al eliminar usuario ${user.id}:`, error);
        }
      }

      res.status(200).json({
        success: true,
        message: `Se eliminaron ${deletedCount} usuarios correctamente`,
        deletedCount,
        requestedCount: userIds.length,
        deletedUsers
      });

    } catch (error) {
      console.error('Error en bulkDeleteUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar usuarios masivamente'
      });
    }
  }
}

module.exports = new AdminController();