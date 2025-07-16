import express from 'express';
import https from 'https';
import { config } from './src/config/config.js';
import { setupMiddleware, errorHandler } from './src/middleware/middleware.js';
import { loadSSLCertificates } from './src/utils/ssl.js';
import policyRoutes from './src/routes/policyRoutes.js';

const app = express();

// Load SSL certificates (only if HTTPS is enabled)
const httpsOptions = loadSSLCertificates();

// Setup middleware
setupMiddleware(app);

// Setup routes
app.use('/api', policyRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    https: config.server.enableHttps
  });
});

// Error handling middleware (should be last)
app.use(errorHandler);

// Create server (HTTPS or HTTP based on configuration)
let server;
if (config.server.enableHttps && httpsOptions) {
    server = https.createServer(httpsOptions, app);
    server.listen(config.server.port, config.server.host, () => {
        console.log(`🚀 HTTPS Server running on https://${config.server.host}:${config.server.port}`);
        console.log(`📁 Serving static files from: public/`);
        console.log(`🔒 SSL certificates loaded successfully`);
    });
} else {
    server = app.listen(config.server.port, config.server.host, () => {
        console.log(`🚀 HTTP Server running on http://${config.server.host}:${config.server.port}`);
        console.log(`📁 Serving static files from: public/`);
        console.log(`⚠️  HTTPS is disabled - running in HTTP mode`);
    });
}