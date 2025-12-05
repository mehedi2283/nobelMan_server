import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  homeLogo: { type: String, default: '' },
  heroImage: { type: String, default: '' },
  totalProjects: { type: String, default: '20' },
  yearsExperience: { type: String, default: '2' },
  resumeUrl: { type: String, default: '' },
  aboutImage1: { type: String, default: '' }, // Portrait
  aboutImage2: { type: String, default: '' }, // Landscape
  socialLinkedin: { type: String, default: '' },
  socialBehance: { type: String, default: '' },
  socialInstagram: { type: String, default: '' },
  email: { type: String, default: '' },
  copyrightYear: { type: String, default: '2026' }
}, { timestamps: true });

// We only need one profile document, but Mongoose is a collection. 
// The controller will ensure we only edit the first one.
export default mongoose.model('Profile', profileSchema);