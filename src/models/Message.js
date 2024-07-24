import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    idUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Asegúrate de que 'User' coincida con el nombre del modelo User
        required: true
      },
  idMultimedia: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Multimedia',
    required: false
  },
  description: String,
  visto: Boolean
});


const Message = mongoose.model('Message', MessageSchema);
export default Message;