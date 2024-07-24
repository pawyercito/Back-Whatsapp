import Friends from '../../models/Friends.js';

export const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.query;

    if (!req.user.id) {
      return res.status(401).json({
        message: {
          description: 'No autorizado',
          code: 1
        }
      });
    }

    const userId = req.user.id;

    // Verificar si el usuario ya tiene una lista de amigos
    let userFriends = await Friends.findOne({ idUser: userId });

    if (!userFriends) {
      return res.status(404).json({
        message: {
          description: 'No se encontraron amigos para este usuario',
          code: 1
        }
      });
    }

    // Remover el amigo de la lista
    userFriends.friends = userFriends.friends.filter(friend => friend.toString() !== friendId);

    await userFriends.save();

    res.json({
      message: {
        description: 'Amigo eliminado correctamente',
        code: 0
      }
    });
  } catch (error) {
    console.error('Error eliminando amigo:', error);
    res.status(500).json({
      message: {
        description: 'Error interno del servidor',
        code: 1
      }
    });
  }
};
