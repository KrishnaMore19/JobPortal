from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from routers import cover_letter_api
from routers.jd_match_api import router as resume_match_api_router  
from routers import resume_tips_api
from db.mongo import db
from pymongo.errors import ConnectionFailure
import logging
from routers.agent_bot_router import router as chatbot_router
from datetime import datetime

# Load environment variables from .env file
load_dotenv()

# Setup logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app with metadata
app = FastAPI(
    title="GenAI Job Assistant API",
    description="Backend for generating Cover Letters, Resume Tips, Resume-JD Matching, and AI Chatbot.",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000",
      'https://job-portal-eight-orcin.vercel.app'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============== EXCEPTION HANDLERS ==============

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions gracefully"""
    logger.warning(f"HTTP Exception: {exc.status_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail,
            "message": "Request failed",
            "timestamp": datetime.now().isoformat()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "Internal server error",
            "message": "An unexpected error occurred",
            "timestamp": datetime.now().isoformat()
        }
    )

# ============== STARTUP/SHUTDOWN EVENTS ==============

@app.on_event("startup")
async def check_mongodb_connection():
    try:
        await db.command("ping")
        logger.info("✅ MongoDB connection successful.")
    except ConnectionFailure as e:
        logger.error(f"❌ MongoDB connection failed: {e}")

# ============== HEALTH CHECK ENDPOINTS ==============
# These match your constants.js HEALTH endpoints

@app.get("/", tags=["Health"])
def read_root():
    return {
        "message": "🚀 GenAI Backend is running!",
        "service": "GenAI Job Assistant API",
        "version": "1.0.0",
        "status": "healthy"
    }

@app.get("/health", tags=["Health"])
async def comprehensive_health_check():
    """Main health check endpoint - matches constants.js HEALTH.CHECK"""
    health_status = {
        "service": "GenAI Job Assistant API",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "checks": {}
    }
    
    # MongoDB check
    try:
        await db.command("ping")
        health_status["checks"]["mongodb"] = {
            "status": "healthy", 
            "message": "Connected successfully"
        }
    except Exception as e:
        health_status["checks"]["mongodb"] = {
            "status": "unhealthy", 
            "error": str(e)
        }
        health_status["status"] = "degraded"
    
    health_status["checks"]["api"] = {
        "status": "healthy", 
        "message": "API is responsive"
    }
    
    health_status["checks"]["chatbot"] = {
        "status": "healthy", 
        "message": "Chatbot service available"
    }
    
    return health_status

@app.get("/health/db", tags=["Health"])
async def mongodb_health_check():
    """MongoDB specific health check - matches constants.js HEALTH.DB"""
    try:
        await db.command("ping")
        return {
            "status": "healthy",
            "message": "✅ MongoDB is connected",
            "service": "mongodb",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy", 
                "message": "❌ MongoDB connection failed", 
                "error": str(e),
                "service": "mongodb",
                "timestamp": datetime.now().isoformat()
            }
        )

# ============== REGISTER ROUTERS ==============
# Register routers WITHOUT additional prefixes since they already have internal prefixes

# Cover Letter API - router already has internal prefix, no additional prefix needed
app.include_router(
    cover_letter_api.router, 
    tags=["Cover Letter"]
)

# Resume Tips API - router already has internal prefix, no additional prefix needed
app.include_router(
    resume_tips_api.router,
    tags=["Resume Tips"]
)

# Resume Match API - router already has internal prefix, no additional prefix needed
app.include_router(
    resume_match_api_router,
    tags=["Resume Matching"]
)

# ✅ CHAT API - matches your constants.js CHAT endpoints
# Register chatbot router WITHOUT prefix so routes are directly accessible
app.include_router(
    chatbot_router,
    tags=["AI Chatbot"]
)

# ============== MIDDLEWARE FOR REQUEST LOGGING ==============

from fastapi import Request
import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for monitoring"""
    start_time = time.time()
    
    # Log request
    logger.info(f"🌐 {request.method} {request.url.path} - Client: {request.client.host}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"✅ {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    # Add processing time to response headers
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# ============== UTILITY ENDPOINTS ==============

@app.get("/api/info", tags=["System"])
async def api_info():
    """Get API information and available endpoints"""
    return {
        "api_name": "GenAI Job Assistant API",
        "version": "1.0.0",
        "description": "Backend for AI-powered job assistance tools",
        "status": "running",
        "endpoints": {
            "cover_letter": {
                "generate": "POST /genai/cover-letter/",
                "update": "POST /genai/cover-letter/update/",
                "description": "Generate and update cover letters"
            },
            "resume_tips": {
                "get": "POST /genai/resume-tips/",
                "description": "Get resume improvement tips"
            },
            "resume_matching": {
                "analyze": "POST /genai/jd-match/",
                "description": "Match resume with job descriptions"
            },
            "chat": {
                "send": "POST /chat",
                "clear": "POST /clear", 
                "description": "AI-powered career chatbot"
            },
            "health": {
                "main": "GET /health",
                "database": "GET /health/db",
                "root": "GET /",
                "description": "System health monitoring"
            },
            "system": {
                "info": "GET /api/info",
                "description": "API documentation and info"
            }
        },
        "documentation": "/docs",
        "openapi_spec": "/openapi.json",
        "note": "Individual routers define their own internal prefixes",
        "timestamp": datetime.now().isoformat()
    }

# ============== ERROR HANDLING ==============

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler"""
    return JSONResponse(
        status_code=404,
        content={
            "success": False,
            "error": f"Endpoint not found: {request.url.path}",
            "message": "The requested endpoint does not exist",
            "available_endpoints": {
                "chat": "POST /chat",
                "clear_chat": "POST /clear", 
                "health": "GET /health",
                "health_db": "GET /health/db",
                "cover_letter": "POST /genai/cover-letter/",
                "cover_letter_update": "POST /genai/cover-letter/update/",
                "resume_tips": "POST /genai/resume-tips/",
                "job_match": "POST /genai/jd-match/",
                "api_info": "GET /api/info",
                "docs": "GET /docs"
            },
            "note": "Individual routers have their own internal prefixes",
            "timestamp": datetime.now().isoformat()
        }
    )