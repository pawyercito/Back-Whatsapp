import User from '../../models/User.js';

export const remove = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: { code: 404, description: 'Usuario no encontrado' } });
        }

        // Reemplaza user.remove() con user.deleteOne() o User.deleteOne({ _id: user._id })
        await user.deleteOne();

        // Respuesta de éxito
        res.json({
            message: {
                code: 0,
                description: 'Cuenta eliminada correctamente'
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: {
                code: 1,
                description: 'Error interno del servidor'
            },
            error: error.message // Si deseas incluir más detalles del error
        });
    }
};
