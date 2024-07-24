import mongoose from "mongoose";

const MultimediaSchema = new mongoose.Schema({
    url : String,
    idTypeMultimedia :  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TypeMultimedia', // Asegúrate de que 'TypeMultimedia' coincida con el nombre del modelo TypeMultimedia
        required: true

    }

});

const Multimedia = mongoose.model('Multimedia', MultimediaSchema);
export default Multimedia
