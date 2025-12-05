import mongoose from 'mongoose';


const commentSchema = new mongoose.Schema({
  author: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  category: { type: String, required: true },
  image: { type: String, required: true },
  description: { type: String },
  role: { type: String },
  year: { type: String },
  client: { type: String },
  gallery: [{ type: String }],
  order: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  comments: [commentSchema]
}, { timestamps: true });

export default mongoose.model('Project_Collection', projectSchema, 'Project_Collection');
