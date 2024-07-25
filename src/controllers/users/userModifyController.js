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
    let fileToUpload = files.profile_picture ? files.profile_picture : null;

    if (!req.user.id) return res.status(401).json({ msg: 'No autorizado' });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ msg: 'Usuario no encontrado' });

      // Update profile fields if they are provided
      if (bio !== undefined) user.profile.bio = bio;
      if (website !== undefined) user.profile.website = website;
      if (location !== undefined) user.profile.location = location;
      // Antes de asignar el valor a user.username, verifica si username es un arreglo
if (username !== undefined) {
  // Verifica si username es un arreglo y extrae el primer elemento, de lo contrario usa el valor directamente
  const userUsername = Array.isArray(username) ? username[0] : username;
  user.username = userUsername;
}
      // Antes de asignar el valor a user.email, verifica si email es un arreglo
if (email !== undefined) {
  // Verifica si email es un arreglo y extrae el primer elemento, de lo contrario usa el valor directamente
  const userEmail = Array.isArray(email) ? email[0] : email;
  user.email = userEmail;
}

      // Assuming `password` is extracted from `fields`
if (password !== undefined) {
  // Check if password is an array and extract the first element as the password
  const newPassword = Array.isArray(password) ? password[0] : password;
  user.password = newPassword; // Make sure to hash the password if necessary before saving
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

      // Save the user after all updates
      await user.save();

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