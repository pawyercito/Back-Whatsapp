import mongoose from 'mongoose';

const EstadoSchema = new mongoose.Schema({
    idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    idMultimedia: { type: mongoose.Schema.Types.ObjectId, ref: 'Multimedia', default: null },
    description: { type: String, default: '' },
    visto: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: '24h' }
});

export default mongoose.model('Estado', EstadoSchema);

