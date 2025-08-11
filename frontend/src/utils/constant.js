// constants.js

// ------------------  ENVIRONMENT DETECTION  ------------------
const isDevelopment = 
  typeof window !== 'undefined' 
    ? (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    : process.env.NODE_ENV === 'development';

// ------------------  BACKEND BASES  ------------------
// 🚀 PRODUCTION URLs (Render) - Now Active
export const USER_API_END_POINT        = isDevelopment 
  ? "http://localhost:8080/api/v1/user"
  : "https://jobportal-1-9hbm.onrender.com/api/v1/user";

export const JOB_API_END_POINT         = isDevelopment
  ? "http://localhost:8080/api/v1/job" 
  : "https://jobportal-1-9hbm.onrender.com/api/v1/job";

export const APPLICATION_API_END_POINT = isDevelopment
  ? "http://localhost:8080/api/v1/application"
  : "https://jobportal-1-9hbm.onrender.com/api/v1/application";

export const COMPANY_API_END_POINT     = isDevelopment
  ? "http://localhost:8080/api/v1/company"
  : "https://jobportal-1-9hbm.onrender.com/api/v1/company";

export const GENAI_API_BASE            = isDevelopment
  ? "http://127.0.0.1:8000"
  : "https://jobportal-8o5z.onrender.com";

export const API_BASE_URL              = GENAI_API_BASE;           // legacy alias

// ------------------  GEN-AI ROUTES ------------------
export const COVER_LETTER_API          = `${GENAI_API_BASE}/genai/cover-letter`;
export const RESUME_TIPS_API           = `${GENAI_API_BASE}/genai/resume-tips`;
export const RESUME_MATCH_API          = `${GENAI_API_BASE}/genai/jd-match`;

// ------------------  DETAILED ENDPOINTS ------------------
export const API_ENDPOINTS = {
  COVER_LETTER: {
    GENERATE: `${COVER_LETTER_API}/`,
    UPDATE:   `${COVER_LETTER_API}/update/`,
    BASE:     COVER_LETTER_API
  },

  RESUME_TIPS: {
    GET:  `${RESUME_TIPS_API}/`,
    BASE: RESUME_TIPS_API
  },

  JOB_MATCH: {
    ANALYZE: `${RESUME_MATCH_API}/`,
    BASE:    RESUME_MATCH_API
  },

  // ✅ FIXED: Updated to match your simplified backend router
  CHAT: {
    SEND:   `${GENAI_API_BASE}/chat`,     // POST /chat - main chat endpoint
    HEALTH: `${GENAI_API_BASE}/health`,   // GET /health - health check
    CLEAR:  `${GENAI_API_BASE}/clear`,    // POST /clear - clear chat history
    BASE:   GENAI_API_BASE
  },

  // ✅ Backend API endpoints - matching your actual routes
  USER: {
    LOGIN:    `${USER_API_END_POINT}/login`,       // POST /api/v1/user/login
    REGISTER: `${USER_API_END_POINT}/register`,    // POST /api/v1/user/register
    PROFILE:  `${USER_API_END_POINT}/profile`,     // GET /api/v1/user/profile
    LOGOUT:   `${USER_API_END_POINT}/logout`,      // POST /api/v1/user/logout
    UPDATE:   `${USER_API_END_POINT}/profile/update`, // PUT /api/v1/user/profile/update
    BASE:     USER_API_END_POINT
  },

  JOBS: {
    GET_ALL:  `${JOB_API_END_POINT}/get`,          // GET /api/v1/job/get
    POST:     `${JOB_API_END_POINT}/post`,         // POST /api/v1/job/post
    BY_ID:    `${JOB_API_END_POINT}/get`,          // GET /api/v1/job/get/:id
    ADMIN:    `${JOB_API_END_POINT}/getadminjobs`, // GET /api/v1/job/getadminjobs
    BASE:     JOB_API_END_POINT
  },

  APPLICATIONS: {
    APPLY:    `${APPLICATION_API_END_POINT}/apply`,    // POST /api/v1/application/apply
    GET_ALL:  `${APPLICATION_API_END_POINT}/get`,      // GET /api/v1/application/get
    GET_APPLICANTS: `${APPLICATION_API_END_POINT}/applicants`, // GET /api/v1/application/applicants
    UPDATE_STATUS: `${APPLICATION_API_END_POINT}/status/update`, // POST /api/v1/application/status/update
    BASE:     APPLICATION_API_END_POINT
  },

  COMPANIES: {
    GET_ALL:  `${COMPANY_API_END_POINT}/get`,      // GET /api/v1/company/get
    POST:     `${COMPANY_API_END_POINT}/register`, // POST /api/v1/company/register
    BY_ID:    `${COMPANY_API_END_POINT}/get`,      // GET /api/v1/company/get/:id
    UPDATE:   `${COMPANY_API_END_POINT}/update`,   // PUT /api/v1/company/update/:id
    BASE:     COMPANY_API_END_POINT
  },

  // Legacy endpoints (kept for backward compatibility)
  HEALTH: {
    CHECK: `${GENAI_API_BASE}/health`,
    DB:    `${GENAI_API_BASE}/health/db`,
    BASE:  `${GENAI_API_BASE}/health`
  }
};

// ------------------  REDUX / HTTP / UI CONSTANTS ------------------
export const ACTION_TYPES = {
  // Authentication
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  
  // Jobs
  FETCH_JOBS_REQUEST: 'FETCH_JOBS_REQUEST',
  FETCH_JOBS_SUCCESS: 'FETCH_JOBS_SUCCESS',
  FETCH_JOBS_FAILURE: 'FETCH_JOBS_FAILURE',
  
  // Applications
  APPLY_JOB_REQUEST: 'APPLY_JOB_REQUEST',
  APPLY_JOB_SUCCESS: 'APPLY_JOB_SUCCESS',
  APPLY_JOB_FAILURE: 'APPLY_JOB_FAILURE',
};

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
};

export const REQUEST_CONFIG = {
  TIMEOUT: isDevelopment ? 30000 : 60000,  // ✅ Longer timeout for production
  HEADERS: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  },
  // ✅ Default config for authenticated requests
  WITH_CREDENTIALS: true
};

// ✅ Enhanced API request helper
export const createApiRequest = (endpoint, options = {}) => ({
  ...options,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  },
  credentials: 'include', // Important for authentication cookies
  timeout: REQUEST_CONFIG.TIMEOUT,
  mode: 'cors' // Explicitly set CORS mode
});

// ✅ Enhanced error handling
export const handleApiError = (error, endpoint) => {
  console.error(`API Error at ${endpoint}:`, error);
  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      message: 'Network error. Please check your internet connection.',
      status: 'NETWORK_ERROR'
    };
  }
  
  if (error.status === 401) {
    return {
      message: 'Session expired. Please login again.',
      status: 'UNAUTHORIZED',
      redirect: '/login'
    };
  }
  
  if (error.status === 403) {
    return {
      message: 'Access denied. Insufficient permissions.',
      status: 'FORBIDDEN'
    };
  }
  
  if (error.status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      status: 'SERVER_ERROR'
    };
  }
  
  return {
    message: error.message || 'Something went wrong. Please try again.',
    status: 'GENERIC_ERROR'
  };
};

export const UI_CONSTANTS = {
  PAGINATION: { DEFAULT_LIMIT: 50, MAX_LIMIT: 200 },
  MESSAGES: {
    SUCCESS: {
      COVER_LETTER_GENERATED: 'Cover letter generated successfully!',
      COVER_LETTER_UPDATED:   'Cover letter updated successfully!',
      RESUME_TIPS_LOADED:     'Resume analysis completed!',
      JOB_MATCH_COMPLETED:    'Job match analysis completed!',
      CHAT_MESSAGE_SENT:      'Message sent successfully!',
      FILE_UPLOADED:          'File uploaded successfully!',
      LOGIN_SUCCESS:          'Welcome back! Login successful.',
      LOGOUT_SUCCESS:         'Logged out successfully.',
      REGISTRATION_SUCCESS:   'Account created successfully! Please login.',
      APPLICATION_SUCCESS:    'Application submitted successfully!',
      PROFILE_UPDATED:        'Profile updated successfully!'
    },
    ERROR: {
      LOGIN_REQUIRED: 'Please login to access this feature',
      UNAUTHORIZED: 'Your session has expired. Please login again.',
      NETWORK_ERROR:  'Network error. Please check your connection.',
      SERVER_ERROR:   'Server error. Please try again later.',
      GENERIC_ERROR:  'Something went wrong. Please try again.',
      FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
      INVALID_FILE_TYPE: 'Invalid file type. Please upload PDF or DOCX files only.',
      CORS_ERROR: 'Connection blocked. Please check server configuration.',
      TIMEOUT_ERROR: 'Request timed out. Please try again.'
    }
  },
  LOADING_STATES: {
    GENERATING: 'Generating…',
    ANALYZING:  'Analyzing…',
    LOADING:    'Loading…',
    PROCESSING: 'Processing…',
    UPLOADING:  'Uploading…',
    SENDING:    'Sending…',
    CONNECTING: 'Connecting…',
    AUTHENTICATING: 'Authenticating…'
  }
};

export const FILE_CONSTANTS = {
  ALLOWED_TYPES: ['.pdf', '.docx', '.doc'],
  MAX_SIZE: 5 * 1024 * 1024, // 5 MB
  UPLOAD_DIR: 'uploaded_resumes',
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
};

// Chat specific constants
export const CHAT_CONSTANTS = {
  MAX_MESSAGE_LENGTH: 2000,
  MAX_FILE_SIZE: FILE_CONSTANTS.MAX_SIZE,
  ALLOWED_FILE_TYPES: FILE_CONSTANTS.ALLOWED_TYPES,
  DEFAULT_ERROR_MESSAGE: 'Sorry, something went wrong. Please try again.',
  TYPING_INDICATOR_DELAY: 1000,
  CHAT_TIMEOUT: isDevelopment ? 30000 : 60000  // ✅ Longer timeout for production
};

// ✅ Debug information
export const DEBUG_INFO = {
  ENVIRONMENT: isDevelopment ? 'development' : 'production',
  USER_API: USER_API_END_POINT,
  JOB_API: JOB_API_END_POINT,
  GENAI_API: GENAI_API_BASE,
  TIMESTAMP: new Date().toISOString()
};

// Log debug info in development
if (isDevelopment && typeof console !== 'undefined') {
  console.log('🔧 Constants Debug Info:', DEBUG_INFO);
}

// default export (optional, use only if needed)
export default {
  API_BASE_URL,
  API_ENDPOINTS,
  ACTION_TYPES,
  HTTP_STATUS,
  REQUEST_CONFIG,
  UI_CONSTANTS,
  FILE_CONSTANTS,
  CHAT_CONSTANTS,
  createApiRequest,
  handleApiError,
  DEBUG_INFO
};