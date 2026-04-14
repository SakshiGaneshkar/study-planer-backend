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

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 5000;

// Singleton MongoDB connection for serverless
let mongoConnection = null;

const connectToDatabase = async () => {
  if (mongoConnection) {
    return mongoConnection;
  }

  try {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    mongoConnection = await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 60000,
      retryWrites: true,
      w: 'majority',
    });

    console.log('✅ MongoDB Connected');
    return mongoConnection;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    mongoConnection = null;
    throw err;
  }
};

// Middleware to ensure DB connection
const ensureDbConnection = async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    console.error('Database connection failed:', err.message);
    res.status(500).json({ message: 'Database connection failed', error: err.message });
  }
};

// Apply DB connection middleware to all routes
app.use(ensureDbConnection);

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
  console.error('Error:', err.stack);
  res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  server.close(() => {
    if (mongoose.connection) {
      mongoose.connection.close();
      console.log('MongoDB connection closed');
    }
    process.exit(0);
  });
});

module.exports = app;