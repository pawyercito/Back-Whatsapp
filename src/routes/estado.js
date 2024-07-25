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
// Endpoint para obtener los estados de los amigos del usuario autenticado
router.get('/friends-states', authenticateUser, async (req, res) => {
    try {
        const userId = req.user._id;

        // Encuentra el documento de amigos del usuario autenticado
        const friendList = await Friends.findOne({ idUser: userId }).populate('friends');

        if (!friendList) {
            return res.status(404).json({
                message: { description: 'No se encontraron amigos', code: 1 }
            });
        }

        const friends = friendList.friends.map(friend => friend._id);

        // Encuentra todos los estados de los amigos
        const friendStates = await Estado.find({ idUser: { $in: friends } })
            .populate('idUser', 'username')
            .populate('idMultimedia', 'url');

        // Encuentra todos los estados del usuario autenticado
        const userStates = await Estado.find({ idUser: userId })
            .populate('idUser', 'username')
            .populate('idMultimedia', 'url');

        // Combina los estados de amigos y del usuario autenticado
        const allStates = [...friendStates, ...userStates];

        // Agrupar estados por usuario
        const estadosData = allStates.reduce((acc, estado) => {
            const { username } = estado.idUser;
            const { description } = estado;
            const multimedia = estado.idMultimedia ? estado.idMultimedia.url : null;

            if (!acc[username]) {
                acc[username] = {
                    username,
                    states: []
                };
            }

            acc[username].states.push({
                description,
                multimedia
            });

            return acc;
        }, {});

        // Convertir el objeto de estados agrupados en un array
        const estadosArray = Object.values(estadosData);

        res.status(200).json({
            message: { description: 'Estados obtenidos exitosamente', code: 0 },
            data: {
                states: estadosArray
            }
        });
    } catch (error) {
        console.error('Error al obtener los estados:', error);
        res.status(500).json({
            message: { description: 'Error al obtener los estados', error, code: 1 }
        });
    }
});




export default router;
