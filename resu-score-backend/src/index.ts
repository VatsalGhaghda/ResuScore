import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Load environment variables FIRST
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '../.env') });

// Import database connection after env is loaded
import connectDB from './config/database';
import mongoose from 'mongoose';

// Import routes
import healthRoutes from './routes/health';
import uploadRoutes from './routes/upload';
import analysisRoutes from './routes/analysis';
import keywordsRoutes from './routes/keywords';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'ResuScore Backend API is running!' });
});

// Use route modules with /api prefix
app.use('/api/health', healthRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/keywords', keywordsRoutes);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }
  }
  res.status(500).json({ error: error.message || 'Internal server error' });
});

// Start server
const startServer = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI;
    
    if (mongoUri) {
      console.log('🔄 Attempting to connect to MongoDB...');
      try {
        await connectDB();
      } catch (dbError: any) {
        console.error('❌ MongoDB connection failed:');
        console.error('Error message:', dbError.message);
        console.log('⚠️  Server will continue without database connection');
      }
    } else {
      console.log('⚠️  MONGODB_URI not set - Database connection skipped');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
      console.log(`📡 API endpoints available at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();