import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "./authSlice";
import jobReducer from "./jobSlice";
import companySlice from "./companySlice";
import applicationSlice from "./applicationSlice";
import genaiReducer from "./genaiSlice";

const rootReducer = combineReducers({
  auth: authReducer,
  job: jobReducer,
  company: companySlice,
  application: applicationSlice,
  genai: genaiReducer
});

const persistConfig = {
  key: "root",
  storage,
  whitelist: ["auth", "job", "genai"],
  version: 1,
  migrate: state =>
    Promise.resolve(state?._persist?.version === 1 ? state : undefined)
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Redux Persist actions
          "persist/PERSIST",
          "persist/REHYDRATE",
          
          // Cover Letter actions
          "genai/generateCoverLetterStart",
          "genai/generateCoverLetterSuccess",
          
          // Resume Tips actions
          "genai/getResumeTipsStart",
          "genai/getResumeTipsSuccess",
          
          // Job Matcher actions
          "genai/matchJobStart",
          "genai/matchJobSuccess",
          
          // ✅ NEW: Chat actions (updated for simplified slice)
          "genai/sendChatMessageStart",
          "genai/sendChatMessageSuccess",
          "genai/sendChatMessageFailure",
          
          // ✅ NEW: File upload actions
          "genai/fileUploadStart",
          "genai/fileUploadSuccess",
          "genai/fileUploadFailure",
          
          // ✅ NEW: Chat utility actions
          "genai/clearChatHistory",
          "genai/setChatConnectionStatus",
          "genai/setBotTyping"
        ],
        // ✅ UPDATED: Ignore non-serializable values in these paths
        ignoredPaths: [
          "genai.chatbot.messages",
          "genai.chatbot.lastMessageTime",
          "_persist"
        ],
        warnAfter: 256
      },
      immutableCheck: { 
        warnAfter: 256,
        // ✅ NEW: Ignore immutability checks for chat messages (can be large)
        ignoredPaths: ["genai.chatbot.messages"]
      }
    })
});

export const persistor = persistStore(store);