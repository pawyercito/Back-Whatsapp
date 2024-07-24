// server.js
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
import path from 'path';
import cors from 'cors';

configDotenv();

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = process.env.PORT ?? 4000;

await connectDB();

// Middleware para parsear JSON y manejar CORS
app.use(cors());
app.use(express.json());

// Sirve el archivo HTML desde la carpeta 'public'
const __dirname = path.dirname(new URL(import.meta.url).pathname);
app.use(express.static(path.join(__dirname, 'public')));

// Configura rutas de API
app.use('/api/friends', friendsRoutes);
app.use('/api/users', userRoutes);

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

    const message = new Message({
      idUser: userId,
      description: description,
      visto: false
    });

    await message.save();

    const chatMessage = new ChatMessage({
      idChat: chatId,
      idMessage: message._id
    });

    await chatMessage.save();

    io.to(chatId).emit('receiveMessage', {
      idChat: chatId,
      idMessage: message._id,
      description: description,
      idUser: userId
    });
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});

server.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
