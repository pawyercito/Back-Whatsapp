import express from 'express';
import Estado from '../models/Estado.js';
import { authenticateUser } from '../../middleware_auth.js';
import { handleEstadoUpload } from '../utils/handlefileUpload.js';
import User from '../models/User.js';
import Friends from '../models/Friends.js'; // El modelo Friend

const router = express.Router();

// Endpoint para subir un nuevo estado
router.post('/upload', authenticateUser, handleEstadoUpload);



// Endpoint para obtener los estados de los amigos del usuario autenticado
router.get('/friends-states', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;

        // Encuentra los estados del usuario autenticado
        const userStates = await Estado.find({ idUser: userId })
            .populate('idUser', 'username profile.profile_picture')
            .populate('idMultimedia', 'url');

        // Encuentra el documento de amigos del usuario autenticado
        const friendList = await Friends.findOne({ idUser: userId }).populate('friends');

        let friendStates = [];

        if (friendList) {
            const friends = friendList.friends.map(friend => friend._id);
            // Encuentra todos los estados de los amigos
            friendStates = await Estado.find({ idUser: { $in: friends } })
                .populate('idUser', 'username profile.profile_picture')
                .populate('idMultimedia', 'url');
        }

        // Combina los estados del usuario autenticado y de amigos
        const allStates = [...userStates, ...friendStates];

        // Si no hay estados en absoluto
        if (allStates.length === 0) {
            return res.status(404).json({
                message: { description: 'You dont have friends or states', code: 1 }
            });
        }

        // Agrupar estados por usuario
        const estadosData = allStates.reduce((acc, estado) => {
            const { _id: estadoUserId, username, profile } = estado.idUser;
            const { description } = estado;
            const multimedia = estado.idMultimedia ? estado.idMultimedia.url : null;
            const profile_picture = profile ? profile.profile_picture : null;

            if (!acc[estadoUserId]) {
                acc[estadoUserId] = {
                    username,
                    id: estadoUserId,
                    profile_picture,
                    states: []
                };
            }

            acc[estadoUserId].states.push({
                description,
                multimedia
            });

            return acc;
        }, {});

        // Convertir el objeto de estados agrupados en un array
        const estadosArray = Object.values(estadosData);

        // Ordenar los estados para que el estado del usuario autenticado esté primero
        const sortedEstadosArray = estadosArray.sort((a) => (a.id === userId ? -1 : 1));

        res.status(200).json({
            message: { description: 'States correctly obtained', code: 0 },
            data: {
                states: sortedEstadosArray
            }
        });
    } catch (error) {
        console.error('Error :', error);
        res.status(500).json({
            message: { description: 'Error', error, code: 1 }
        });
    }
});







export default router;
