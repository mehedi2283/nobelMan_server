import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Project from './models/Project.js';
import dotenv from 'dotenv';
import ClientLogo from './models/ClientLogo.js';
import Profile from './models/Profile.js';
import Message from './models/Message.js';
import Admin from './models/Admin.js';
import ChatLog from './models/ChatLog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('MongoDB Connected successfully');
    await initAdmin();
  })
  .catch((err) => console.error("MongoDB connection error:", err));
   

// Initialize Default Admin
const initAdmin = async () => {
  try {
    const count = await Admin.countDocuments();
    if (count === 0) {
      const defaultAdmin = new Admin({
        email: 'shafiulislamnobel1@gmail.com',
        password: '12345678'
      });
      await defaultAdmin.save();
      console.log('Default admin account initialized.');
    }
  } catch (error) {
    console.error('Error initializing admin:', error);
  }
};

// Routes

// Health Check Route (Root)
app.get('/', (req, res) => {
    res.send('API is running...');
});

// --- AUTH ROUTES ---

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const admin = await Admin.findOne({ email });
    if (admin && admin.password === password) {
      res.json({ message: 'Login successful' });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/update', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Update the first admin found (assuming single admin system)
    const admin = await Admin.findOne();
    if (admin) {
      admin.email = email;
      admin.password = password;
      await admin.save();
      res.json({ message: 'Credentials updated successfully' });
    } else {
      // Fallback if somehow deleted
      const newAdmin = new Admin({ email, password });
      await newAdmin.save();
      res.json({ message: 'Admin created successfully' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// your other routes...


// Get all projects
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().sort({ order: 1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create or Update Project
app.post('/api/projects', async (req, res) => {
  const projectData = req.body;

  try {
    let project = await Project.findOne({ id: projectData.id });

    if (project) {
      // Update existing
      project = await Project.findOneAndUpdate(
        { id: projectData.id },
        projectData,
        { new: true }
      );
    } else {
      // Create new
      const lastProject = await Project.findOne().sort({ order: -1 });
      const newOrder = lastProject ? lastProject.order + 1 : 0;

      project = new Project({ ...projectData, order: newOrder });
      await project.save();
    }

    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});


// Like a Project
app.post('/api/projects/:id/like', async (req, res) => {
  console.log(`POST /api/projects/${req.params.id}/like`);
  try {
    const project = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $inc: { likes: 1 } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error liking project:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add Comment to Project
app.post('/api/projects/:id/comment', async (req, res) => {
  console.log(`POST /api/projects/${req.params.id}/comment`);
  const { author, text } = req.body;
  
  if (!author || !text) {
      return res.status(400).json({ message: 'Author and text required' });
  }

  try {
    const project = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $push: { comments: { author, text, createdAt: new Date(), read: false } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error commenting on project:', err);
    res.status(500).json({ message: err.message });
  }
});


// Mark Comment as Read
app.put('/api/projects/:id/comments/:commentId/read', async (req, res) => {
  try {
    const { id, commentId } = req.params;
    
    let queryId;
    if (mongoose.Types.ObjectId.isValid(commentId)) {
        queryId = new mongoose.Types.ObjectId(commentId);
    } else {
        // If it's a timestamp-based ID or similar, we might need a different approach 
        // but generally comments should have _id
        queryId = commentId;
    }

    const project = await Project.findOneAndUpdate(
      { id: id, "comments._id": queryId },
      { $set: { "comments.$.read": true } },
      { new: true }
    );
    
    if (!project) return res.status(404).json({ message: 'Project or comment not found' });
    res.json(project);
  } catch (err) {
    console.error('Error marking comment as read:', err);
    res.status(500).json({ message: err.message });
  }
});



// Delete Comment from Project
app.delete('/api/projects/:id/comments/:commentId', async (req, res) => {
  console.log(`DELETE /api/projects/${req.params.id}/comments/${req.params.commentId}`);
  try {
    const project = await Project.findOneAndUpdate(
      { id: req.params.id },
      { $pull: { comments: { _id: req.params.commentId } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ message: err.message });
  }
});

// Delete Project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.findOneAndDelete({ id: req.params.id });
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reorder Projects
app.post('/api/projects/reorder', async (req, res) => {
  const { projects } = req.body;

  try {
    const operations = projects.map((project, index) => ({
      updateOne: {
        filter: { id: project.id },
        update: { $set: { order: index } }
      }
    }));

    await Project.bulkWrite(operations);
    res.json({ message: 'Projects reordered' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});





// --- CLIENT LOGO ROUTES ---

// Get all logos
app.get('/api/logos', async (req, res) => {
  try {
    const logos = await ClientLogo.find().sort({ createdAt: -1 });
    res.json(logos);
  } catch (err) {
    console.error('Error fetching logos:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a logo
app.post('/api/logos', async (req, res) => {
  const { name, url } = req.body;
  try {
    const newLogo = new ClientLogo({ name, url });
    await newLogo.save();
    res.json(newLogo);
  } catch (err) {
    console.error('Error saving logo:', err);
    res.status(400).json({ message: err.message });
  }
});

// Delete a logo
app.delete('/api/logos/:id', async (req, res) => {
  try {
    await ClientLogo.findByIdAndDelete(req.params.id);
    res.json({ message: 'Logo deleted' });
  } catch (err) {
    console.error('Error deleting logo:', err);
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/logos/bulk-delete', async (req, res) => {
  const { ids } = req.body;
  try {
    await ClientLogo.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Logos deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// --- PROFILE ROUTES ---

app.get('/api/profile', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
        // Return default structure if none exists
        profile = new Profile(); 
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/profile', async (req, res) => {
  try {
    // Find first or create
    let profile = await Profile.findOne();
    if (profile) {
      // Update
      Object.assign(profile, req.body);
      await profile.save();
    } else {
      // Create
      profile = new Profile(req.body);
      await profile.save();
    }
    res.json(profile);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// --- MESSAGE ROUTES (CONTACT FORM) ---

app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const newMessage = new Message(req.body);
    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark Message as Read
app.put('/api/messages/:id/read', async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/messages/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// --- CHAT LOG ROUTES ---

app.get('/api/chat-logs', async (req, res) => {
  try {
    // Get last 200 messages for dashboard
    const logs = await ChatLog.find().sort({ createdAt: -1 }).limit(200);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/chat-logs', async (req, res) => {
  try {
    const { role, text } = req.body;
    const newLog = new ChatLog({ role, text });
    await newLog.save();
    res.json(newLog);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Mark Chat Log as Read
app.put('/api/chat-logs/:id/read', async (req, res) => {
  try {
    const log = await ChatLog.findByIdAndUpdate(req.params.id, { read: true }, { new: true });
    res.json(log);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
