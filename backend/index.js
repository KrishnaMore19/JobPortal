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

// ------------------  ENHANCED CORS CONFIGURATION  ------------------
const corsOptions = {
   origin: function (origin, callback) {
      // ✅ Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      
      const allowedOrigins = [
         // Local development URLs
         'http://localhost:3000',
         'http://localhost:5173',
         'http://localhost:5174',
         'http://localhost:5175',
         'http://127.0.0.1:3000',
         'http://127.0.0.1:5173',
         
         // Production URLs - Your actual frontend domain
         'https://job-portal-eight-orcin.vercel.app'
      ];
      
      if (allowedOrigins.includes(origin)) {
         console.log(`✅ CORS: Allowed origin: ${origin}`);
         callback(null, true);
      } else {
         console.log(`❌ CORS: Blocked origin: ${origin}`);
         callback(new Error(`CORS: Origin ${origin} not allowed`));
      }
   },
   credentials: true,  // ✅ Allow cookies/credentials - CRITICAL for authentication
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
   allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'Cookie',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Cache-Control',
      'Pragma'
   ],
   exposedHeaders: ['Set-Cookie'], // ✅ Expose cookie headers to frontend
   optionsSuccessStatus: 200, // For legacy browser support
   preflightContinue: false // ✅ Handle preflight internally
};

app.use(cors(corsOptions));

// ------------------  ADDITIONAL MIDDLEWARE  ------------------
// ✅ Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// ✅ Enhanced security headers
app.use((req, res, next) => {
   res.header('Access-Control-Allow-Credentials', 'true');
   
   // ✅ Add security headers for production
   if (process.env.NODE_ENV === 'production') {
      res.header('X-Content-Type-Options', 'nosniff');
      res.header('X-Frame-Options', 'DENY');
      res.header('X-XSS-Protection', '1; mode=block');
   }
   
   next();
});

// ✅ Enhanced request logging middleware
app.use((req, res, next) => {
   const timestamp = new Date().toISOString();
   const origin = req.headers.origin || 'no-origin';
   const userAgent = req.headers['user-agent']?.substring(0, 50) || 'unknown';
   
   console.log(`${timestamp} - ${req.method} ${req.url}`);
   console.log(`  Origin: ${origin}`);
   console.log(`  User-Agent: ${userAgent}`);
   
   // ✅ Log authentication headers for debugging
   if (req.headers.authorization) {
      console.log(`  Auth Header: Bearer ***${req.headers.authorization.substring(req.headers.authorization.length - 10)}`);
   }
   if (req.headers.cookie) {
      console.log(`  Cookies: ${req.headers.cookie.length} chars`);
   }
   
   next();
});

// ✅ Rate limiting middleware (optional but recommended)
const rateLimit = {};
app.use((req, res, next) => {
   const ip = req.ip || req.connection.remoteAddress;
   const now = Date.now();
   
   if (!rateLimit[ip]) {
      rateLimit[ip] = { count: 1, resetTime: now + 60000 }; // 1 minute window
   } else if (now > rateLimit[ip].resetTime) {
      rateLimit[ip] = { count: 1, resetTime: now + 60000 };
   } else {
      rateLimit[ip].count++;
   }
   
   // Allow 1000 requests per minute (generous limit)
   if (rateLimit[ip].count > 1000) {
      return res.status(429).json({
         success: false,
         message: 'Too many requests, please try again later',
         retryAfter: Math.ceil((rateLimit[ip].resetTime - now) / 1000)
      });
   }
   
   next();
});

// ------------------  ROUTES  ------------------
app.use("/api/v1/user", userRoute);
app.use("/api/v1/company", companyRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/application", applicationRoute);

// ------------------  ENHANCED HEALTH CHECK ROUTES  ------------------
// Basic health check
app.get('/health', (req, res) => {
   res.status(200).json({
      status: 'OK',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cors: {
         allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:5173',
            'https://job-portal-eight-orcin.vercel.app'
         ],
         credentials: true
      }
   });
});

// Database health check
app.get('/health/db', async (req, res) => {
   try {
      // ✅ Add a simple DB ping to verify connection
      const mongoose = await import('mongoose');
      const dbState = mongoose.connection.readyState;
      const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];
      
      if (dbState === 1) {
         res.status(200).json({
            status: 'OK',
            message: 'Database connection is healthy',
            dbState: states[dbState],
            timestamp: new Date().toISOString()
         });
      } else {
         res.status(503).json({
            status: 'WARNING',
            message: 'Database connection unstable',
            dbState: states[dbState],
            timestamp: new Date().toISOString()
         });
      }
   } catch (error) {
      res.status(500).json({
         status: 'ERROR',
         message: 'Database connection failed',
         error: error.message,
         timestamp: new Date().toISOString()
      });
   }
});

// ✅ CORS test endpoint
app.get('/health/cors', (req, res) => {
   res.status(200).json({
      status: 'OK',
      message: 'CORS is working',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      headers: {
         'Access-Control-Allow-Origin': req.headers.origin,
         'Access-Control-Allow-Credentials': 'true'
      }
   });
});

// ------------------  ERROR HANDLING  ------------------
// 404 handler
app.use('*', (req, res) => {
   console.log(`❌ 404: Route not found - ${req.method} ${req.originalUrl}`);
   res.status(404).json({
      success: false,
      message: `Route ${req.originalUrl} not found`,
      timestamp: new Date().toISOString(),
      availableRoutes: [
         'GET /health',
         'GET /health/db', 
         'GET /health/cors',
         'POST /api/v1/user/login',
         'POST /api/v1/user/register',
         'GET /api/v1/job/get'
      ]
   });
});

// ✅ Enhanced global error handler
app.use((error, req, res, next) => {
   console.error('🚨 Global Error Handler:');
   console.error('Error:', error.message);
   console.error('Stack:', error.stack);
   console.error('URL:', req.url);
   console.error('Method:', req.method);
   console.error('Origin:', req.headers.origin);
   
   // CORS error
   if (error.message && error.message.includes('CORS')) {
      return res.status(403).json({
         success: false,
         message: 'CORS error: Origin not allowed',
         origin: req.headers.origin,
         allowedOrigins: [
            'http://localhost:3000',
            'http://localhost:5173', 
            'https://job-portal-eight-orcin.vercel.app'
         ],
         timestamp: new Date().toISOString()
      });
   }
   
   // JWT errors
   if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
         success: false,
         message: 'Invalid token',
         timestamp: new Date().toISOString()
      });
   }
   
   if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
         success: false,
         message: 'Token expired',
         timestamp: new Date().toISOString()
      });
   }
   
   // MongoDB errors
   if (error.name === 'ValidationError') {
      return res.status(400).json({
         success: false,
         message: 'Validation error',
         details: error.message,
         timestamp: new Date().toISOString()
      });
   }
   
   // Generic error
   res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Internal Server Error',
      timestamp: new Date().toISOString(),
      ...(process.env.NODE_ENV === 'development' && { 
         stack: error.stack,
         details: error 
      })
   });
});

// ------------------  SERVER STARTUP  ------------------
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
   connectDB();
   console.log('🚀════════════════════════════════════════🚀');
   console.log(`🚀 Server running at port ${PORT}`);
   console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
   console.log(`🔗 Health check: http://localhost:${PORT}/health`);
   console.log(`🌐 CORS test: http://localhost:${PORT}/health/cors`);
   console.log(`📝 Allowed origins:`);
   console.log(`   • https://job-portal-eight-orcin.vercel.app`);
   console.log(`   • http://localhost:3000, http://localhost:5173`);
   console.log(`🍪 Credentials: enabled`);
   console.log('🚀════════════════════════════════════════🚀');
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

// ✅ Handle uncaught exceptions
process.on('uncaughtException', (error) => {
   console.error('🚨 Uncaught Exception:', error);
   process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
   console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
   process.exit(1);
});

// Export app for testing
export default app;