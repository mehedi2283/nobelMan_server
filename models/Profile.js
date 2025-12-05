import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  // Identity
  name: { type: String, default: 'Nobel' },
  role: { type: String, default: 'UX & UI Designer' },
  homeLogo: { type: String, default: '' },
  
  // Hero Section
  heroImage: { type: String, default: '' },
  totalProjects: { type: String, default: '20' },
  yearsExperience: { type: String, default: '2' },
  resumeUrl: { type: String, default: '' },
  
  // About Section
  bio: { type: String, default: 'I am a UX/UI Designer...' }, // Main bio text
  aboutImage1: { type: String, default: '' }, // Portrait
  aboutImage2: { type: String, default: '' }, // Landscape
  statsValue: { type: String, default: '100' }, 
  statsLabel: { type: String, default: 'User-focused screens created...' },
  feature1: { type: String, default: 'Agency & startup experience...' }, // Feature bullet 1
  feature2: { type: String, default: 'Strong UX fundamentals...' }, // Feature bullet 2
  
  // Socials & Contact
  socialLinkedin: { type: String, default: '' },
  socialBehance: { type: String, default: '' },
  socialInstagram: { type: String, default: '' },
  email: { type: String, default: '' },
  copyrightYear: { type: String, default: '2026' }
}, { timestamps: true });

export default mongoose.model('Profile', profileSchema);