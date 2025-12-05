import mongoose from 'mongoose';

const clientLogoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  url: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('ClientLogo', clientLogoSchema);