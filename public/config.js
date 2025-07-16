// Frontend Configuration
// This file contains all configuration settings for the frontend application

// Main Configuration Object
const FRONTEND_CONFIG = {
    // API Configuration
    API: {
        // Base URL for the API server (same as current origin since served from same server)
        BASE_URL: window.location.origin,
        
        // API endpoints
        ENDPOINTS: {
            ANALYZE_POLICY: '/api/analyze-policy',
            COMPARE_POLICY: '/api/compare-policy',
            HEALTH_CHECK: '/api/health'
        }
    },
    
    // Environment Detection (simplified since API is served from same origin)
    ENVIRONMENT: {
        IS_LOCALHOST: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    },
    
    // Feature Flags
    FEATURES: {
        ENABLE_DEBUG_MODE: false,
        ENABLE_RAW_CONTENT_DISPLAY: false,
        ENABLE_PRIVACY_MODAL: true,
        ENABLE_PASSWORD_PROTECTION: true
    },
    
    // UI Configuration
    UI: {
        MAX_FILE_SIZE_MB: 10,
        MAX_COMPARISON_FILES: 5,
        SUPPORTED_FILE_TYPES: ['.pdf'],
        DEFAULT_LANGUAGE: 'en'
    },
    
    // OCR Configuration
    OCR: {
        TEXT_THRESHOLD: 2,
        RENDER_SCALE: 1.5,
        TESSERACT_OPTIONS: {
            tessedit_pageseg_mode: 'AUTO',
            tessedit_ocr_engine_mode: 'TESSERACT_ONLY',
            tessedit_parallelize: true,
            preserve_interword_spaces: '1'
        }
    },
    
    // Get the API URL (always current origin since served from same server)
    getApiUrl() {
        return this.API.BASE_URL;
    }
};

// Legacy API Configuration for backward compatibility
const API_CONFIG = {
    get BASE_URL() {
        return FRONTEND_CONFIG.getApiUrl();
    },
    
    ENDPOINTS: FRONTEND_CONFIG.API.ENDPOINTS,
    
    async init() {
        console.log('API configuration initialized with base URL:', this.BASE_URL);
        return Promise.resolve();
    }
};

// Legacy OCR Configuration for backward compatibility
const OCR_CONFIG = {
    get TEXT_THRESHOLD() {
        return FRONTEND_CONFIG.OCR.TEXT_THRESHOLD;
    },
    get RENDER_SCALE() {
        return FRONTEND_CONFIG.OCR.RENDER_SCALE;
    },
    get TESSERACT_OPTIONS() {
        return FRONTEND_CONFIG.OCR.TESSERACT_OPTIONS;
    }
};

// Legacy UI Configuration for backward compatibility
const UI_CONFIG = {
    get MAX_COMPARISON_FILES() {
        return FRONTEND_CONFIG.UI.MAX_COMPARISON_FILES;
    },
    get MAX_FILE_SIZE() {
        return FRONTEND_CONFIG.UI.MAX_FILE_SIZE_MB * 1024 * 1024;
    },
    get SUPPORTED_FILE_TYPES() {
        return FRONTEND_CONFIG.UI.SUPPORTED_FILE_TYPES;
    },
    get DEFAULT_LANGUAGE() {
        return FRONTEND_CONFIG.UI.DEFAULT_LANGUAGE;
    }
};

// Export configurations for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FRONTEND_CONFIG,
        API_CONFIG,
        OCR_CONFIG,
        UI_CONFIG
    };
} else {
    // Make available globally for browser usage
    window.FRONTEND_CONFIG = FRONTEND_CONFIG;
    window.API_CONFIG = API_CONFIG;
    window.OCR_CONFIG = OCR_CONFIG;
    window.UI_CONFIG = UI_CONFIG;
    
    // Legacy support for FRONTEND_ENV
    window.FRONTEND_ENV = FRONTEND_CONFIG;
}