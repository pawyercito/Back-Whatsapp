import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: {
    bio: String,
    website: String,
    location: String,
    profile_picture: String,
  },
});

UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10); // Usa 10 rondas de hash
  }
  next();
});

UserSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    delete returnedObject._id;
    delete returnedObject.__v; // Elimina el campo __v si está presente
    delete returnedObject.password; // Elimina la contraseña
  },
});

const User = mongoose.model('User', UserSchema);
export default User;
