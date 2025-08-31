# Insurance Policy Reviewer

An AI-powered web application that analyzes and compares life insurance policies using advanced language models. Compatible with OpenAI, DeepInfra, Groq, and other OpenAI-compatible API providers.

## Demo

Try the live demo at: https://insurance.expertition360.com

## Features

- **Single Policy Analysis**: Upload and analyze individual insurance policies
- **Policy Comparison**: Compare multiple insurance policies side-by-side
- **Multi-language Support**: Analysis available in multiple languages
- **PDF Processing**: Handles both text-based and scanned PDFs with OCR
- **Streaming Responses**: Real-time AI analysis with streaming output
- **OpenAI Integration**: Built with the official OpenAI SDK for reliable API communication
- **Responsive Design**: Mobile-friendly interface

## Project Structure

```
insurance_policy_reviewer/
├── server.js                 # Main server entry point
├── package.json             # Node.js dependencies and scripts
├── LICENSE                  # MIT License file
├── README.md               # Project documentation
├── .env                     # Environment variables (create from .env.example)
├── .env.example            # Environment variables template
├── .gitignore              # Git ignore rules
├── src/
│   ├── config/
│   │   └── config.js       # Server configuration management
│   ├── middleware/
│   │   └── middleware.js   # Express middleware setup
│   ├── prompts/
│   │   └── prompts.js      # AI prompts and guidelines
│   ├── routes/
│   │   └── policyRoutes.js # API route definitions
│   ├── services/
│   │   └── aiService.js    # AI service integration
│   └── utils/
│       └── ssl.js          # SSL certificate utilities
└── public/
    ├── index.html          # Frontend HTML
    ├── api.js              # Frontend JavaScript
    ├── config.js           # Frontend configuration
    └── expertition360_light.png # Logo asset
```

## Setup Instructions

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your specific configuration:

```env
# Server Configuration
SERVER_HOST=localhost
SERVER_PORT=3000

# SSL Certificate Paths (absolute paths)
SSL_KEY_PATH=/path/to/your/private-key.pem
SSL_CERT_PATH=/path/to/your/certificate.pem

# OpenAI-compatible API Configuration
# Choose one of the following providers:

# OpenAI (recommended)
API_KEY=your_openai_api_key_here
API_URL=https://api.openai.com/v1
MODEL_ID=gpt-4

# DeepInfra
# API_KEY=your_deepinfra_api_key_here
# API_URL=https://api.deepinfra.com/v1/openai
# MODEL_ID=meta-llama/Meta-Llama-3.1-70B-Instruct

# Groq
# API_KEY=your_groq_api_key_here
# API_URL=https://api.groq.com/openai/v1
# MODEL_ID=llama-3.1-70b-versatile

# Google Gemini (via DeepInfra)
# API_KEY=your_deepinfra_api_key_here
# API_URL=https://api.deepinfra.com/v1/openai
# MODEL_ID=google/gemini-2.5-flash


```

### 2. Install Dependencies

Install all required dependencies including the OpenAI SDK:

```bash
npm install
```

Key dependencies:
- `openai`: Official OpenAI SDK for API communication
- `express`: Web framework for Node.js
- `multer`: Middleware for handling file uploads
- `cors`: Cross-origin resource sharing middleware
- `dotenv`: Environment variable management

### 3. SSL Certificates

For HTTPS support, you'll need SSL certificates. For development, you can create self-signed certificates:

```bash
# Create a directory for certificates
mkdir certs

# Generate self-signed certificate (for development only)
openssl req -x509 -newkey rsa:4096 -keyout certs/key.pem -out certs/cert.pem -days 365 -nodes
```

Update your `.env` file with the correct paths:
```env
SSL_KEY_PATH=/absolute/path/to/your/project/certs/key.pem
SSL_CERT_PATH=/absolute/path/to/your/project/certs/cert.pem
```

### 4. Start the Server

```bash
npm start
```

The server will start at `https://localhost:3000` (or your configured host/port).

## API Endpoints

### Health Check
- **GET** `/api/health` - Server health status

### Policy Analysis
- **POST** `/api/analyze-policy` - Analyze a single insurance policy
  - Body: `{ "text": "policy content", "language": "en" }`
  - File upload: `multipart/form-data` with `file` field

### Policy Comparison
- **POST** `/api/compare-policy` - Compare multiple insurance policies
  - Body: `{ "policies": [{"name": "Policy 1", "content": "..."}], "language": "en" }`
  - File upload: `multipart/form-data` with `files` field (max 5 files)

## Frontend Configuration

The frontend uses an environment-based configuration system with dedicated configuration files:

### Frontend Configuration
- **`public/config.js`**: Contains all frontend configuration settings including API URLs, feature flags, UI configurations, and OCR settings
- **`public/api.js`**: Main application logic that uses the configuration

### Configuration Structure
The frontend configuration is organized into:
- **API Configuration**: Base URLs for different environments (production, development, local)
- **Environment Detection**: Automatic detection based on hostname
- **Feature Flags**: Enable/disable specific features
- **UI Settings**: File limits, supported types, default language
- **OCR Settings**: Tesseract.js configuration for text extraction

### Configuration Settings
Modify `public/config.js` to configure:
- API endpoints and base URL
- Feature toggles (debug mode, privacy modal, etc.)
- File upload limits and supported types
- OCR processing parameters

This approach provides complete control over frontend behavior without requiring backend changes.

## Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `SERVER_HOST` | Server host address | `localhost` | No |
| `SERVER_PORT` | Server port number | `3000` | No |
| `ENABLE_HTTPS` | Enable HTTPS server (true/false) | `false` | No |
| `SSL_KEY_PATH` | Path to SSL private key | - | Yes (when HTTPS enabled) |
| `SSL_CERT_PATH` | Path to SSL certificate | - | Yes (when HTTPS enabled) |
| `API_KEY` | OpenAI-compatible API key (DeepInfra, OpenAI, Groq, etc.) | - | Yes |
| `API_URL` | OpenAI-compatible API endpoint | `https://api.openai.com/v1` | No |
| `MODEL_ID` | AI model identifier | `gpt-4` | No |
| `FRONTEND_API_URL` | Production API URL for frontend | `https://your-production-domain.com` | No |
| `FRONTEND_DEV_API_URL` | Development API URL for frontend | `https://localhost:3000` | No |

### HTTPS Configuration

To enable HTTPS:
1. Set `ENABLE_HTTPS=true` in your `.env` file
2. Provide valid SSL certificate paths for `SSL_KEY_PATH` and `SSL_CERT_PATH`
3. The server will automatically create an HTTPS server instead of HTTP

To disable HTTPS (HTTP only):
1. Set `ENABLE_HTTPS=false` or remove the variable entirely
2. The server will run on HTTP regardless of SSL certificate availability

## Development

### Development Mode

For development with auto-restart on file changes:

```bash
npm run dev
```

### Adding New Features

1. **Backend**: Add new routes in `src/routes/`, services in `src/services/`, and middleware in `src/middleware/`
2. **Frontend**: Update `public/api.js` for new functionality and `public/config.js` for configuration
3. **Configuration**: Add new environment variables to `.env.example` and update this README

### OpenAI SDK Integration

The application uses the official OpenAI SDK (`openai` package) for API communication:

- **Stream Processing**: Utilizes OpenAI's streaming capabilities for real-time response delivery
- **Error Handling**: Built-in error handling and retry mechanisms
- **Type Safety**: TypeScript definitions for better development experience
- **Compatibility**: Works with OpenAI and OpenAI-compatible APIs (DeepInfra, Groq, etc.)

#### Usage Example

```javascript
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.API_KEY,
  baseURL: process.env.API_URL
});

const stream = await openai.chat.completions.create({
  model: process.env.MODEL_ID,
  messages: [{ role: 'user', content: 'Analyze this policy...' }],
  stream: true
});
```

### Code Organization

- **Modular Structure**: Code is organized into logical modules for maintainability
- **Configuration Management**: All sensitive data and configuration is externalized
- **Error Handling**: Comprehensive error handling throughout the application
- **Security**: Environment variables protect sensitive information

### Testing

To test the API endpoints:

```bash
# Health check
curl http://localhost:3000/api/health

# Test policy analysis
curl -X POST http://localhost:3000/api/analyze-policy \
  -H "Content-Type: application/json" \
  -d '{"text":"Sample policy text","language":"en"}'
```

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**: Ensure SSL paths are absolute and certificates are valid
2. **API Key Issues**: Verify your API key is correct and has sufficient credits
3. **Port Already in Use**: Change the `PORT` in your `.env` file
4. **File Upload Errors**: Check file size limits and ensure files are valid PDFs
5. **OpenAI SDK Errors**: Ensure your `API_URL` is correctly formatted (without `/chat/completions` suffix)
6. **Model Not Found**: Verify the `MODEL_ID` is supported by your chosen API provider

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in your environment.

### OpenAI Package Configuration

The application uses the official OpenAI SDK which requires specific configuration:

- **Base URL Format**: Use base URLs without the `/chat/completions` suffix (e.g., `https://api.openai.com/v1`)
- **API Key**: Ensure your API key has the correct permissions for chat completions
- **Model Compatibility**: Verify your chosen model supports streaming responses
- **Rate Limits**: Be aware of rate limits imposed by your API provider

#### Switching API Providers

To switch between different OpenAI-compatible providers, update your `.env` file:

```bash
# For OpenAI
API_KEY=sk-your-openai-key
API_URL=https://api.openai.com/v1
MODEL_ID=gpt-4

# For DeepInfra
API_KEY=your-deepinfra-key
API_URL=https://api.deepinfra.com/v1/openai
MODEL_ID=meta-llama/Meta-Llama-3.1-70B-Instruct
```

## Deployment

### Production Considerations

1. **Environment Variables**: Set all required environment variables in your production environment
2. **SSL Certificates**: Use proper SSL certificates from a trusted CA
3. **API Keys**: Secure your API key and monitor usage
4. **File Uploads**: Consider implementing additional file validation and virus scanning
5. **Rate Limiting**: Implement rate limiting for API endpoints
6. **Monitoring**: Add logging and monitoring for production use

## Technical Architecture

The application follows a clean, simplified architecture:

### Backend Structure

- **`server.js`**: Main application entry point with Express server setup
- **`src/services/aiService.js`**: OpenAI SDK integration for AI analysis
- **`src/routes/policyRoutes.js`**: API endpoints for policy analysis and comparison
- **`src/middleware/`**: Custom middleware for request processing

### Frontend Structure

- **`public/api.js`**: Main frontend logic with streaming response handling
- **`public/config.js`**: Frontend configuration management
- **`public/index.html`**: Single-page application interface

### Key Design Decisions

1. **Simplified Streaming**: Direct OpenAI stream processing without complex reasoning extraction
2. **Official SDK**: Uses the official OpenAI package for reliable API communication
3. **Provider Agnostic**: Supports multiple OpenAI-compatible API providers
4. **Real-time Updates**: Streaming responses for immediate user feedback
5. **Clean Architecture**: Separation of concerns between services, routes, and frontend

### Data Flow

1. User uploads PDF or enters text
2. Frontend processes file and sends to backend API
3. Backend uses OpenAI SDK to create streaming completion
4. Response streams directly to frontend for real-time display
5. No intermediate processing or reasoning extraction

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes following the existing code structure
4. Test your changes thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please create an issue in the GitHub repository.