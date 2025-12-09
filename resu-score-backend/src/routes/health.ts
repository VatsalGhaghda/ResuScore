import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Basic health check
router.get('/', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database health check
router.get('/db', (req, res) => {
  const dbStatus = mongoose.connection.readyState;
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  res.json({ 
    mongodb: {
      status: states[dbStatus as keyof typeof states] || 'unknown',
      readyState: dbStatus
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
