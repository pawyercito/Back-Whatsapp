import User from '../../models/User.js';

export const getAllUsers = async (req, res) => {
    try {
      const users = await User.find().select('username profile.profile_picture').sort('username');
  
      res.json({
        message: {
          description: 'Usuarios obtenidos correctamente',
          code: 0
        },
        data: users
      });
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      res.status(500).json({
        message: {
          description: 'Error interno del servidor',
          code: 1
        }
      });
    }
  };