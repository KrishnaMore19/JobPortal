import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./utils/db.js";
import userRoute from "./routes/user.route.js";
import companyRoute from "./routes/company.route.js";
import jobRoute from "./routes/job.route.js";
import applicationRoute from "./routes/application.route.js";

dotenv.config({});

const app = express();

// ------------------  MIDDLEWARE  ------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ------------------  CORS CONFIGURATION  ------------------
const corsOptions = {
   origin: [
      // Local development URLs
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      
      // Production URLs - Your actual frontend domain
      'https://job-portal-eight-orcin.vercel.app',
      
      // If you're unsure of your domain, you can temporarily use this (NOT recommended for production):
      // '*'  // ⚠️ ONLY for debugging - remove this in production
    ],
    credentials: true,  // ✅ Allow cookies/credentials
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Cookie',
      'X-Requested-With',
      'Accept',
      'Origin'
    ],
    optionsSuccessStatus: 200 // For legacy browser support
}

app.use(cors(corsOptions));

// ------------------  ADDITIONAL MIDDLEWARE  ------------------
// Handle preflight requests
app.options('*', cors(corsOptions));

// Security headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

// Request logging middleware (helpful for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// ------------------  ROUTES  ------------------
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

// ------------------  HEALTH CHECK ROUTES  ------------------
// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Database health check
app.get('/health/db', async (req, res) => {
  try {
    // You can add a simple DB query here to verify connection
    res.status(200).json({
      status: 'OK',
      message: 'Database connection is healthy',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ------------------  ERROR HANDLING  ------------------
// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  
  // CORS error
  if (error.message && error.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'CORS error: Origin not allowed',
      timestamp: new Date().toISOString()
    });
  }
  
  // Generic error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// ------------------  SERVER STARTUP  ------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    connectDB();
    console.log(`🚀 Server running at port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📝 Allowed origins: https://job-portal-eight-orcin.vercel.app and localhost URLs`);
});

// ------------------  GRACEFUL SHUTDOWN  ------------------
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Export app for testing
export default app;