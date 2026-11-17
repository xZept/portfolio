# Allen James L. Laxamana — Full-Stack & AI Portfolio

Full-stack developer portfolio featuring a Neo-Brutalist Sky Blue interface, an **Ask My Resume** RAG assistant powered by Google Gemini and `pgvector`, and an event-driven n8n automation pipeline.

- **Live Site:** https://portfolio-seven-ashen-14.vercel.app
- **API Base:** https://portfolio-24oq.onrender.com

## Core Features

- **Portfolio Experience:** Responsive Neo-Brutalist Sky Blue UI with CSS Bento Grids, an interactive 3D skills globe, experience highlights (DACON Corporation, Orani Suhay Foundation), featured projects (SuhayCore, DACON Policy RAG Chatbot, FitQuest), education (BS Computer Science, BPSU), and verified IT/cybersecurity certifications.
- **Ask My Resume (RAG Assistant):** Server-Sent Events (SSE) streaming chat drawer backed by `gemini-3.5-flash-lite` and `gemini-embedding-2` on Supabase `pgvector`, featuring grounded section citations, curated starter prompts, off-topic guardrails, and a 15-message session rate limit.
- **Event-Driven n8n Automation:**
  - **GitHub-to-RAG Sync (`github-rag-sync`):** Re-chunks and embeds updates to `README.md` and `docs/**/*.md` on pushes to `main`.
  - **Contact Lead Triage (`contact-lead-triage`):** Classifies contact form inquiries (`recruiter`, `freelance project`, `general inquiry`) and dispatches Discord webhook alerts.
  - **Weekly Watchdog (`weekly-watchdog`):** Triggered via GitHub Actions cron to verify frontend/backend health and purge stale vector chunks.

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js 16.4.5, React 19.3, TypeScript 5.8, Tailwind CSS v4.1, shadcn/ui |
| **Backend & AI** | Python 3.13, FastAPI 0.162+, Pydantic 2.14, LangChain, Google Gemini API |
| **Database** | PostgreSQL 18 (Supabase) with `pgvector` |
| **Automation & Ops** | n8n 2.47 (Docker), GitHub Actions, Discord Webhooks, Vercel & Render |

## Repository Structure

```text
├── frontend/                  # Next.js 16 Neo-Brutalist portfolio & RAG chat drawer
├── backend/                   # FastAPI RAG streaming API & HMAC-verified automation callbacks
├── automation/n8n/workflows/  # Exported n8n workflow definitions (RAG sync, triage, watchdog)
├── docs/                      # Markdown knowledge base indexed into Supabase pgvector
└── .github/workflows/         # Weekly watchdog cron trigger
```

## Local Development

### Backend (FastAPI)

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env          # Configure GEMINI_API_KEY, SUPABASE_*, and webhook secrets
uvicorn app.main:app --reload --port 8000
```

Run backend tests:

```bash
pytest
```

### Frontend (Next.js)

```bash
cd frontend
npm install
cp .env.example .env.local    # Set NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```
