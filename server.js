import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import Project from './models/Project.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

app.get("/", (req, res) => {
  res.send("Server is running...");
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
      { $push: { comments: { author, text, createdAt: new Date() } } },
      { new: true }
    );
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    console.error('Error commenting on project:', err);
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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
