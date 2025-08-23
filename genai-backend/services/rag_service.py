# services/rag_service.py

import os
import asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
import numpy as np
from sentence_transformers import SentenceTransformer
import faiss
import pickle
import json
from datetime import datetime

from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain.schema import HumanMessage
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS  # ✅ Fixed deprecated import
from langchain.docstore.document import Document

# Import your existing services
from services.data_service import get_all_jobs, get_resume_binary_by_user_id, get_all_users
from utils.pdf_parser import extract_text_from_pdf

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

class RAGChatbot:
    def __init__(self):
        # Initialize Gemini models
        self.llm = ChatGoogleGenerativeAI(
            model="gemini-1.5-flash",
            google_api_key=GEMINI_API_KEY,
            temperature=0.3  # Lower temperature for more consistent responses
        )
        
        # Initialize embeddings
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GEMINI_API_KEY
        )
        
        # Vector store
        self.vector_store = None
        self.knowledge_base_path = "knowledge_base"
        
        # Text splitter for chunking documents
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n\n", "\n", ". ", "! ", "? ", " "]
        )
        
        # Initialize knowledge base
        asyncio.create_task(self.initialize_knowledge_base())
    
    async def initialize_knowledge_base(self):
        """Initialize or load the vector knowledge base"""
        try:
            # Try to load existing vector store
            if os.path.exists(f"{self.knowledge_base_path}.faiss"):
                self.vector_store = FAISS.load_local(
                    self.knowledge_base_path, 
                    self.embeddings,
                    allow_dangerous_deserialization=True  # ✅ Added for newer versions
                )
                print("✅ Loaded existing knowledge base")
            else:
                # Create new knowledge base
                await self.build_knowledge_base()
        except Exception as e:
            print(f"⚠️ Error initializing knowledge base: {e}")
            await self.build_knowledge_base()
    
    async def build_knowledge_base(self):
        """Build knowledge base from various sources"""
        print("🔄 Building knowledge base...")
        
        documents = []
        
        # 1. Add job listings to knowledge base
        jobs = await get_all_jobs()
        for job in jobs:
            job_text = f"""
            Job Title: {job.get('title', 'N/A')}
            Company: {job.get('company', 'N/A')}
            Location: {job.get('location', 'N/A')}
            Description: {job.get('description', 'N/A')}
            Requirements: {job.get('requirements', 'N/A')}
            Keywords: {', '.join(job.get('keywords', []))}
            Salary: {job.get('salary', 'N/A')}
            """
            
            doc = Document(
                page_content=job_text,
                metadata={
                    "type": "job_listing",
                    "job_id": str(job.get("_id", "")),
                    "title": job.get('title', ''),
                    "company": job.get('company', '')
                }
            )
            documents.append(doc)
        
        # 2. Add career guidance knowledge
        career_knowledge = self.get_career_knowledge()
        for topic, content in career_knowledge.items():
            doc = Document(
                page_content=content,
                metadata={
                    "type": "career_guidance",
                    "topic": topic
                }
            )
            documents.append(doc)
        
        # 3. Add FAQ knowledge
        faq_knowledge = self.get_faq_knowledge()
        for question, answer in faq_knowledge.items():
            doc = Document(
                page_content=f"Question: {question}\nAnswer: {answer}",
                metadata={
                    "type": "faq",
                    "question": question
                }
            )
            documents.append(doc)
        
        # 4. Add resume tips and ATS knowledge
        ats_knowledge = self.get_ats_knowledge()
        doc = Document(
            page_content=ats_knowledge,
            metadata={"type": "ats_guidance"}
        )
        documents.append(doc)
        
        # Split documents into chunks
        all_chunks = []
        for doc in documents:
            chunks = self.text_splitter.split_documents([doc])
            all_chunks.extend(chunks)
        
        # Create vector store
        if all_chunks:
            self.vector_store = FAISS.from_documents(all_chunks, self.embeddings)
            # Save vector store
            self.vector_store.save_local(self.knowledge_base_path)
            print(f"✅ Built knowledge base with {len(all_chunks)} chunks")
        else:
            print("⚠️ No documents to add to knowledge base")
    
    def get_career_knowledge(self) -> Dict[str, str]:
        """Predefined career guidance knowledge"""
        return {
            "software_engineering": """
            Software Engineering Career Path:
            
            Beginner Level (0-2 years):
            - Learn programming fundamentals (Python, Java, JavaScript)
            - Master data structures and algorithms
            - Build personal projects and contribute to open source
            - Learn version control (Git)
            - Understand basic software development lifecycle
            
            Intermediate Level (2-5 years):
            - Specialize in specific technologies (React, Node.js, Django, etc.)
            - Learn system design principles
            - Gain experience with databases (SQL/NoSQL)
            - Understand DevOps basics (Docker, CI/CD)
            - Work on team projects and learn collaboration tools
            
            Advanced Level (5+ years):
            - Master system architecture and design patterns
            - Learn cloud technologies (AWS, Azure, GCP)
            - Develop leadership and mentoring skills
            - Contribute to technical decision making
            - Specialize in areas like AI/ML, Security, or Mobile
            
            Key Certifications:
            - AWS Certified Developer
            - Google Cloud Professional Developer
            - Microsoft Azure Developer
            - Kubernetes Certified Application Developer
            """,
            
            "data_science": """
            Data Science Career Path:
            
            Beginner Level:
            - Master Python and R programming
            - Learn statistics and probability
            - Understand data manipulation (Pandas, NumPy)
            - Basic machine learning concepts
            - Data visualization (Matplotlib, Seaborn, Tableau)
            
            Intermediate Level:
            - Advanced machine learning algorithms
            - Deep learning frameworks (TensorFlow, PyTorch)
            - SQL and database management
            - Big data technologies (Spark, Hadoop)
            - A/B testing and experimental design
            
            Advanced Level:
            - MLOps and model deployment
            - Advanced statistics and research methods
            - Domain expertise in specific industries
            - Leadership in data strategy
            - Contributing to data science community
            
            Key Certifications:
            - Google Data Analytics Certificate
            - IBM Data Science Professional Certificate
            - Microsoft Certified Azure Data Scientist
            - Coursera Machine Learning Specialization
            """,
            
            "digital_marketing": """
            Digital Marketing Career Path:
            
            Beginner Level:
            - Learn marketing fundamentals
            - Social media marketing basics
            - Content creation and copywriting
            - Basic SEO principles
            - Email marketing tools
            
            Intermediate Level:
            - Advanced SEO and SEM
            - Pay-per-click advertising (Google Ads, Facebook Ads)
            - Marketing automation
            - Analytics and data interpretation
            - Conversion rate optimization
            
            Advanced Level:
            - Marketing strategy and planning
            - Advanced analytics and attribution modeling
            - Marketing technology stack management
            - Team leadership and budget management
            - Cross-channel marketing integration
            
            Key Certifications:
            - Google Ads Certification
            - Google Analytics Certification
            - HubSpot Content Marketing Certification
            - Facebook Blueprint Certification
            """,
            
            "project_management": """
            Project Management Career Path:
            
            Beginner Level:
            - Project management fundamentals
            - Agile and Scrum methodologies
            - Communication and leadership skills
            - Basic project planning tools
            - Risk management basics
            
            Intermediate Level:
            - Advanced project management methodologies
            - Stakeholder management
            - Budget and resource management
            - Quality assurance processes
            - Project management software expertise
            
            Advanced Level:
            - Portfolio and program management
            - Organizational change management
            - Strategic planning and execution
            - Team building and leadership
            - Business analysis skills
            
            Key Certifications:
            - Project Management Professional (PMP)
            - Certified ScrumMaster (CSM)
            - PRINCE2 Certification
            - Agile Certified Practitioner (PMI-ACP)
            """
        }
    
    def get_faq_knowledge(self) -> Dict[str, str]:
        """Extended FAQ knowledge base"""
        return {
            "How do I apply for jobs?": "To apply for jobs, browse our job listings, click on positions that interest you, and submit your application through our platform. Make sure your resume is updated and tailored to the specific role.",
            
            "Where can I find internships?": "Internships are available in the 'Internships' section of our job portal. Filter by 'Internship' in the job type dropdown to see all available opportunities.",
            
            "How do I update my resume?": "You can upload a new resume by going to your profile settings or by using the chat interface. We also provide ATS scoring to help you optimize your resume.",
            
            "What is ATS and why is it important?": "ATS (Applicant Tracking System) is software used by employers to screen resumes. Our ATS scorer helps you optimize your resume format and keywords to pass through these systems successfully.",
            
            "How can I improve my interview skills?": "Practice common interview questions, research the company thoroughly, prepare specific examples using the STAR method (Situation, Task, Action, Result), and conduct mock interviews with friends or mentors.",
            
            "What skills are in demand for my field?": "Skills demand varies by field. Use our career guidance feature to get personalized recommendations based on your background and target roles.",
            
            "How do I negotiate salary?": "Research market rates for your position and location, prepare justification for your desired salary based on your skills and experience, and be willing to negotiate the entire compensation package, not just base salary.",
            
            "Should I include a cover letter?": "Yes, include a customized cover letter that highlights your relevant experience and explains why you're interested in the specific role and company.",
            
            "How long should my resume be?": "Generally, 1-2 pages for most professionals. Entry-level candidates should aim for 1 page, while senior professionals with extensive experience may use 2 pages.",
            
            "What format should I use for my resume?": "Use a clean, professional format with standard fonts. PDF format is preferred to preserve formatting across different systems."
        }
    
    def get_ats_knowledge(self) -> str:
        """ATS optimization knowledge"""
        return """
        ATS (Applicant Tracking System) Optimization Guide:
        
        Essential Sections for ATS-Friendly Resumes:
        1. Contact Information (Name, Phone, Email, Location)
        2. Professional Summary or Objective
        3. Work Experience with measurable achievements
        4. Education and Certifications
        5. Skills section with relevant keywords
        
        ATS Best Practices:
        - Use standard section headings (Work Experience, Education, Skills)
        - Include relevant keywords from job descriptions
        - Use simple, clean formatting without tables or graphics
        - Save as PDF to preserve formatting
        - Use standard fonts (Arial, Times New Roman, Calibri)
        - Avoid headers and footers
        - Use bullet points for achievements
        - Include specific metrics and numbers
        - Tailor resume for each application
        
        Common ATS Mistakes to Avoid:
        - Using images or graphics
        - Complex formatting or templates
        - Spelling and grammar errors
        - Missing contact information
        - Using abbreviations without spelling them out
        - Including irrelevant information
        - Using fancy fonts or colors
        - Submitting in wrong file format
        
        Keyword Optimization:
        - Mirror language from job descriptions
        - Include both acronyms and full terms (AI and Artificial Intelligence)
        - Use industry-specific terminology
        - Include soft skills mentioned in job postings
        - Add relevant certifications and technical skills
        """
    
    async def get_rag_response(self, user_query: str, user_id: str = None) -> str:
        """Generate response using RAG approach"""
        try:
            if not self.vector_store:
                return "Knowledge base is not ready. Please try again in a moment."
            
            # Retrieve relevant context
            relevant_docs = self.vector_store.similarity_search(
                user_query, 
                k=5  # Get top 5 most relevant documents
            )
            
            # Prepare context from retrieved documents
            context = ""
            sources = []
            for doc in relevant_docs:
                context += doc.page_content + "\n\n"
                if doc.metadata.get("type"):
                    sources.append(doc.metadata.get("type"))
            
            # Get user's resume context if available
            user_context = ""
            if user_id:
                try:
                    resume_pdf = await get_resume_binary_by_user_id(user_id)
                    if resume_pdf:
                        resume_text = extract_text_from_pdf(resume_pdf)
                        user_context = f"\nUser's Resume Summary: {resume_text[:500]}..."
                except:
                    pass  # Continue without resume context if there's an error
            
            # Create enhanced prompt with context
            enhanced_prompt = f"""
You are a helpful career counselor and job search assistant. Use the following context to answer the user's question accurately and helpfully.

CONTEXT FROM KNOWLEDGE BASE:
{context}

USER CONTEXT:
{user_context}

USER QUESTION: {user_query}

INSTRUCTIONS:
- Provide a comprehensive, helpful response based on the context provided
- If the question is about jobs, reference specific job listings when relevant
- If it's about career guidance, provide structured advice with actionable steps
- If it's about resume improvement, give specific, practical tips
- Be conversational but professional
- If you don't have enough context to fully answer, say so and suggest alternatives
- Include relevant sources when possible (job IDs, career paths, etc.)

RESPONSE:
"""
            
            # Generate response using LLM
            response = self.llm.invoke([HumanMessage(content=enhanced_prompt)])
            
            return response.content
            
        except Exception as e:
            print(f"Error in RAG response: {e}")
            return f"I apologize, but I encountered an error processing your request. Please try rephrasing your question or contact support if the issue persists."
    
    async def add_user_resume_to_knowledge(self, user_id: str):
        """Add user's resume to knowledge base for personalized responses"""
        try:
            resume_pdf = await get_resume_binary_by_user_id(user_id)
            if resume_pdf:
                resume_text = extract_text_from_pdf(resume_pdf)
                
                # Create document from resume
                doc = Document(
                    page_content=resume_text,
                    metadata={
                        "type": "user_resume",
                        "user_id": user_id,
                        "timestamp": datetime.now().isoformat()
                    }
                )
                
                # Add to existing vector store
                if self.vector_store:
                    self.vector_store.add_documents([doc])
                    # Save updated vector store
                    self.vector_store.save_local(self.knowledge_base_path)
                    
        except Exception as e:
            print(f"Error adding user resume to knowledge base: {e}")
    
    async def update_knowledge_base(self):
        """Update knowledge base with latest data"""
        await self.build_knowledge_base()
        print("✅ Knowledge base updated successfully")

# Global RAG chatbot instance
rag_chatbot = RAGChatbot()

async def get_rag_response(user_query: str, user_id: str = None) -> str:
    """Main function to get RAG-enhanced responses"""
    return await rag_chatbot.get_rag_response(user_query, user_id)