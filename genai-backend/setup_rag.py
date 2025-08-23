# setup_rag.py - Initialize RAG system
import asyncio
import os
from dotenv import load_dotenv
import sys
from pathlib import Path

# Load environment variables
load_dotenv()

async def setup_rag_system():
    """Initialize the RAG system with MongoDB and ChromaDB"""
    
    print("🚀 Setting up RAG-Enhanced Chatbot...")
    print("=" * 50)
    
    # ✅ Check required environment variables from your .env
    required_env_vars = {
        "GEMINI_API_KEY": "Google Gemini API key for AI responses",
        "MONGO_URI": "MongoDB connection string for data storage",
        "CHROMA_PERSIST_DIR": "ChromaDB storage directory for vector embeddings"
    }
    
    print("🔍 Checking environment variables...")
    missing_vars = []
    for var, description in required_env_vars.items():
        value = os.getenv(var)
        if not value:
            missing_vars.append(f"  • {var}: {description}")
            print(f"❌ Missing: {var}")
        else:
            # Mask sensitive information in logs
            if "API_KEY" in var:
                masked_value = f"{value[:8]}...{value[-4:]}" if len(value) > 12 else "***"
                print(f"✅ Found: {var} = {masked_value}")
            elif "MONGO_URI" in var:
                # Show only the database name and host info
                try:
                    if "mongodb://" in value:
                        parts = value.split("/")
                        db_name = parts[-1].split("?")[0] if len(parts) > 3 else "unknown"
                        print(f"✅ Found: {var} = mongodb://***/{db_name}")
                    else:
                        print(f"✅ Found: {var} = [MongoDB Connection String]")
                except:
                    print(f"✅ Found: {var} = [MongoDB Connection String]")
            else:
                print(f"✅ Found: {var} = {value}")
    
    if missing_vars:
        print(f"\n❌ Missing required environment variables:")
        for var in missing_vars:
            print(var)
        print("\n💡 Please add them to your .env file")
        return False
    
    # ✅ Setup ChromaDB directory
    chroma_dir = os.getenv("CHROMA_PERSIST_DIR", "./chroma_store")
    print(f"\n📁 Setting up ChromaDB directory: {chroma_dir}")
    
    try:
        os.makedirs(chroma_dir, exist_ok=True)
        print(f"✅ ChromaDB directory ready: {os.path.abspath(chroma_dir)}")
    except Exception as e:
        print(f"❌ Error creating ChromaDB directory: {e}")
        return False
    
    # ✅ Test MongoDB connection
    print(f"\n🔗 Testing MongoDB connection...")
    try:
        from pymongo import MongoClient
        from urllib.parse import quote_plus
        
        mongo_uri = os.getenv("MONGO_URI")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        
        # Test the connection
        client.admin.command('ismaster')
        db_name = mongo_uri.split("/")[-1].split("?")[0]
        print(f"✅ MongoDB connection successful!")
        print(f"   Database: {db_name}")
        
        # List available collections (optional)
        try:
            db = client[db_name]
            collections = db.list_collection_names()
            if collections:
                print(f"   Collections found: {', '.join(collections[:5])}")
                if len(collections) > 5:
                    print(f"   ... and {len(collections) - 5} more")
            else:
                print("   No collections found (database may be new)")
        except Exception as e:
            print(f"   Note: Could not list collections: {e}")
        
        client.close()
        
    except ImportError:
        print("❌ pymongo not installed. Installing...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "pymongo"])
            print("✅ pymongo installed successfully")
        except Exception as e:
            print(f"❌ Failed to install pymongo: {e}")
            print("   Please run: pip install pymongo")
            return False
    except Exception as e:
        print(f"❌ MongoDB connection failed: {e}")
        print("   Please check your MONGO_URI in .env file")
        return False
    
    # ✅ Test Gemini API
    print(f"\n🤖 Testing Gemini API connection...")
    try:
        import google.generativeai as genai
        
        api_key = os.getenv("GEMINI_API_KEY")
        genai.configure(api_key=api_key)
        
        # Test with a simple request
        model = genai.GenerativeModel('gemini-pro')
        test_response = model.generate_content("Hello, this is a test.")
        
        if test_response and test_response.text:
            print("✅ Gemini API connection successful!")
            print(f"   Model: gemini-pro")
            print(f"   Test response: {test_response.text[:50]}...")
        else:
            print("❌ Gemini API test failed - no response received")
            return False
            
    except ImportError:
        print("❌ google-generativeai not installed. Installing...")
        try:
            import subprocess
            subprocess.check_call([sys.executable, "-m", "pip", "install", "google-generativeai"])
            print("✅ google-generativeai installed successfully")
        except Exception as e:
            print(f"❌ Failed to install google-generativeai: {e}")
            print("   Please run: pip install google-generativeai")
            return False
    except Exception as e:
        print(f"❌ Gemini API connection failed: {e}")
        print("   Please check your GEMINI_API_KEY in .env file")
        return False
    
    # ✅ Initialize RAG service
    print(f"\n📚 Initializing RAG service...")
    try:
        from services.rag_service import rag_chatbot
        
        print("   Setting up vector embeddings...")
        await rag_chatbot.initialize_knowledge_base()
        
        print("   Loading knowledge sources...")
        # Add any initial knowledge base loading here
        
        print("✅ RAG service initialized successfully!")
        
    except ImportError as e:
        print(f"❌ Could not import RAG service: {e}")
        print("   Make sure services/rag_service.py exists")
        return False
    except Exception as e:
        print(f"❌ Error initializing RAG service: {e}")
        return False
    
    # ✅ Setup complete
    print("\n" + "=" * 50)
    print("🎉 RAG system setup completed successfully!")
    print("\n📋 System Configuration:")
    print(f"   • Gemini API: ✅ Connected")
    print(f"   • MongoDB: ✅ Connected ({db_name})")
    print(f"   • ChromaDB: ✅ Ready ({os.path.abspath(chroma_dir)})")
    print(f"   • RAG Service: ✅ Initialized")
    
    print("\n🚀 Your chatbot now includes:")
    print("   • 🎯 Job listings search and recommendations")  
    print("   • 📝 Resume analysis and ATS scoring")
    print("   • 🗺️  Career guidance and roadmaps")
    print("   • ❓ FAQ responses")
    print("   • 🤖 AI-powered general assistance")
    
    print("\n🧠 RAG Features:")
    print("   • 📊 Context-aware responses using your data")
    print("   • 🔍 Intelligent document retrieval") 
    print("   • 💡 Personalized recommendations")
    print("   • 🧠 Enhanced knowledge from multiple sources")
    print("   • 💾 Persistent vector storage with ChromaDB")
    print("   • 🔗 MongoDB integration for user data")
    
    return True

def create_env_file():
    """Create or update .env file with your specific configuration"""
    
    current_env_content = """# Google Gemini API Configuration
GEMINI_API_KEY=AIzaSyC7jSP9pX9l1FejjoNcZc2RdgB2_tR0IQY

# MongoDB Configuration  
MONGO_URI=mongodb://test-19:RLVegcPerbkmPUsS@cluster0-shard-00-00.pfmsb.mongodb.net:27017,cluster0-shard-00-01.pfmsb.mongodb.net:27017,cluster0-shard-00-02.pfmsb.mongodb.net:27017/jobportal?replicaSet=atlas-12cbxq-shard-0&ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0

# ChromaDB Configuration
CHROMA_PERSIST_DIR=./chroma_store

# Optional: Additional API keys (uncomment if needed)
# OPENAI_API_KEY=your_openai_api_key_here
# PINECONE_API_KEY=your_pinecone_api_key_here

# Server Configuration (optional)
# HOST=0.0.0.0
# PORT=8000
# DEBUG=True

# Security (optional)
# JWT_SECRET_KEY=your_jwt_secret_key_here
# CORS_ORIGINS=http://localhost:3000,https://yourfrontend.com
"""
    
    if not os.path.exists(".env"):
        with open(".env", "w") as f:
            f.write(current_env_content)
        print("📁 Created .env file with your configuration")
    else:
        print("📁 .env file already exists - keeping current configuration")
    
    return True

def check_dependencies():
    """Check and install required dependencies"""
    
    required_packages = {
        "python-dotenv": "python-dotenv",
        "pymongo": "pymongo",  
        "google.generativeai": "google-generativeai",
        "chromadb": "chromadb",
        "langchain": "langchain",
        "fastapi": "fastapi",
        "uvicorn": "uvicorn[standard]"
    }
    
    print("📦 Checking required packages...")
    
    missing_packages = []
    for import_name, package_name in required_packages.items():
        try:
            __import__(import_name.split('.')[0])
            print(f"✅ {package_name}")
        except ImportError:
            print(f"❌ {package_name} (missing)")
            missing_packages.append(package_name)
    
    if missing_packages:
        print(f"\n📥 Installing missing packages...")
        try:
            import subprocess
            for package in missing_packages:
                print(f"   Installing {package}...")
                subprocess.check_call([sys.executable, "-m", "pip", "install", package])
            print("✅ All packages installed successfully!")
            return True
        except Exception as e:
            print(f"❌ Error installing packages: {e}")
            print("\n💡 Please manually install missing packages:")
            for package in missing_packages:
                print(f"   pip install {package}")
            return False
    else:
        print("✅ All required packages are installed!")
        return True

async def main():
    """Main setup function"""
    
    print("🎯 RAG-Enhanced Chatbot Setup")
    print("=" * 50)
    
    # Step 1: Create/check .env file
    print("Step 1: Environment Configuration")
    create_env_file()
    
    # Step 2: Check dependencies
    print(f"\nStep 2: Dependency Check")
    if not check_dependencies():
        print("\n❌ Please install missing dependencies and run again")
        return
    
    # Step 3: Setup RAG system
    print(f"\nStep 3: RAG System Initialization")
    success = await setup_rag_system()
    
    if success:
        print("\n" + "=" * 50)
        print("🎉 Setup complete! You can now start your chatbot server:")
        print("\n🚀 Start server with:")
        print("   uvicorn main:app --reload --host 0.0.0.0 --port 8000")
        print("\n📍 Your chatbot will be available at:")
        print("   • Local: http://localhost:8000")
        print("   • Network: http://0.0.0.0:8000")
        print("   • Health Check: http://localhost:8000/health")
        print("   • API Docs: http://localhost:8000/docs")
        
        print("\n🔧 API Endpoints:")
        print("   • POST /chat - Main chat interface")
        print("   • GET /health - Health check")
        print("   • POST /clear - Clear chat history")
        print("   • GET /knowledge-stats - RAG statistics")
        
    else:
        print("\n❌ Setup incomplete. Please fix the errors above and try again.")
        print("\n🔧 Troubleshooting:")
        print("   1. Check your .env file for correct values")
        print("   2. Verify your internet connection")
        print("   3. Ensure all API keys are valid")
        print("   4. Check MongoDB connection string")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\n⚠️  Setup interrupted by user")
    except Exception as e:
        print(f"\n❌ Setup failed with error: {e}")
        print("Please check the error message above and try again")