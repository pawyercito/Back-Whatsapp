import storage from '../../utils/firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';
import User from '../../models/User.js';

export const modify = async (req, res) => {
  const form = formidable({ multiples: false });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Error parsing form:', err);
      return res.status(500).json({
        message: {
          description: 'Error parsing form data',
          code: 1
        }
      });
    }

    const { bio, website, location, username, email, password } = fields;
    let profilePicture = files.profile_picture ? files.profile_picture : null;

    // Verifica que req.user.id esté definido
    if (!req.user.id) return res.status(401).json({ msg: 'No autorizado' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

      // Actualiza los campos del perfil solo si están presentes en la solicitud
      if (bio !== undefined) user.profile.bio = bio;
      if (website !== undefined) user.profile.website = website;
      if (location !== undefined) user.profile.location = location;
      if (username !== undefined && !Array.isArray(username)) user.username = String(username);
      if (email !== undefined && !Array.isArray(email)) user.email = String(email);

      // Si se proporciona una nueva contraseña, actualizarla
      if (password && !Array.isArray(password)) {
        user.password = String(password); // Asigna la nueva contraseña directamente
      }

      // Prepara profilePicture para su uso, manejando el caso en que pueda ser un array
      let fileToUpload;
      if (Array.isArray(profilePicture) && profilePicture.length > 0) {
        fileToUpload = profilePicture[0]; // Accede al primer elemento si profilePicture es un array
      } else {
        fileToUpload = profilePicture; // Usa directamente profilePicture si no es un array
      }

      if (fileToUpload && fileToUpload.filepath) {
        // Generar un nombre de archivo único
        const uniqueFileName = `${uuidv4()}-${fileToUpload.originalFilename}`;
        try {
          // Leer el archivo como un buffer
          const fileBuffer = fs.readFileSync(fileToUpload.filepath);

          // Crear referencia de almacenamiento con metadatos
          const storageRef = ref(storage, `profile_pictures/${uniqueFileName}`);
          const fileMetadata = { contentType: fileToUpload.mimetype };
          const snapshot = await uploadBytes(storageRef, fileBuffer, fileMetadata);
          console.log('Profile picture uploaded successfully:', snapshot.metadata.fullPath);

          // Obtener la URL de descarga
          const profilePictureUrl = await getDownloadURL(storageRef);
          console.log('Download URL for profile picture:', profilePictureUrl);

          // Asigna la URL de la nueva imagen de perfil
          user.profile.profile_picture = profilePictureUrl;
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          return res.status(500).json({
            message: {
              description: 'Error uploading profile picture',
              code: 1
            }
          });
        }
      }

      await user.save(); // Guarda el usuario. El middleware pre('save') se encargará del hash

      // Envía un mensaje de éxito
      res.json({
        message: {
          description: 'Perfil modificado correctamente',
          code: 0
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: {
          description: 'Error interno del servidor',
          code: 1
        }
      });
    }
  });
};