import User from '../../models/User.js';
import FriendRequest from '../../models/FriendRequest.js';

export const addFriends = async (req, res) => {
  try {
    const { friendIds } = req.body;

    if (!req.user.id) {
      return res.status(401).json({
        message: {
          description: 'No autorizado',
          code: 1
        }
      });
    }

    const senderId = req.user.id;
    const warningDescriptions = [];

    for (const friendId of friendIds) {
      // Check if a friend request already exists
      const existingRequest = await FriendRequest.findOne({
        sender: senderId,
        receiver: friendId
      });

      if (existingRequest && existingRequest.status === 'pending') {
        warningDescriptions.push(`Ya existe una solicitud de amistad pendiente para el usuario`);
        continue; // Skip this friendId if a pending request already exists
      }

      // Create a new friend request if it doesn't already exist
      if (!existingRequest) {
        const friendRequest = new FriendRequest({
          sender: senderId,
          receiver: friendId
        });

        await friendRequest.save();
      }
    }

    if (warningDescriptions.length > 0) {
      return res.json({
        message: {
          description: `Algunas solicitudes de amistad no se pudieron enviar: ${warningDescriptions.join(', ')}`,
          code: 3
        }
      });
    }

    res.json({
      message: {
        description: 'Solicitudes de amistad enviadas correctamente',
        code: 0
      }
    });
  } catch (error) {
    console.error('Error al enviar solicitudes de amistad:', error);
    res.status(500).json({
      message: {
        description: 'Error interno del servidor',
        code: 1
      }
    });
  }
};
