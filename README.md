# 🚀 Job Portal with AI Chatbot

A modern **full-stack job portal** that connects job seekers and recruiters, with an **integrated AI-powered chatbot** to enhance user experience. Built with **MERN Stack** and **FastAPI + LangChain backend** using **Gemini API** for intelligent job-related assistance.

## ✨ Features

### 👤 For Job Seekers
* **AI Chatbot Assistance**
   * 📌 **Resume Analysis** – Get an ATS-friendly score and suggestions for improvement
   * 📌 **Job Recommendations** – AI suggests relevant jobs based on your skills and experience
   * 📌 **Career Guidance** – Learn career roadmaps and skill paths for your goals
   * 📌 **FAQs** – Get instant answers about the platform
* **Job Applications**
   * Apply to jobs directly from the portal
   * Save and track your job applications
* **Profile Management**
   * Upload and manage resumes
   * Add skills, bio, and contact info

### 🏢 For Recruiters
* Post and manage job listings
* View and track applications

### 🤖 AI Tools on Job Pages
* 📝 **Cover Letter Generator** – Creates personalized cover letters tailored to the specific job
* 💡 **Resume Tips** – Analyzes your profile/resume and suggests improvements
* 🎯 **Job Match Analysis** – Shows how well you match the role and what skills to improve

## 🛠️ Tech Stack

### Frontend
* **React.js** – Component-based UI
* **Tailwind CSS** – Modern utility-first styling
* **Redux Toolkit** – State management
* **Lucide Icons** – Icon library

### Backend
* **Node.js & Express.js** – Main backend server
* **FastAPI** – AI services backend (Python)
* **LangChain** – AI orchestration and prompt engineering
* **ChromaDB** – Vector database for semantic search
* **Gemini API** – Google AI model for natural language processing
* **MongoDB** – Database for storing user and job data
* **Cloudinary** – File storage for images

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MongoDB
- Git

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/JobPortal.git
cd JobPortal
cd MERN-JobPortal-main
```

### 2️⃣ Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (.env)**
```env
MONGO_URI=your_mongodb_connection_string
PORT=8080
SECRET_KEY=your_jwt_secret_key
CLOUD_NAME=your_cloudinary_cloud_name
API_KEY=your_cloudinary_api_key
API_SECRET=your_cloudinary_api_secret
```

**Genai-backend (.env)**
```env
GEMINI_API_KEY=your_gemini_api_key
MONGO_URI=your_mongodb_connection_string
CHROMA_PERSIST_DIR=./chroma_store
```



### 3️⃣ Install Dependencies

**Backend (Node.js)**
```bash
cd backend
npm install
```

**Genai-backend (Python)**
```bash
cd Genai-backend
pip install -r requirements.txt
```

**Frontend**
```bash
cd frontend
npm install
```

### 4️⃣ Run the Application

**Start Backend Server**
```bash
cd backend
npm start
# Runs on http://localhost:8080
```

**Start Genai-backend**
```bash
cd Genai-backend
uvicorn main:app --reload --port 8000
# Runs on http://localhost:8000
```

**Start Frontend**
```bash
cd frontend
npm start
# Runs on http://localhost:3000
```

## 🔑 Key Features

### AI-Powered Resume Analysis
Get detailed feedback on your resume with ATS compatibility scores and improvement suggestions.

### Smart Job Matching
Our AI analyzes your profile and recommends jobs that match your skills and career goals.

### Interactive Career Guidance
Receive personalized career roadmaps and skill development paths from our AI assistant.

### Intelligent Cover Letter Generation
Generate tailored cover letters for specific job applications using AI.


## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License.

## 📞 Contact
For questions or support, please open an issue on GitHub.

---
⭐ **Don't forget to star this repo if you found it helpful!**