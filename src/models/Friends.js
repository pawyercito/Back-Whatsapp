import mongoose from 'mongoose';

const FriendSchema = new mongoose.Schema({
  idUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Asegúrate de que 'User' coincida con el nombre del modelo User
    required: true
  },
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
});

// Crear el modelo basado en el esquema
const Friend = mongoose.model('Friend', FriendSchema);

export default Friend;