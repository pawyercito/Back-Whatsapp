import Friends from '../../models/Friends.js';
import FriendRequest from '../../models/FriendRequest.js';

export const respondToFriendRequest = async (req, res) => {
  try {
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({
        message: {
          description: 'Solicitud inválida. Se requiere un array de userIds',
          code: 1
        }
      });
    }

    const receiverId = req.user.id;
    const friendRequests = await FriendRequest.find({
      receiver: receiverId,
      sender: { $in: userIds },
      status: 'pending'
    });

    if (friendRequests.length === 0) {
      return res.status(404).json({
        message: {
          description: 'No se encontraron solicitudes de amistad pendientes para los userIds proporcionados',
          code: 1
        }
      });
    }

    for (const friendRequest of friendRequests) {
      // Accept the friend request
      friendRequest.status = 'accepted';

      // Add the friend to the receiver's friends array
      let userFriends = await Friends.findOne({ idUser: receiverId });
      if (!userFriends) {
        userFriends = new Friends({
          idUser: receiverId,
          friends: [friendRequest.sender]
        });
      } else {
        if (!userFriends.friends.includes(friendRequest.sender)) {
          userFriends.friends.push(friendRequest.sender);
        }
      }
      await userFriends.save();

      // Also add the receiver to the sender's friends array
      let senderFriends = await Friends.findOne({ idUser: friendRequest.sender });
      if (!senderFriends) {
        senderFriends = new Friends({
          idUser: friendRequest.sender,
          friends: [receiverId]
        });
      } else {
        if (!senderFriends.friends.includes(receiverId)) {
          senderFriends.friends.push(receiverId);
        }
      }
      await senderFriends.save();

      await friendRequest.save();
    }

    res.json({
      message: {
        description: 'Solicitudes de amistad aceptadas',
        code: 0
      }
    });
  } catch (error) {
    console.error('Error al responder a las solicitudes de amistad:', error);
    res.status(500).json({
      message: {
        description: 'Error interno del servidor',
        code: 1
      }
    });
  }
};
