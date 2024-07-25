import Friends from '../../models/Friends.js';


export const getAllFriends = async (req, res) => {
  try {
    const userFriends = await Friends.findOne({ idUser: req.user.id }).populate('friends', 'username profile.profile_picture');

    if (!userFriends) {
      return res.status(404).json({
        message: {
          description: 'This user has no friends',
          code: 1
        }
      });
    }

    res.json({
      message: {
        description: 'Friends obtained successfully',
        code: 0
      },
      data: userFriends.friends
    });
  } catch (error) {
    console.error('Error al obtener amigos:', error);
    res.status(500).json({
      message: {
        description: 'Error interno del servidor',
        code: 1
      }
    });
  }
};

