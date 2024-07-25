import User from '../../models/User.js';
import Friend from '../../models/Friends.js'; // Asegúrate de importar el modelo Friend

export const getAllUsers = async (req, res) => {
  try {
    // Suponiendo que req.user.id contiene el ID del usuario autenticado
    const authenticatedUserId = req.user.id;

    // Obtiene los IDs de los amigos del usuario autenticado
    const friendIds = await Friend.findOne({ idUser: authenticatedUserId }, 'friends')
                                  .lean(); // Utiliza lean() para evitar la creación de documentos Mongoose
    const friendIdsArray = friendIds ? friendIds.friends : [];

    // Filtra los usuarios para excluir aquellos que son amigos del usuario autenticado
    const users = await User.find({ _id: { $ne: authenticatedUserId } })
                            .select('username profile.profile_picture')
                            .sort('username')
                            .where('_id').nin(friendIdsArray); // Usa $nin para excluir los IDs de los amigos

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