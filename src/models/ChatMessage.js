import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema({
  idChat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat' },
  idMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message' }
});


const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
export default ChatMessage;

