import express from 'express';
import Chat from '../models/Chat.js';
import ChatMessage from '../models/ChatMessage.js';
import Message from '../models/Message.js';
import Multimedia from '../models/Multimedia.js'; // Importar modelo Multimedia
import { authenticateUser } from '../../middleware_auth.js';

const router = express.Router();

// Endpoint para crear un nuevo chat
router.post('/create', async (req, res) => {
    const { idUser, name, status } = req.body;

    try {
        const chat = new Chat({
            idUser,
            name,
            status
        });

        await chat.save();
        res.status(201).json({ chatId: chat._id });
    } catch (error) {
        res.status(500).json({ message: 'Error al crear el chat', error });
    }
});

// Endpoint para obtener todos los chats del usuario autenticado
router.get('/my-chats', authenticateUser, async (req, res) => {
    try {
        // Encuentra todos los chats del usuario autenticado
        const chats = await Chat.find({ idUser: req.user._id })
            .populate('idUser', 'username'); // Incluye detalles de los usuarios

        console.log('Chats encontrados:', chats);

        // Obtén todos los mensajes de los chats encontrados
        const chatMessages = await ChatMessage.find({
            idChat: { $in: chats.map(chat => chat._id) }
        }).populate({
            path: 'idMessage',
            populate: [
                {
                    path: 'idUser',
                    select: 'username'
                },
                {
                    path: 'idMultimedia',
                    select: 'url idTypeMultimedia',
                    populate: {
                        path: 'idTypeMultimedia',
                        select: 'type'
                    }
                }
            ]
        });

        console.log('ChatMessages encontrados:', chatMessages);

        // Agrupa los mensajes por chat
        const chatWithMessages = await Promise.all(chats.map(async (chat) => {
            const messages = chatMessages
                .filter(chatMessage => chatMessage.idChat.equals(chat._id))
                .map(chatMessage => ({
                    description: typeof chatMessage.idMessage.description === 'string' 
                        ? chatMessage.idMessage.description 
                        : JSON.parse(chatMessage.idMessage.description).join(' '),
                    visto: chatMessage.idMessage.visto,
                    sender: {
                        username: chatMessage.idMessage.idUser.username,
                        id: chatMessage.idMessage.idUser._id
                    },
                    multimedia: chatMessage.idMessage.idMultimedia ? {
                        url: chatMessage.idMessage.idMultimedia.url,
                        type: chatMessage.idMessage.idMultimedia.idTypeMultimedia.type
                    } : null
                }));

            const noVistos = messages.filter(message => !message.visto).length;

            const users = chat.idUser.map(userId => ({
                _id: userId,
                // Aquí puedes incluir más detalles del usuario si es necesario
            }));

            return {
                name: chat.name,
                users: users,
                status: chat.status,
                messages: messages,
                no_vistos: noVistos
            };
        }));

        console.log('Chat con mensajes:', chatWithMessages);

        res.status(200).json({
            message: { description: 'Chats obtenidos exitosamente', code: 0 },
            data: chatWithMessages
        });
    } catch (error) {
        res.status(500).json({
            message: { description: 'Error al obtener los chats', error, code: 1 }
        });
    }
});

// Endpoint para verificar si un chat privado ya existe
router.get('/exists/:userId', authenticateUser, async (req, res) => {
    try {
        const userId1 = req.user._id; // Usuario logueado
        const userId2 = req.params.userId; // Usuario pasado por el frontend

        // Buscar un chat privado que solo tenga estos dos usuarios
        const chat = await Chat.findOne({
            idUser: { $all: [userId1, userId2], $size: 2 }
        });

        if (chat) {
            return res.json({ exists: true });
        } else {
            return res.json({ exists: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Error interno del servidor' });
    }
});

export default router;
