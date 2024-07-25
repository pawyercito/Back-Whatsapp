import express from "express";
const router = express.Router()
import User from '../models/User.js';
import { register } from '../controllers/users/userCreateController.js'; 
import { authenticateUser } from '../../middleware_auth.js';
import {login} from '../controllers/users/userLoginController.js';
import {modify} from '../controllers/users/userModifyController.js';
import {remove} from '../controllers/users/userDeleteController.js';
import {getUserById} from '../controllers/users/userGetByIdController.js';
import {getAllUsers} from '../controllers/users/userGetAllController.js';


// Registro
router.post('/register', register);

// Inicio de sesión
router.post('/login', login);

// Editar perfil
router.put('/edit-profile', authenticateUser, modify);

// Eliminar cuenta
router.delete('/delete-account', authenticateUser,  remove);

// Obtener usuario por ID
router.get('/user/:id', getUserById);

// Obtener todos los usuarios
router.get('/users', authenticateUser, getAllUsers);

  

export default router