const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const assignmentRoutes = require('./routes/assignments');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/assignments', assignmentRoutes);

// Base route / health check
app.get('/', (req, res) => {
  res.json({ message: 'College Assignment Submission Tracker API is running' });
});

// Start HTTP server first
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle port-in-use and other server errors gracefully
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Please stop the other process or change PORT in .env`);
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

// Connect to MongoDB (async, after server is already listening)
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/assignment_tracker';
const isAtlas = mongoUri.includes('mongodb.net');
console.log(`Attempting to connect to MongoDB ${isAtlas ? '(Atlas Cloud)' : '(Local)'}...`);

mongoose.connect(mongoUri, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
})
  .then(() => {
    console.log('✅ MongoDB connection established successfully');
  })
  .catch(err => {
    console.error('⚠️  MongoDB connection error:', err.message);
    console.error('   Code:', err.code || 'N/A');
    console.log('Running in offline mode. API calls that require DB will fail.');
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err.message);
});
