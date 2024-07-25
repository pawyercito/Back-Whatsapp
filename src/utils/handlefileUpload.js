import storage from './firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';
import Multimedia from '../../src/models/Multimedia.js';
import TypeMultimedia from '../../src/models/TypeMultimedia.js';
import Message from '../../src/models/Message.js';
import ChatMessage from '../../src/models/ChatMessage.js'; // Import ChatMessage model
import { io } from '../../app.js'; // Adjust the path based on your project structure
import Estado from '../../src/models/Estado.js'; // Importar modelo Estado
import User from '../../src/models/User.js';


const handleFileUpload = async (file, type) => {
    const uniqueFileName = `${uuidv4()}-${file.originalFilename}`;
    const fileBuffer = fs.readFileSync(file.filepath);
    const storageRef = ref(storage, `multimedia/${type}/${uniqueFileName}`);
    const fileMetadata = { contentType: file.mimetype };
    await uploadBytes(storageRef, fileBuffer, fileMetadata);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
};

export const handleEstadoUpload = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ message: 'Error parsing form data' });
        }

        const { description } = fields;
        const multimediaFiles = files.multimedia || [];

        try {
            let multimediaData = null;

            // Asegúrate de que description sea una cadena
            const descriptionString = Array.isArray(description) ? description.join(' ') : description;

            if (multimediaFiles.length > 0) {
                const file = multimediaFiles[0];
                const type = file.mimetype.includes('image') ? 'image' : 'audio'; // Ajusta según tus necesidades
                const url = await handleFileUpload(file, type);

                const typeMultimedia = await TypeMultimedia.findOne({ type });
                if (!typeMultimedia) {
                    throw new Error('Tipo de multimedia no encontrado');
                }

                const multimedia = new Multimedia({
                    url,
                    idTypeMultimedia: typeMultimedia._id
                });
                await multimedia.save();

                multimediaData = multimedia;
            }

            const estado = new Estado({
                idUser: req.user._id, // Usa el userId del middleware de autenticación
                description: descriptionString,
                idMultimedia: multimediaData ? multimediaData._id : null
            });

            await estado.save();

            res.status(201).json({
                message: { description: 'Estado subido exitosamente', code: 0 },
                data: estado // Incluye el estado creado en la respuesta
            });
        } catch (error) {
            console.error('Error manejando el estado:', error);
            res.status(500).json({
                message: { description: 'Error al subir el estado', code: 1 },
                data: null
            });
        }
    });
};

export const handleMultimediaMessage = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({
                message: {
                    description: 'Error parsing form data',
                    code: 1
                },
                data: null
            });
        }

        const { chatId, userId, description } = fields;
        const multimediaFiles = files.multimedia || [];

        try {
            let multimediaData = null;

            if (multimediaFiles.length > 0) {
                const file = multimediaFiles[0];
                const type = file.mimetype.includes('image') ? 'image' : 'audio';
                const url = await handleFileUpload(file, type);

                const typeMultimedia = await TypeMultimedia.findOne({ type });
                if (!typeMultimedia) {
                    throw new Error('Tipo de multimedia no encontrado');
                }

                const multimedia = new Multimedia({
                    url,
                    idTypeMultimedia: typeMultimedia._id
                });
                await multimedia.save();

                multimediaData = {
                    url: multimedia.url,
                    type: typeMultimedia.type
                };
            }

            const messageDescription = typeof description === 'string' ? description : description.toString();

            const message = new Message({
                idUser: userId,
                description: messageDescription,
                idMultimedia: multimediaData ? multimediaData._id : null,
                visto: false
            });

            await message.save();

            const chatMessage = new ChatMessage({
                idChat: chatId,
                idMessage: message._id
            });

            await chatMessage.save();

            const user = await User.findById(userId).select('username');
            if (!user) {
                throw new Error('Usuario no encontrado');
            }

            const messageToSend = {
                idChat: chatId,
                idMessage: message._id,
                description: messageDescription,
                sender: {
                    username: user.username,
                    id: userId
                },
                multimedia: multimediaData ? multimediaData : null
            };

            io.to(chatId).emit('receiveMessage', messageToSend);

            console.log("Mensaje enviado exitosamente:", messageToSend);

            res.status(201).json({
                message: {
                    description: 'Mensaje enviado exitosamente',
                    code: 0
                },
                data: {
                    idChat: chatId,
                    idMessage: message._id,
                    description: messageDescription,
                    sender: {
                        username: user.username,
                        id: userId
                    },
                    multimedia: multimediaData ? multimediaData : null
                }
            });
        } catch (error) {
            console.error('Error handling multimedia message:', error);
            res.status(500).json({
                message: {
                    description: 'Error al enviar el mensaje',
                    code: 1
                },
                data: null
            });
        }
    });
};
