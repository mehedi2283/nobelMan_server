import mongoose from 'mongoose';

const chatLogSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'model'], required: true },
  text: { type: String, required: true },
  sessionDate: { type: Date, default: Date.now },
  platform: { type: String, default: 'web' },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('ChatLog', chatLogSchema);