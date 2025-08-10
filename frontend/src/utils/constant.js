// Environment detection with fallback
const getEnvironment = () => {
  const hostname = window.location.hostname;
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168');
};

const isLocalhost = getEnvironment();

// Backend URLs - consider using environment variables in production
const BACKENDS = {
  LOCAL: {
    NODE: "http://localhost:8080",
    GENAI: "http://127.0.0.1:8000"
  },
  PROD: {
    NODE: "https://jobportal-1-9hbm.onrender.com",
    GENAI: "https://jobportal-8o5z.onrender.com"
  }
};

// Get current backend URLs
const currentBackend = isLocalhost ? BACKENDS.LOCAL : BACKENDS.PROD;
const NODE_BASE = currentBackend.NODE;
const GENAI_BASE = currentBackend.GENAI;

// API Base URLs
export const USER_API_END_POINT = `${NODE_BASE}/api/v1/user`;
export const JOB_API_END_POINT = `${NODE_BASE}/api/v1/job`;
export const APPLICATION_API_END_POINT = `${NODE_BASE}/api/v1/application`;
export const COMPANY_API_END_POINT = `${NODE_BASE}/api/v1/company`;

// GenAI API Base
export const API_BASE_URL = GENAI_BASE;

// Consistent endpoint structure (no trailing slashes in base, add in specific endpoints)
export const API_ENDPOINTS = {
  COVER_LETTER: {
    GENERATE: `${GENAI_BASE}/genai/cover-letter/generate`,
    UPDATE: `${GENAI_BASE}/genai/cover-letter/update`,
    BASE: `${GENAI_BASE}/genai/cover-letter`
  },

  RESUME_TIPS: {
    GET: `${GENAI_BASE}/genai/resume-tips`,
    BASE: `${GENAI_BASE}/genai/resume-tips`
  },

  JOB_MATCH: {
    ANALYZE: `${GENAI_BASE}/genai/jd-match/analyze`,
    BASE: `${GENAI_BASE}/genai/jd-match`
  },

  CHAT: {
    SEND: `${GENAI_BASE}/chat/send`,
    HEALTH: `${GENAI_BASE}/chat/health`,
    CLEAR: `${GENAI_BASE}/chat/clear`,
    HISTORY: `${GENAI_BASE}/chat/history`,
    BASE: `${GENAI_BASE}/chat`
  },

  HEALTH: {
    CHECK: `${GENAI_BASE}/health`,
    DB: `${GENAI_BASE}/health/db`,
    SERVICES: `${GENAI_BASE}/health/services`,
    BASE: `${GENAI_BASE}/health`
  }
};

// Redux Action Types
export const ACTION_TYPES = {
  // Auth
  LOGIN_REQUEST: 'LOGIN_REQUEST',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  
  // Cover Letter
  GENERATE_COVER_LETTER_REQUEST: 'GENERATE_COVER_LETTER_REQUEST',
  GENERATE_COVER_LETTER_SUCCESS: 'GENERATE_COVER_LETTER_SUCCESS',
  GENERATE_COVER_LETTER_FAILURE: 'GENERATE_COVER_LETTER_FAILURE',
  
  // Resume Tips
  GET_RESUME_TIPS_REQUEST: 'GET_RESUME_TIPS_REQUEST',
  GET_RESUME_TIPS_SUCCESS: 'GET_RESUME_TIPS_SUCCESS',
  GET_RESUME_TIPS_FAILURE: 'GET_RESUME_TIPS_FAILURE',
  
  // Job Match
  ANALYZE_JOB_MATCH_REQUEST: 'ANALYZE_JOB_MATCH_REQUEST',
  ANALYZE_JOB_MATCH_SUCCESS: 'ANALYZE_JOB_MATCH_SUCCESS',
  ANALYZE_JOB_MATCH_FAILURE: 'ANALYZE_JOB_MATCH_FAILURE',
  
  // Chat
  SEND_CHAT_MESSAGE_REQUEST: 'SEND_CHAT_MESSAGE_REQUEST',
  SEND_CHAT_MESSAGE_SUCCESS: 'SEND_CHAT_MESSAGE_SUCCESS',
  SEND_CHAT_MESSAGE_FAILURE: 'SEND_CHAT_MESSAGE_FAILURE',
  CLEAR_CHAT_HISTORY: 'CLEAR_CHAT_HISTORY'
};

// HTTP Status Codes
export const HTTP_STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  
  // Server Errors
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
};

// Request Configuration
export const REQUEST_CONFIG = {
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Cache-Control': 'no-cache'
  },
  // Add CORS settings if needed
  CORS: {
    credentials: 'include',
    mode: 'cors'
  }
};

// UI Constants
export const UI_CONSTANTS = {
  PAGINATION: { 
    DEFAULT_LIMIT: 50, 
    MAX_LIMIT: 200,
    DEFAULT_PAGE: 1 
  },
  
  MESSAGES: {
    SUCCESS: {
      COVER_LETTER_GENERATED: 'Cover letter generated successfully!',
      COVER_LETTER_UPDATED: 'Cover letter updated successfully!',
      RESUME_TIPS_LOADED: 'Resume analysis completed!',
      JOB_MATCH_COMPLETED: 'Job match analysis completed!',
      CHAT_MESSAGE_SENT: 'Message sent successfully!',
      FILE_UPLOADED: 'File uploaded successfully!',
      PROFILE_UPDATED: 'Profile updated successfully!'
    },
    
    ERROR: {
      LOGIN_REQUIRED: 'Please login to access this feature',
      NETWORK_ERROR: 'Network error. Please check your connection.',
      SERVER_ERROR: 'Server error. Please try again later.',
      GENERIC_ERROR: 'Something went wrong. Please try again.',
      FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
      INVALID_FILE_TYPE: 'Invalid file type. Please upload PDF or DOCX files only.',
      FILE_SIZE_EXCEEDED: 'File size exceeds the maximum limit.',
      UNAUTHORIZED_ACCESS: 'You are not authorized to perform this action.',
      SESSION_EXPIRED: 'Your session has expired. Please login again.',
      VALIDATION_ERROR: 'Please check your input and try again.'
    },
    
    WARNING: {
      UNSAVED_CHANGES: 'You have unsaved changes. Are you sure you want to leave?',
      FILE_REPLACE: 'This will replace your existing file. Continue?',
      DELETE_CONFIRMATION: 'This action cannot be undone. Are you sure?'
    }
  },
  
  LOADING_STATES: {
    GENERATING: 'Generating…',
    ANALYZING: 'Analyzing…',
    LOADING: 'Loading…',
    PROCESSING: 'Processing…',
    UPLOADING: 'Uploading…',
    SENDING: 'Sending…',
    SAVING: 'Saving…',
    DELETING: 'Deleting…'
  },
  
  TIMEOUTS: {
    NOTIFICATION: 5000,
    TOAST: 3000,
    DEBOUNCE: 500,
    TYPING_INDICATOR: 1000
  }
};

// File Constants
export const FILE_CONSTANTS = {
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.doc'],
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  MAX_SIZE_MB: 5,
  UPLOAD_DIR: 'uploaded_resumes',
  
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ],
  
  VALIDATION: {
    MIN_SIZE: 1024, // 1KB minimum
    MAX_FILENAME_LENGTH: 255,
    ALLOWED_CHARACTERS: /^[a-zA-Z0-9._-]+$/
  }
};

// Chat Constants
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  MIN_MESSAGE_LENGTH: 1,
  MAX_FILE_SIZE: FILE_CONSTANTS.MAX_SIZE,
  ALLOWED_FILE_TYPES: FILE_CONSTANTS.ALLOWED_EXTENSIONS,
  DEFAULT_ERROR_MESSAGE: 'Sorry, something went wrong. Please try again.',
  TYPING_INDICATOR_DELAY: 1000,
  MAX_HISTORY_SIZE: 100,
  RECONNECT_ATTEMPTS: 3,
  RECONNECT_DELAY: 2000
};

// Application Constants
export const APP_CONSTANTS = {
  NAME: 'JobPortal',
  VERSION: '1.0.0',
  ENVIRONMENT: isLocalhost ? 'development' : 'production',
  DEBUG: isLocalhost,
  
  FEATURES: {
    DARK_MODE: true,
    NOTIFICATIONS: true,
    FILE_UPLOAD: true,
    CHAT: true,
    ANALYTICS: !isLocalhost // Only in production
  },
  
  STORAGE_KEYS: {
    AUTH_TOKEN: 'jobportal_auth_token',
    USER_PREFERENCES: 'jobportal_user_prefs',
    CHAT_HISTORY: 'jobportal_chat_history',
    DRAFT_DATA: 'jobportal_drafts'
  }
};

// Validation Helpers
export const VALIDATION = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE: /^\+?[\d\s-()]+$/,
  URL: /^https?:\/\/.+/,
  PASSWORD: {
    MIN_LENGTH: 8,
    REQUIRE_UPPERCASE: true,
    REQUIRE_LOWERCASE: true,
    REQUIRE_NUMBERS: true,
    REQUIRE_SPECIAL_CHARS: true
  }
};

// Export environment info for debugging
export const ENV_INFO = {
  isLocalhost,
  nodeBackend: NODE_BASE,
  genaiBackend: GENAI_BASE,
  hostname: window.location.hostname,
  protocol: window.location.protocol
};

// Default export
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ACTION_TYPES,
  HTTP_STATUS,
  REQUEST_CONFIG,
  UI_CONSTANTS,
  FILE_CONSTANTS,
  CHAT_CONSTANTS,
  APP_CONSTANTS,
  VALIDATION,
  ENV_INFO
};