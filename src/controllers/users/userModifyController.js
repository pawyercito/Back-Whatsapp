import storage from '../../utils/firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';
import User from '../../models/User.js';

export const modify = async (req, res) => {
  const form = formidable({ multiples: true }); // Permitir múltiples archivos

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
    const fileToUpload = files.profile_picture && Array.isArray(files.profile_picture) ? files.profile_picture[0] : files.profile_picture;
    console.log('Fields:', fields);
    console.log('Files:', files);
    console.log('File to upload:', fileToUpload);

    if (!req.user.id) return res.status(401).json({ message: { description: 'No autorizado', code: 1 } });

    try {
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: { description: 'Usuario no encontrado', code: 1 } });

      // Update profile fields if they are provided
      if (bio !== undefined) user.profile.bio = bio;
      if (website !== undefined) user.profile.website = website;
      if (location !== undefined) user.profile.location = location;
      if (username !== undefined) user.username = Array.isArray(username) ? username[0] : username;
      if (email !== undefined) user.email = Array.isArray(email) ? email[0] : email;
      if (password !== undefined) user.password = Array.isArray(password) ? password[0] : password; // Make sure to hash the password if necessary before saving

      if (fileToUpload && fileToUpload.filepath) {
        console.log('File to upload detected:', fileToUpload);

        // Generar un nombre de archivo único
        const uniqueFileName = `${uuidv4()}-${fileToUpload.originalFilename}`;
        try {
          // Leer el archivo como un buffer
          const fileBuffer = fs.readFileSync(fileToUpload.filepath);
          console.log('File read successfully');

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
          console.log('Profile picture URL assigned to user profile');
        } catch (error) {
          console.error('Error uploading profile picture:', error);
          return res.status(500).json({
            message: {
              description: 'Error uploading profile picture',
              code: 1
            }
          });
        }
      } else {
        console.log('No file uploaded, keeping the existing profile picture.');
      }

      // Save the user after all updates
      const updatedUser = await user.save();
      console.log('User profile updated successfully:', updatedUser.profile);

      res.json({
        message: {
          description: 'Perfil modificado correctamente',
          code: 0
        },
        data: updatedUser.profile // Include updated user profile in response
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
