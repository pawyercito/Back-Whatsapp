import User from '../../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { configDotenv } from 'dotenv';

configDotenv();

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password'); // Selecciona la contraseña
    if (!user) {
      return res.status(400).json({
        message: {
          description: 'Credenciales incorrectas',
          code: 1
        }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        message: {
          description: 'Credenciales incorrectas',
          code: 1
        }
      });
    }

    const token = jwt.sign(
      { id: user._id }, // Se elimina el idRol ya que no se usa más
      process.env.JWT_SECRET, 
      { expiresIn: '1h' }
    );

    const userId = user._id.toString();

    const userData = user.toObject();
    delete userData.password; // Elimina la contraseña del objeto de usuario

    res.json({
      message: {
        description: 'Has iniciado sesión correctamente',
        code: 0
      },
      data: {
        ...userData,
        token,
        userId
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: {
        description: 'Error interno del servidor',
        code: 1
      }
    });
  }
};