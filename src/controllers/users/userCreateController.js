import storage from '../../utils/firebaseConfig.js';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import formidable from 'formidable';
import fs from 'fs';
import User from '../../models/User.js';

export const register = async (req, res) => {
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

    // Corrige los campos para asegurarte de que sean strings
    const username = Array.isArray(fields.username) ? fields.username[0] : fields.username;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const password = Array.isArray(fields.password) ? fields.password[0] : fields.password;

    // Asegúrate de que los campos sean strings y no estén vacíos
    if (!username || !email || !password) {
      return res.status(400).json({
        message: {
          description: 'Missing fields or invalid fields',
          code: 1
        }
      });
    }

    const profilePicture = Array.isArray(files.profile_picture) && files.profile_picture.length > 0 ? files.profile_picture[0] : null;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res.status(409).json({
        message: {
          description: 'This user already exists.',
          code: 1 // Código personalizado para indicar duplicidad
        }
      });
    }

    let profilePictureUrl = '';
    if (profilePicture) {
      // Generar un nombre de archivo único
      const uniqueFileName = `${uuidv4()}-${profilePicture.originalFilename}`;
      try {
        // Leer el archivo como un buffer
        const fileBuffer = fs.readFileSync(profilePicture.filepath);

        // Crear referencia de almacenamiento con metadatos
        const storageRef = ref(storage, `profile_pictures/${uniqueFileName}`);
        const fileMetadata = { contentType: profilePicture.mimetype };
        const snapshot = await uploadBytes(storageRef, fileBuffer, fileMetadata);
        console.log('Profile picture uploaded successfully:', snapshot.metadata.fullPath);

        // Obtener la URL de descarga
        profilePictureUrl = await getDownloadURL(storageRef);
        console.log('Download URL for profile picture:', profilePictureUrl);
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

    try {
      const user = new User({ username, email, password, profile: { profile_picture: profilePictureUrl }});
      const savedUser = await user.save();

      const responseMessage = {
        message: {
          description: 'User created successfully',
          code: 0
        },
        data: {
          user: savedUser.toJSON()
        },
      };

      res.json(responseMessage);
    } catch (error) {
      console.error(error);
      if (error.code === 11000 || error.code === 11001) { // Código de error para duplicados en MongoDB
        return res.status(409).json({
          message: {
            description: 'This user already exists, please try again.',
            code: 2 // Código personalizado para indicar duplicidad
          }
        });
      }
      res.status(500).json({
        message: {
          description: 'Error interno del servidor',
          code: 1
        }
      });
    }
  });
};