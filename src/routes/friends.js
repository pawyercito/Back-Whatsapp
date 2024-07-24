import express from "express";
const router = express.Router()
import { authenticateUser } from '../../middleware_auth.js';

import {addFriends} from '../controllers/friends/friendsAddController.js';
import {removeFriend} from '../controllers/friends/friendsDeleteController.js';
import {getAllFriends} from '../controllers/friends/friendsGetAllController.js';
import {getFriendRequests} from '../controllers/friends/friendGetAllRequest.js';
import {respondToFriendRequest} from '../controllers/friends/friendsResponseController.js';


// Obtener lista de solicitudes de amistad
router.get('/getFriendRequests', authenticateUser, getFriendRequests);

// Responder a una solicitud de amistad
router.post('/respondToFriendRequest', authenticateUser, respondToFriendRequest);

// Obtener lista de amigos
router.get('/getAllFriends', authenticateUser, getAllFriends);

// Ruta para buscar usuarios y añadir amigos
router.post('/searchAndAddFriend', authenticateUser, addFriends);

// Ruta para eliminar un amigo
router.delete('/removeFriend', authenticateUser, removeFriend);

export default router;
