import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { configDotenv } from 'dotenv';
import { connectDB } from './db.js';
import userRoutes from './src/routes/users.js';
import friendsRoutes from './src/routes/friends.js';
import Chat from './src/models/Chat.js';
import Message from './src/models/Message.js';
import ChatMessage from './src/models/ChatMessage.js';
import Multimedia from './src/models/Multimedia.js'; // Import Multimedia model
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';
import chatRoutes from './src/routes/chats.js';
import { handleMultimediaMessage } from './src/utils/handlefileUpload.js'; // Importa el manejador de mensajes multimedia
import estadoRoutes from './src/routes/estado.js';

// Configura dotenv para las variables de entorno
configDotenv();

const app = express();
const server = http.createServer(app);
// After initializing io
export const io = new Server(server);
const PORT = process.env.PORT ?? 4000;

// Conexión a la base de datos
await connectDB();

// Middleware para parsear JSON y manejar CORS
app.use(cors());
app.use(express.json());

// Sirve el archivo HTML desde la carpeta 'public'
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

// Configura rutas de API
app.use('/api/estados', estadoRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/friends', friendsRoutes);
app.use('/api/users', userRoutes);

// Ruta para manejar mensajes multimedia
app.post('/api/messages/multimedia', handleMultimediaMessage);

// Ruta principal para verificar el servidor
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Lógica de Socket.IO
io.on('connection', (socket) => {
  console.log('Nuevo cliente conectado');

  socket.on('joinChat', (chatId) => {
    socket.join(chatId);
    console.log(`Usuario unido al chat: ${chatId}`);
  });

  socket.on('sendMessage', async (data) => {
    const { chatId, userId, description } = data;
    console.log('Datos recibidos en sendMessage:', data);

    try {
      const messageDescription = typeof description === 'string' ? description : description.toString();

      const message = new Message({
        idUser: userId,
        description: messageDescription,
        visto: false
      });

      await message.save();
      console.log('Mensaje guardado:', message);

      const chatMessage = new ChatMessage({
        idChat: chatId,
        idMessage: message._id
      });

      await chatMessage.save();
      console.log('ChatMessage guardado:', chatMessage);

      io.to(chatId).emit('receiveMessage', {
        idChat: chatId,
        idMessage: message._id,
        description: messageDescription,
        idUser: userId
      });
    } catch (error) {
      console.error('Error guardando el mensaje:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

// Ruta para obtener chats y mensajes
app.get('/api/chats/:chatId/messages', async (req, res) => {
    const { chatId } = req.params;

    try {
        const chat = await Chat.findById(chatId).populate({
            path: 'users',
            select: 'username _id'
        });

        if (!chat) {
            return res.status(404).json({
                message: {
                    description: 'Chat no encontrado',
                    code: 1
                }
            });
        }

        const messages = await ChatMessage.find({ idChat: chatId }).populate({
            path: 'idMessage',
            populate: {
                path: 'idUser',
                select: 'username'
            }
        }).populate({
            path: 'idMessage',
            populate: {
                path: 'idMultimedia',
                select: 'url'
            }
        });

        const formattedMessages = messages.map(chatMessage => {
            const message = chatMessage.idMessage;
            return {
                description: typeof message.description === 'string' ? message.description : JSON.parse(message.description).join(' '),
                visto: message.visto,
                sender: message.idUser.username,
                multimedia: message.idMultimedia ? message.idMultimedia.url : null
            };
        });

        res.status(200).json({
            message: {
                description: 'Chats obtenidos exitosamente',
                code: 0
            },
            data: {
                name: chat.name,
                users: chat.users.map(user => ({
                    _id: {
                        username: user.username,
                        id: user._id
                    }
                })),
                status: chat.status,
                messages: formattedMessages,
                no_vistos: formattedMessages.filter(msg => !msg.visto).length
            }
        });
    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            message: {
                description: 'Error al obtener los mensajes del chat',
                code: 1
            }
        });
    }
});
