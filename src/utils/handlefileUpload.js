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

        const { userId, description } = fields;
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
                idUser: userId,
                description: descriptionString,
                idMultimedia: multimediaData ? multimediaData._id : null
            });

            await estado.save();

            res.status(201).json({ message: 'Estado subido exitosamente' });
        } catch (error) {
            console.error('Error manejando el estado:', error);
            res.status(500).json({ message: 'Error al subir el estado' });
        }
    });
};


export const handleMultimediaMessage = async (req, res) => {
    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            return res.status(500).json({ message: 'Error parsing form data' });
        }

        const { chatId, userId, description } = fields;
        const multimediaFiles = files.multimedia || [];

        try {
            let multimediaData = null;

            if (multimediaFiles.length > 0) {
                const file = multimediaFiles[0];
                const type = file.mimetype.includes('image') ? 'image' : 'audio'; // Adjust according to your needs
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

            const messageDescription = typeof description === 'string' ? description : description.toString();

            const message = new Message({
                idUser: userId,
                description: messageDescription,
                idMultimedia: multimediaData ? multimediaData._id : null,
                idTypeMultimedia: multimediaData ? multimediaData.idTypeMultimedia : null,
                visto: false
            });

            await message.save();

            // Save ChatMessage after saving the message
            const chatMessage = new ChatMessage({
                idChat: chatId,
                idMessage: message._id
            });

            await chatMessage.save();

            io.to(chatId).emit('receiveMessage', {
                idChat: chatId,
                idMessage: message._id,
                description: messageDescription,
                idUser: userId,
                multimedia: multimediaData ? (multimediaData.type === 'image' ? 'image' : 'audio') : null
            });

            // Crear el objeto con todos los campos del mensaje para enviar en la respuesta
            const messageToSend = {
                idChat: chatId,
                idMessage: message._id,
                description: messageDescription,
                idUser: userId,
                multimedia: multimediaData ? (multimediaData.type === 'image' ? 'image' : 'audio') : null,
                idTypeMultimedia: multimediaData ? multimediaData.idTypeMultimedia : null,
                ...message.toObject() // Spread operator to include all message fields
            };

            // Imprimir en consola la respuesta completa antes de enviarla
            console.log("Mensaje enviado exitosamente:", messageToSend);

            res.status(201).json(messageToSend); // Enviar todos los campos del mensaje junto con la respuesta de éxito
        } catch (error) {
            console.error('Error handling multimedia message:', error);
            res.status(500).json({ message: 'Error al enviar el mensaje' });
        }
    });
};
