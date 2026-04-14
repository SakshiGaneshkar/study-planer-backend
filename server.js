const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors({
  origin: "*",
  methods: ["GET","POST","PUT","DELETE","PATCH","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/habits', require('./routes/habits'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/feedback', require('./routes/feedback'));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Smart Study Planner API Running', 
    timestamp: new Date(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

let dbConnected = false;

// Connect to MongoDB
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 30000,
  connectTimeoutMS: 30000,
})
.then(() => {
  console.log('✅ MongoDB Connected');
  dbConnected = true;
})
.catch(err => {
  console.error('❌ MongoDB Connection Error:', err.message);
  // Don't exit - allow Vercel to retry with healthcheck
});

// Middleware to check DB connection on critical routes
const requireDb = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database connection not ready', error: 'Service Unavailable' });
  }
  next();
};

// Apply DB check to protected routes
app.use('/api/auth/login', requireDb);
app.use('/api/auth/register', requireDb);
app.use('/api/tasks', requireDb);
app.use('/api/sessions', requireDb);
app.use('/api/habits', requireDb);
app.use('/api/subjects', requireDb);

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    mongoose.connection.close();
    console.log('Server and DB connection closed');
    process.exit(0);
  });
});

module.exports = app;