// models/Chat.js

import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
    idUser: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Asegúrate de que 'User' coincida con el nombre del modelo User
        required: true
      },],
  name: String,
  status: Boolean
});


const Chat = mongoose.model('Chat', ChatSchema);
export default Chat;