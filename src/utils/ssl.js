import fs from 'fs';
import path from 'path';
import { config } from '../config/config.js';

/**
 * Load SSL certificates for HTTPS server (only when HTTPS is enabled)
 * @returns {Object|null} SSL options object with key and cert, or null if HTTPS disabled
 * @throws {Error} If certificates cannot be loaded
 */
export function loadSSLCertificates() {
  if (!config.server.enableHttps) {
    console.log('ℹ️  HTTPS disabled - skipping SSL certificate loading');
    return null;
  }
  
  try {
    const keyPath = path.resolve(config.server.ssl.keyPath);
    const certPath = path.resolve(config.server.ssl.certPath);
    
    const sslOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    
    console.log('✅ SSL certificates loaded successfully');
    return sslOptions;
  } catch (err) {
    console.error('❌ Failed to load SSL certificates:', err);
    console.error('Make sure the certificate files exist at:');
    console.error('- Key:', config.server.ssl.keyPath);
    console.error('- Cert:', config.server.ssl.certPath);
    console.error('Or set ENABLE_HTTPS=false to run in HTTP mode');
    throw new Error('SSL certificate loading failed');
  }
}