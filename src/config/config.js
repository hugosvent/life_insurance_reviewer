import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const config = {
  server: {
    port: process.env.PORT || 4316,
    host: process.env.HOST || '0.0.0.0',
    enableHttps: process.env.ENABLE_HTTPS === 'true',
    ssl: {
      keyPath: process.env.SSL_KEY_PATH || './certs/cf-origin-key.pem',
      certPath: process.env.SSL_CERT_PATH || './certs/cf-origin-cert.pem'
    }
  },
  api: {
    apiKey: process.env.API_KEY,
    apiUrl: process.env.API_URL || 'https://api.deepinfra.com/v1/openai/chat/completions',
    modelId: process.env.MODEL_ID || 'deepseek-ai/DeepSeek-R1-0528'
  },
  upload: {
    maxFileSizeMB: 50,
    maxPoliciesComparison: 5
  },
  ai: {
    analyzeTemperature: 0.5,
    compareTemperature: 0.1
  },
  frontend: {
    apiUrl: process.env.FRONTEND_API_URL || 'https://your-production-domain.com',
    devApiUrl: process.env.FRONTEND_DEV_API_URL || 'https://localhost:3000'
  }
};

// Validate required environment variables
if (!config.api.apiKey) {
  console.error('❌ API_KEY is required but not set in environment variables');
  process.exit(1);
}