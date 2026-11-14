# Quickstart & Validation Guide: Neo-Brutalist Single-Page Portfolio Application

**Feature Branch**: `001-single-page-portfolio`  
**Spec**: `specs/001-single-page-portfolio/spec.md`  
**Data Model**: `specs/001-single-page-portfolio/data-model.md`  
**Contracts**: `specs/001-single-page-portfolio/contracts/api-contracts.md`, `specs/001-single-page-portfolio/contracts/ui-contracts.md`

---

## 1. Prerequisites

| Tool / Runtime | Required Version (Per Constitution Principle I) |
| :--- | :--- |
| **Node.js** | `>= 22.x LTS` (for Next.js 16.4.5 + React 19.3 + TypeScript 5.8) |
| **Python** | `3.13.x` (for FastAPI 0.162.5 + Pydantic 2.14.3 + LangChain v0.3) |
| **PostgreSQL / Supabase** | PostgreSQL 18 with `pgvector` and `pg_cron` (optional for local offline preview due to automatic local resume fallback) |
| **Docker (Optional)** | Required only if running the `automation/n8n/` (n8n 2.47) container locally |

---

## 2. Environment Setup

### 2.1 Frontend Setup (`frontend/`)
```powershell
cd frontend
npm install
Copy-Item .env.example .env.local -ErrorAction SilentlyContinue
```

Key environment variables in `frontend/.env.local`:
- `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `NEXT_PUBLIC_GITHUB_URL=https://github.com/xZept`

### 2.2 Backend Setup (`backend/`)
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env -ErrorAction SilentlyContinue
```

Key environment variables in `backend/.env`:
- `GEMINI_API_KEY=<your-google-gemini-api-key>` (optional for offline fallback tests)
- `SUPABASE_DB_URL=<postgresql-18-connection-string>` (optional for offline fallback tests)
- `CORS_ORIGINS=http://localhost:3000`

---

## 3. Running the Services

### 3.1 Start the FastAPI + Gemini RAG Backend
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --port 8000
```
- Verify health endpoint: `GET http://localhost:8000/api/v1/health` (see `contracts/api-contracts.md`).

### 3.2 Start the Next.js 16.4.5 Frontend
```powershell
cd frontend
npm run dev
```
- Open `http://localhost:3000` in Chrome/Edge.

---

## 4. Mandatory Quality Gate Verification (Constitution Principle IV)

Run these commands from the repository root before considering any implementation complete:

### Gate 1: Backend Pydantic 2.14.3 Validation & Contract Tests
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
pytest -v
```
- **Expected Outcome**: All 8+ contract and boundary tests defined in `contracts/api-contracts.md` pass with `0` failures.

### Gate 2: Frontend TypeScript 5.8 Strict Type Check
```powershell
cd frontend
npx tsc --noEmit
```
- **Expected Outcome**: Exits with code `0` and zero type errors.

### Gate 3: Frontend Next.js Linter Gate
```powershell
cd frontend
npm run lint
```
- **Expected Outcome**: Exits with code `0`, zero errors, and zero warnings.

### Gate 4: Frontend Component & Visual Token Compliance Tests
```powershell
cd frontend
npm test -- --run
```
- **Expected Outcome**: Verifies all 7 sections render factual content from `docs/resume.md`, all 22 3D Tech Globe nodes synchronize with the Categorized Pill Table, and zero prohibited CSS classes (`backdrop-blur-*`, blurry `shadow-sm/md/lg/xl/2xl`, or purple/pink gradients) exist.

---

## 5. End-to-End Validation Scenarios

1. **Scenario 1 — Sticky Header, Hero & Experience Cards (US1 / P1)**:
   - Load `http://localhost:3000`. Confirm sticky header shows `"Allen James Laxamana"`, section links, and `"Ask My Resume"`.
   - Click `"See my experience →"`. Confirm smooth scroll to `#experience`, active pill changes to `#38BDF8` on `"Experience"`, and all 3 cards (`SuhayCore` [`In UAT`], `DAN` [`Shipped`], `FitQuest` [`Android`]) render their images from `/images/projects/`, exact resume bullets, and `"View Case Study"` / `"Ask AI about this"` buttons.
2. **Scenario 2 — Interactive 3D Tech Globe & Categorized Pill Table (US2 / P2)**:
   - Scroll to `#skills`. Drag the `#0B1120` 3D Tech Globe to rotate the `#38BDF8` wireframe sphere.
   - Click any of the 22 skill nodes (e.g., `Blazor / MudBlazor`). Confirm the selected-skill summary badge appears inside the globe container AND `Blazor (MudBlazor)` highlights in the Categorized Pill Table below.
3. **Scenario 3 — About, Education & Certifications (US3 / P3)**:
   - Inspect `#about` (narrative bio + 4 milestones card), `#education` (BPSU BS Computer Science `2022 – 2026` with `bataan-peninsula-state-university.png`), and `#certifications` (4 Certiport/Pearson VUE + Microsoft co-branded cards and 1 Cisco card).
4. **Scenario 4 — Contact Outreach & Ask My Resume Hybrid RAG (US4 / P4)**:
   - Scroll to `#contact` (`#38BDF8` banner). Click `"Copy email"` and verify clipboard contains `allenjames.laxamana@gmail.com` and button shows `"Copied!"`.
   - Click `"Ask My Resume"` in the header or `"Ask AI about this"` on the `SuhayCore` card. Submit a question and verify a grounded response with `docs/resume.md` citations is returned (both when FastAPI is running and when FastAPI is stopped to verify automatic local fallback).
