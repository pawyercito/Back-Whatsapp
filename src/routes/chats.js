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
                    select: 'url'
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
                    sender: chatMessage.idMessage.idUser.username,
                    multimedia: chatMessage.idMessage.idMultimedia ? chatMessage.idMessage.idMultimedia.url : null
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

export default router;
