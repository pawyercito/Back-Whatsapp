
import FriendRequest from '../../models/FriendRequest.js';

export const getFriendRequests = async (req, res) => {
    try {
      const friendRequests = await FriendRequest.find({ receiver: req.user.id, status: 'pending' })
        .populate('sender', 'username profile.profile_picture');
  
      res.json({
        message: {
          description: 'Friend requests obtained successfully',
          code: 0
        },
        data: friendRequests
      });
    } catch (error) {
      console.error('Error al obtener solicitudes de amistad:', error);
      res.status(500).json({
        message: {
          description: 'Error interno del servidor',
          code: 1
        }
      });
    }
  };
  