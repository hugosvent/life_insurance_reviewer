import express from 'express';
import cors from 'cors';
import multer from 'multer';
import compression from 'compression';
import { config } from '../config/config.js';

/**
 * Configure and return common middleware
 * @param {Express} app - Express application instance
 */
export function setupMiddleware(app) {
  // CORS middleware with streaming support
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
  }));
  
  // Compression middleware - exclude streaming routes
  app.use(compression({
    filter: (req, res) => {
      // Don't compress streaming responses
      if (req.path.includes('/analyze-policy') || req.path.includes('/compare-policy')) {
        return false;
      }
      return compression.filter(req, res);
    }
  }));
  
  // Disable buffering for streaming routes
  app.use((req, res, next) => {
    if (req.path.includes('/analyze-policy') || req.path.includes('/compare-policy')) {
      // Disable Express's internal buffering
      res.setTimeout(0);
      req.setTimeout(0);
    }
    next();
  });
  
  // Body parsing middleware with increased limits
  const limit = `${config.upload.maxFileSizeMB}mb`;
  app.use(express.json({ limit }));
  app.use(express.urlencoded({ limit, extended: true }));
  
  // Serve static files from public directory
  app.use(express.static('public'));
}

/**
 * Configure multer for file uploads
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 1024 * 1024 * config.upload.maxFileSizeMB, // Convert MB to bytes
  },
});

/**
 * Error handling middleware
 * @param {Error} err - Error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        error: `File too large. Maximum size is ${config.upload.maxFileSizeMB}MB` 
      });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error' 
  });
}