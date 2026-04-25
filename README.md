# ⚡ FlashMind — AI-Powered Flashcard Engine

> Turn any PDF into a smart, study-ready flashcard deck in under 30 seconds.

**Live Demo:** [flashcard-app-six-iota.vercel.app](https://flashcard-app-six-iota.vercel.app)  
**Backend API:** [flashmind-backend-be1g.onrender.com/docs](https://flashmind-backend-be1g.onrender.com/docs)

---

## 🎯 What is FlashMind?

FlashMind is an AI-powered flashcard application built for the Cuemath AI Builder Challenge. It solves the #1 problem in student learning: **creating quality study material is too time-consuming, and most study methods don't work.**

Drop in any PDF — a textbook chapter, class notes, research paper — and FlashMind generates a comprehensive, study-ready deck using Groq Llama 3.3 70B. The app then uses the **FSRS algorithm** (the 2026 industry standard for spaced repetition) to schedule reviews at the exact moment before you forget.

---

## ✨ Features

### 🧠 AI Card Generation
- Uploads any PDF (up to 20MB)
- Extracts and chunks text using PyMuPDF
- Generates 5 card types: Concept, Definition, Example, Edge Case, Why
- Each card includes a front, back, and hint
- Auto-detects subject, difficulty, and recommends study mode

### 📚 5 Study Modes
| Mode | Best For |
|------|----------|
| **Mixed** | General studying — balanced card types |
| **Quick Quiz** | Facts, dates, vocab — one-line answers |
| **Deep Understanding** | WHY/HOW questions with analogies |
| **Exam Crammer** | Tricky questions, edge cases, gotchas |
| **Teach Me** | Beginners — simple language, everyday analogies |

### 🔬 FSRS Spaced Repetition
- Implements FSRS-4.5 (Free Spaced Repetition Scheduler)
- Models memory as **stability** + **difficulty** — two separate dimensions
- Predicts exact forgetting probability per card
- Adapts to your personal memory patterns
- Significantly more accurate than the older SM-2 algorithm

### 🎮 Engagement & Gamification
- XP system — Easy: +10 XP, Hard: +5 XP, Again: +2 XP
- Level progression with XP bar
- Daily study streaks
- Daily goal tracker with progress ring
- Confetti on session completion
- Sound effects — flip whoosh, easy chime, hard dip, again buzz
- Floating XP animation on every rating

### 📊 Progress Tracking
- Mastery percentage per deck
- 5-bucket breakdown: New → Learning → Reviewing → Struggling → Mastered
- Segmented mastery bar with legend
- AI-powered weak area analysis after each session

### 🛠️ Study Tools
- 3D card flip animation
- Keyboard shortcuts: Space/Enter to flip, 1/2/3 to rate
- Hint system — one-line nudge without giving away the answer
- AI explain on demand — Groq generates a simple explanation for hard cards
- Card editor — fix any AI mistake inline
- Add custom cards during review session
- Retry hard cards (Again-rated) immediately after session
- Shuffle mode + session length selector (Quick 10 / Standard 20 / Full deck)
- Delete decks with confirmation overlay
- Browser notifications for due cards

---

## 🏗️ Architecture
```
┌─────────────────────────────────────────────────────┐
│              Frontend (React + Vite)                 │
│         Deployed on Vercel                           │
│                                                     │
│  Landing → Dashboard → Upload → Review → Progress   │
└──────────────────────┬──────────────────────────────┘
│ REST API (axios)
┌──────────────────────▼──────────────────────────────┐
│              Backend (FastAPI + Python)              │
│         Deployed on Render                           │
│                                                     │
│  PDF Parser → Card Generator → FSRS Scheduler       │
│  Rate Limiter → 13 REST Endpoints                   │
└──────────────────────┬──────────────────────────────┘
│ SQLAlchemy ORM
┌──────────────────────▼──────────────────────────────┐
│              Database (Supabase PostgreSQL)          │
│                                                     │
│  decks table → cards table → reviews table          │
└─────────────────────────────────────────────────────┘
```
---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router |
| Backend | FastAPI, Python 3.14 |
| Database | Supabase (PostgreSQL) |
| AI / LLM | Groq Llama 3.3 70B |
| PDF Parsing | PyMuPDF (fitz) |
| ORM | SQLAlchemy |
| Spaced Repetition | FSRS-4.5 (custom implementation) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 💡 Key Technical Decisions

### FSRS over SM-2
Most flashcard apps use SM-2 (Anki's algorithm from 1987). FlashMind implements **FSRS-4.5** — the 2026 industry standard. FSRS models memory with two dimensions (stability + difficulty) instead of a single ease factor, making it significantly more accurate at predicting when you'll forget a card.

### 5 Study Modes with Different Prompts
Different learning goals need different card styles. A student cramming for an exam needs tricky edge cases; a beginner needs simple analogies. Each mode uses a completely different system prompt — not just a label.

### PDF Chunking
Large PDFs are split into 6,000-character chunks at paragraph boundaries before sending to Groq. This prevents token limit errors and ensures every section of the PDF gets cards generated for it. Cards are deduplicated by front text after merging.

### Auto-Subject Detection
On upload, a separate Groq call analyzes the first 3,000 characters of the PDF to detect subject, difficulty level, and recommended study mode. This fires in parallel with the UI rendering, making it feel instant.

### Rate Limiter
A simple in-memory rate limiter (25 calls/minute) prevents hitting Groq's 30 req/min free tier limit. Includes exponential backoff retry logic (up to 3 attempts) for transient errors.

### Skeleton Loading + Session Cache
Dashboard decks are cached in sessionStorage and shown instantly on return visits. Fresh data is fetched in the background. Skeleton loading cards show on true first load — making the app feel fast even on a cold Render start.

---

## 📁 Project Structure

```

flashcard-app/
├── backend/
│   ├── main.py           # FastAPI app + 13 REST endpoints
│   ├── models.py         # SQLAlchemy models (Deck, Card, Review)
│   ├── database.py       # DB connection + session
│   ├── fsrs.py           # FSRS-4.5 algorithm implementation
│   ├── card_generator.py # Groq prompts + 5 study modes + chunking
│   ├── pdf_parser.py     # PyMuPDF text extraction + chunking
│   ├── schemas.py        # Pydantic request/response models
│   ├── Procfile          # Render start command
│   └── requirements.txt
│
└── frontend/
├── src/
│   ├── pages/
│   │   ├── Landing.jsx    # Marketing landing page
│   │   ├── Dashboard.jsx  # Deck grid + stats + streak
│   │   ├── Upload.jsx     # PDF upload + mode selector
│   │   ├── Review.jsx     # Study session + FSRS rating
│   │   └── Progress.jsx   # Mastery breakdown
│   ├── components/
│   │   ├── FlashCard.jsx  # 3D flip + sounds + edit + AI explain
│   │   ├── DeckCard.jsx   # Deck thumbnail + delete
│   │   └── MasteryBar.jsx # Segmented progress bar
│   ├── api.js             # All API calls centralized
│   └── notifications.js   # Browser push notifications
└── vercel.json
```
---

## 🚀 Running Locally

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt

# create .env file
DATABASE_URL=your_supabase_postgres_url
GROQ_API_KEY=your_groq_key

uvicorn main:app --reload
# API docs at http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install

# create .env file
VITE_API_URL=http://localhost:8000

npm run dev
# App at http://localhost:5173
```

---

## 🔮 What I'd Add With More Time

1. **User authentication** — Supabase Auth so each user has their own decks
2. **Export to PDF** — printable one-card-per-page study sheets
3. **Collaborative decks** — share a deck link, others can clone it
4. **Mobile app** — React Native with the same FastAPI backend
5. **FSRS parameter optimization** — fine-tune W weights based on personal review history
6. **Offline mode** — service worker + IndexedDB for studying without internet
7. **Image cards** — support PDFs with diagrams, extract and include images in cards

---

## 🧪 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| Groq hitting token limits on large PDFs | Chunked text at paragraph boundaries (6,000 chars), generated cards per chunk, deduplicated by front text |
| CORS blocking frontend → backend | Explicit origin whitelist in FastAPI middleware |
| Supabase IPv6 incompatible with Render free tier | Switched to Supabase connection pooler URL (Session mode) |
| SM-2 mastery felt slow for demo | Implemented FSRS which has more nuanced stability tracking |
| Spacebar triggering card flip while typing | `disableShortcuts` prop passed to FlashCard when modal is open |
| Dashboard slow to load | DB indexes on `deck_id`, `due_date` + sessionStorage cache + skeleton loading |

---

