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

    for (const friendId of friendIds) {
      // Check if a friend request already exists
      const existingRequest = await FriendRequest.findOne({
        sender: senderId,
        receiver: friendId,
        status: 'pending'
      });

      if (existingRequest) {
        continue; // Skip this friendId if a pending request already exists
      }

      // Create a new friend request
      const friendRequest = new FriendRequest({
        sender: senderId,
        receiver: friendId
      });

      await friendRequest.save();
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