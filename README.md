# Smart Study Assistant

An AI-powered full-stack web app for students to upload notes, chat with AI, generate quizzes, and analyze previous year exam papers.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite + Tailwind CSS |
| Backend | Python + Flask |
| AI | Google Gemini / OpenAI |
| Vector DB | ChromaDB |
| Database | SQLite (via SQLAlchemy) |
| PDF | PyPDF2 |

---

## Quick Start

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env and add your GEMINI_API_KEY or OPENAI_API_KEY

# Run the server
python run.py
```

Backend runs at: http://localhost:5000

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:3000

---

## Environment Variables (backend/.env)

```
GEMINI_API_KEY=your_key_here       # Get from https://aistudio.google.com
OPENAI_API_KEY=your_key_here       # Optional, if using OpenAI
AI_PROVIDER=gemini                 # gemini or openai
SECRET_KEY=any_random_string
UPLOAD_FOLDER=uploads
DATABASE_URL=sqlite:///study_assistant.db
```

---

## API Endpoints

### Notes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notes/ | List all notes |
| POST | /api/notes/upload | Upload PDF/TXT note |
| GET | /api/notes/:id | Get note details |
| POST | /api/notes/:id/summarize | Generate AI summary |
| GET | /api/notes/:id/download | Download file |
| DELETE | /api/notes/:id | Delete note |

### Papers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/papers/ | List papers (filter: subject, year, exam_type) |
| POST | /api/papers/upload | Upload question paper |
| GET | /api/papers/subjects | Get distinct subjects & years |
| POST | /api/papers/analyze | Analyze trends for a subject |
| GET | /api/papers/search?q= | Search inside papers |
| GET | /api/papers/:id/download | Download paper |
| DELETE | /api/papers/:id | Delete paper |

### Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/chat/ask | Ask a question |
| GET | /api/chat/history/:session_id | Get chat history |
| GET | /api/chat/sessions | List all sessions |
| DELETE | /api/chat/session/:id | Delete session |

### Quiz
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/quiz/generate | Generate MCQ quiz |
| POST | /api/quiz/:id/submit | Submit answers & get score |
| GET | /api/quiz/ | List past quizzes |

---

## Features

- **Drag & Drop Upload** — Upload PDFs for notes and question papers
- **AI Chat** — Context-aware Q&A using ChromaDB vector search
- **Summaries** — Auto-generate structured summaries
- **MCQ Quizzes** — Generate and score practice quizzes
- **Past Papers** — Filter by subject, year, exam type
- **Trend Analysis** — AI identifies frequently asked topics and predicts questions
- **Dark/Light Mode** — Persisted preference
- **Chat History** — Sessions saved and resumable

---

## Deployment

### Render (Backend)
1. Create a new Web Service on [render.com](https://render.com)
2. Set Build Command: `pip install -r requirements.txt`
3. Set Start Command: `gunicorn run:app`
4. Add environment variables from `.env`

### Vercel (Frontend)
1. Push frontend to GitHub
2. Import on [vercel.com](https://vercel.com)
3. Set `VITE_API_URL` env var to your Render backend URL
4. Update `vite.config.js` proxy target accordingly

---

## Project Structure

```
smart-study-assistant/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # Flask app factory
│   │   ├── models.py            # SQLAlchemy models
│   │   ├── routes/
│   │   │   ├── notes.py         # Notes endpoints
│   │   │   ├── papers.py        # Papers endpoints
│   │   │   ├── chat.py          # Chat endpoints
│   │   │   └── quiz.py          # Quiz endpoints
│   │   └── services/
│   │       ├── ai_service.py    # Gemini/OpenAI integration
│   │       ├── pdf_service.py   # PDF text extraction
│   │       └── vector_service.py # ChromaDB vector store
│   ├── requirements.txt
│   ├── run.py
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── api/index.js         # Axios API calls
    │   ├── components/          # Layout, Spinner, FileDropzone
    │   ├── pages/               # Home, Upload, Chat, Dashboard, Papers
    │   ├── App.jsx
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```
