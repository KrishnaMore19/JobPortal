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
import gc
import asyncio

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

# ✅ UPDATED CORS CONFIGURATION - Added Vercel frontend URL
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://localhost:3000",
        "http://localhost:5174",
        "http://localhost:5175",
        "https://job-portal-git-main-krishnamore19s-projects.vercel.app/"  # ✅ Added your Vercel frontend URL
    ],
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

@app.on_event("startup")
async def startup_message():
    """Log startup information"""
    logger.info("🚀 GenAI Job Assistant API is starting up...")
    logger.info(f"📝 CORS origins configured for frontend access")
    logger.info(f"🔧 Service optimized for stability and performance")

# ============== HEALTH CHECK ENDPOINTS ==============
# These match your constants.js HEALTH endpoints

@app.get("/", tags=["Health"])
def read_root():
    return {
        "message": "🚀 GenAI Backend is running!",
        "service": "GenAI Job Assistant API",
        "version": "1.0.0",
        "status": "healthy",
        "cors_configured": True,
        "frontend_supported": "https://job-portal-git-main-krishnamore19s-projects.vercel.app/"
    }

@app.get("/health", tags=["Health"])
async def comprehensive_health_check():
    """Main health check endpoint - matches constants.js HEALTH.CHECK"""
    health_status = {
        "service": "GenAI Job Assistant API",
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "cors_enabled": True,
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

# ✅ NEW: Keep-alive endpoint to prevent service from sleeping
@app.get("/keep-alive", tags=["System"])
async def keep_alive():
    """Keep service alive - called periodically to prevent Render free tier sleep"""
    return {
        "status": "alive",
        "timestamp": datetime.now().isoformat(),
        "message": "Service is active and healthy",
        "uptime": "running"
    }

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

# ============== ENHANCED MIDDLEWARE ==============

from fastapi import Request
import time

@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests for monitoring"""
    start_time = time.time()
    
    # Log request with more details
    logger.info(f"🌐 {request.method} {request.url.path} - Client: {request.client.host} - Origin: {request.headers.get('origin', 'N/A')}")
    
    # Process request
    response = await call_next(request)
    
    # Log response
    process_time = time.time() - start_time
    logger.info(f"✅ {request.method} {request.url.path} - Status: {response.status_code} - Time: {process_time:.3f}s")
    
    # Add processing time to response headers
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

@app.middleware("http")
async def memory_cleanup_middleware(request: Request, call_next):
    """Clean up memory after heavy AI operations to prevent crashes"""
    response = await call_next(request)
    
    # Force garbage collection after AI-heavy requests
    ai_heavy_paths = ["/chat", "/genai/cover-letter/", "/genai/jd-match/", "/genai/resume-tips/"]
    if any(path in request.url.path for path in ai_heavy_paths):
        gc.collect()  # Force garbage collection to free memory
        logger.debug(f"🧹 Memory cleanup performed for {request.url.path}")
    
    return response

@app.middleware("http")
async def cors_debug_middleware(request: Request, call_next):
    """Debug CORS requests"""
    if request.method == "OPTIONS":
        origin = request.headers.get("origin")
        logger.info(f"🔍 CORS preflight request from origin: {origin}")
    
    response = await call_next(request)
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
        "cors_enabled": True,
        "supported_origins": [
            "http://localhost:5173", 
            "http://localhost:3000",
            "http://localhost:5174",
            "http://localhost:5175",
            "https://job-portal-git-main-krishnamore19s-projects.vercel.app/"
        ],
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
                "keep_alive": "GET /keep-alive",
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

# ✅ NEW: System status endpoint
@app.get("/status", tags=["System"])
async def system_status():
    """Get detailed system status"""
    return {
        "service": "GenAI Job Assistant API",
        "status": "operational",
        "version": "1.0.0",
        "environment": "production",
        "features": {
            "chat": "enabled",
            "cover_letter_generation": "enabled", 
            "resume_tips": "enabled",
            "job_matching": "enabled",
            "cors": "enabled"
        },
        "performance": {
            "memory_management": "optimized",
            "request_logging": "enabled",
            "error_handling": "comprehensive"
        },
        "timestamp": datetime.now().isoformat()
    }

# ============== ENHANCED ERROR HANDLING ==============

@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Custom 404 handler with helpful information"""
    logger.warning(f"🔍 404 Error: {request.url.path} not found - Origin: {request.headers.get('origin', 'N/A')}")
    
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
                "keep_alive": "GET /keep-alive",
                "cover_letter": "POST /genai/cover-letter/",
                "cover_letter_update": "POST /genai/cover-letter/update/",
                "resume_tips": "POST /genai/resume-tips/",
                "job_match": "POST /genai/jd-match/",
                "api_info": "GET /api/info",
                "status": "GET /status",
                "docs": "GET /docs"
            },
            "note": "Individual routers have their own internal prefixes",
            "cors_info": "CORS is enabled for your frontend",
            "timestamp": datetime.now().isoformat()
        }
    )

# ✅ NEW: Timeout handling for long-running requests
@app.exception_handler(asyncio.TimeoutError)
async def timeout_handler(request: Request, exc):
    """Handle request timeouts gracefully"""
    logger.error(f"⏱️ Timeout error for {request.url.path}")
    return JSONResponse(
        status_code=408,
        content={
            "success": False,
            "error": "Request timeout",
            "message": "The request took too long to process. This might happen with complex AI operations.",
            "suggestion": "Please try again or reduce the complexity of your request",
            "timestamp": datetime.now().isoformat()
        }
    )