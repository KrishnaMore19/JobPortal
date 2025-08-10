// genaiSlice.js - Fixed version with safe state management

import { createSlice } from "@reduxjs/toolkit";

// Helper function to generate unique message IDs
const generateMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// ✅ Helper function to ensure nested object exists
const ensureNestedState = (state, path) => {
  const keys = path.split('.');
  let current = state;
  
  for (const key of keys) {
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  return current;
};

// ✅ Helper function to safely initialize chatbot state
const initializeChatbotState = (state) => {
  if (!state.chatbot) {
    state.chatbot = {};
  }
  
  // Ensure all required chatbot properties exist
  if (!state.chatbot.messages) state.chatbot.messages = [];
  if (typeof state.chatbot.loading !== 'boolean') state.chatbot.loading = false;
  if (!state.chatbot.error) state.chatbot.error = null;
  if (typeof state.chatbot.isConnected !== 'boolean') state.chatbot.isConnected = false;
  if (!state.chatbot.lastMessageTime) state.chatbot.lastMessageTime = null;
  if (typeof state.chatbot.botTyping !== 'boolean') state.chatbot.botTyping = false;
  
  // ✅ Ensure fileUploadStatus exists with all required properties
  if (!state.chatbot.fileUploadStatus) {
    state.chatbot.fileUploadStatus = {};
  }
  if (typeof state.chatbot.fileUploadStatus.uploading !== 'boolean') {
    state.chatbot.fileUploadStatus.uploading = false;
  }
  if (!state.chatbot.fileUploadStatus.error) {
    state.chatbot.fileUploadStatus.error = null;
  }
  if (typeof state.chatbot.fileUploadStatus.success !== 'boolean') {
    state.chatbot.fileUploadStatus.success = false;
  }
};

const initialState = {
  coverLetter: {
    content: null,
    loading: false,
    error: null,
    jobId: null,
    isGenerated: false
  },
  resumeTips: {
    tips: [],
    loading: false,
    error: null,
    overallScore: null,
    isAnalyzed: false
  },
  jobMatcher: {
    matchScore: null,
    matchingSkills: [],
    missingSkills: [],
    recommendations: [],
    loading: false,
    error: null,
    isMatched: false
  },
  chatbot: {
    messages: [],
    loading: false,
    error: null,
    isConnected: false,
    lastMessageTime: null,
    fileUploadStatus: {
      uploading: false,
      error: null,
      success: false
    },
    botTyping: false
  }
};

const genaiSlice = createSlice({
  name: "genai",
  initialState,
  reducers: {
    /* ====== Cover-Letter ====== */
    generateCoverLetterStart: (state, action) => {
      state.coverLetter.loading = true;
      state.coverLetter.error = null;
      state.coverLetter.jobId = action.payload.jobId;
    },
    generateCoverLetterSuccess: (state, action) => {
      state.coverLetter.loading = false;
      state.coverLetter.content = action.payload.content;
      state.coverLetter.isGenerated = true;
      state.coverLetter.error = null;
    },
    generateCoverLetterFailure: (state, action) => {
      state.coverLetter.loading = false;
      state.coverLetter.error = action.payload;
      state.coverLetter.isGenerated = false;
    },
    clearCoverLetter: (state) => {
      state.coverLetter = initialState.coverLetter;
    },

    /* ====== Resume-Tips ====== */
    getResumeTipsStart: (state) => {
      state.resumeTips.loading = true;
      state.resumeTips.error = null;
    },
    getResumeTipsSuccess: (state, action) => {
      state.resumeTips.loading = false;
      state.resumeTips.tips = action.payload.tips;
      state.resumeTips.overallScore = action.payload.overallScore;
      state.resumeTips.isAnalyzed = true;
      state.resumeTips.error = null;
    },
    getResumeTipsFailure: (state, action) => {
      state.resumeTips.loading = false;
      state.resumeTips.error = action.payload;
      state.resumeTips.isAnalyzed = false;
    },
    clearResumeTips: (state) => {
      state.resumeTips = initialState.resumeTips;
    },

    /* ====== Job-Matcher ====== */
    matchJobStart: (state) => {
      state.jobMatcher.loading = true;
      state.jobMatcher.error = null;
    },
    matchJobSuccess: (state, action) => {
      state.jobMatcher.loading = false;
      state.jobMatcher.matchScore = action.payload.matchScore;
      state.jobMatcher.matchingSkills = action.payload.matchingSkills;
      state.jobMatcher.missingSkills = action.payload.missingSkills;
      state.jobMatcher.recommendations = action.payload.recommendations;
      state.jobMatcher.isMatched = true;
      state.jobMatcher.error = null;
    },
    matchJobFailure: (state, action) => {
      state.jobMatcher.loading = false;
      state.jobMatcher.error = action.payload;
      state.jobMatcher.isMatched = false;
    },
    clearJobMatch: (state) => {
      state.jobMatcher = initialState.jobMatcher;
    },

    /* ====== Chatbot - Safe State Management ====== */
    sendChatMessageStart: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.loading = true;
      state.chatbot.error = null;
      state.chatbot.botTyping = false;
      
      // Add user message immediately to show in UI
      const userMessage = {
        id: generateMessageId(),
        message: action.payload.message,
        isUser: true,
        timestamp: new Date().toISOString(),
        hasFile: action.payload.hasFile || false,
        fileName: action.payload.fileName || null
      };
      
      state.chatbot.messages.push(userMessage);
    },

    sendChatMessageSuccess: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.loading = false;
      state.chatbot.error = null;
      state.chatbot.isConnected = true;
      state.chatbot.lastMessageTime = new Date().toISOString();
      state.chatbot.botTyping = false;
      
      // Add bot response
      const botMessage = {
        id: generateMessageId(),
        message: action.payload.message,
        isUser: false,
        timestamp: new Date().toISOString(),
        fileUploaded: action.payload.file_uploaded || false
      };
      
      state.chatbot.messages.push(botMessage);
    },

    sendChatMessageFailure: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.loading = false;
      state.chatbot.error = action.payload;
      state.chatbot.isConnected = false;
      state.chatbot.botTyping = false;
    },

    /* ====== File Upload Status - Safe Management ====== */
    fileUploadStart: (state) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.fileUploadStatus.uploading = true;
      state.chatbot.fileUploadStatus.error = null;
      state.chatbot.fileUploadStatus.success = false;
    },

    fileUploadSuccess: (state) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.fileUploadStatus.uploading = false;
      state.chatbot.fileUploadStatus.error = null;
      state.chatbot.fileUploadStatus.success = true;
    },

    fileUploadFailure: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.fileUploadStatus.uploading = false;
      state.chatbot.fileUploadStatus.error = action.payload;
      state.chatbot.fileUploadStatus.success = false;
    },

    clearFileUploadStatus: (state) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.fileUploadStatus = initialState.chatbot.fileUploadStatus;
    },

    /* ====== Chat Utilities - Safe Management ====== */
    clearChatHistory: (state) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.messages = [];
      state.chatbot.error = null;
      state.chatbot.lastMessageTime = null;
      state.chatbot.loading = false;
      state.chatbot.botTyping = false;
      state.chatbot.fileUploadStatus = { ...initialState.chatbot.fileUploadStatus };
    },

    clearChatError: (state) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.error = null;
    },

    setChatConnectionStatus: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.isConnected = action.payload;
    },

    setBotTyping: (state, action) => {
      // ✅ Initialize chatbot state safely
      initializeChatbotState(state);
      
      state.chatbot.botTyping = action.payload;
      // Don't show both loading and typing at the same time
      if (action.payload) {
        state.chatbot.loading = false;
      }
    },

    // ✅ FIXED: Safe reset of chat loading states
    resetChatLoadingState: (state) => {
      // ✅ Initialize chatbot state safely FIRST
      initializeChatbotState(state);
      
      // Now safely set the properties
      state.chatbot.loading = false;
      state.chatbot.botTyping = false;
      state.chatbot.fileUploadStatus.uploading = false;
    },

    /* ====== Global reset with safe initialization ====== */
    clearAllGenAI: (state) => {
      // Return a completely fresh initial state
      return { ...initialState };
    }
  }
});

export const {
  // Cover Letter actions
  generateCoverLetterStart,
  generateCoverLetterSuccess,
  generateCoverLetterFailure,
  clearCoverLetter,
  
  // Resume Tips actions
  getResumeTipsStart,
  getResumeTipsSuccess,
  getResumeTipsFailure,
  clearResumeTips,
  
  // Job Matcher actions
  matchJobStart,
  matchJobSuccess,
  matchJobFailure,
  clearJobMatch,
  
  // Chat actions
  sendChatMessageStart,
  sendChatMessageSuccess,
  sendChatMessageFailure,
  
  // File upload actions
  fileUploadStart,
  fileUploadSuccess,
  fileUploadFailure,
  clearFileUploadStatus,
  
  // Chat utilities
  clearChatHistory,
  clearChatError,
  setChatConnectionStatus,
  setBotTyping,
  resetChatLoadingState,
  
  // Global action
  clearAllGenAI
} = genaiSlice.actions;

export default genaiSlice.reducer;