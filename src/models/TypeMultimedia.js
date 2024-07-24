// src/models/TypeMultimedia.js
import mongoose from 'mongoose';

const typeMultimediaSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        unique: true
    },
    // Otros campos si es necesario
});

const TypeMultimedia = mongoose.model('TypeMultimedia', typeMultimediaSchema);
export default TypeMultimedia;
