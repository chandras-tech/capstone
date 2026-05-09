# FinSight — AI-Powered Personal Finance Dashboard

> *"If you don't know how much you are spending and earning in a day, you can't be rich."*

FinSight is an AI-powered personal finance dashboard that ingests bank and credit card statements via PDF/CSV upload, automatically categorizes transactions using Claude AI and keyword rules, and delivers real-time insights including spending trends, recurring bill tracking, subscription audits, cash flow predictions, and wealth leak detection — with a live OpenClaw agent monitoring mortgage refinance opportunities daily.

**Live Demo:** https://finsight-xxxx.onrender.com

---

## Features

### Core
- **PDF & CSV Upload** — Upload any bank or credit card statement (Chase, Amex, Wells Fargo, Capital One, BofA and more)
- **AI Transaction Parsing** — Claude Vision reads PDFs page-by-page and extracts every transaction
- **Smart Categorization** — Keyword rules run first (instant), Claude AI fills in unknown transactions
- **Duplicate Detection** — MD5 hash deduplication prevents re-importing the same transaction twice
- **Manual Category Override** — Edit any transaction category inline
- **Exclude Transactions** — Mark one-time income, self-transfers, or anomalies to exclude from calculations

### Dashboard
- **Period Selector** — View by This Month, Year-to-Date, Last 3 or 6 Months
- **Summary Cards** — Total Income, Total Expenses, Savings, Savings Rate
- **Income vs Expenses Chart** — Monthly bar chart
- **Category Pie Chart** — Spending breakdown by category
- **Cash Flow Trend** — 6-month savings trend line
- **Recurring Bills Chart** — Stacked bars: Mortgage, HOA, Utilities, Subscriptions, Insurance, Kid Learning
- **Adhoc/Misc Chart** — Variable spending month-over-month
- **DTI Meter** — Debt-to-Income ratio with color-coded scale (Excellent → High Risk)

### AI Insights Panel
- **Cash Flow Prediction** — Upcoming bills in next 30 days vs paycheck timing with buffer calculation
- **Subscription Audit** — Annual subscription cost, overlap detection (trading tools, streaming services)
- **Wealth Leaks Detector** — Small recurring charges < $30 appearing in 2+ months with annual cost

### Watchlist
- **Flag Suspicious Transactions** — Mark any transaction with 🚩 for monitoring
- **Verified Button** — Remove from watchlist once reviewed
- **Collapsible tile** — Minimize when not needed

### Categorization Rules
- **Persistent rules stored in PostgreSQL** — apply to every new upload automatically
- **Global defaults** — 70+ pre-built rules (Amazon, Walmart, Netflix, Sheetz, etc.)
- **Custom rules** — Add your own keywords via the Rules page UI
- **Priority system** — Higher priority rules win when multiple match

### OpenClaw Mortgage Agent
- **Daily Rate Monitor** — OpenClaw AI agent searches the web every morning for 15-year conventional mortgage rates
- **Smart Comparison** — Compares against your current 6.3% rate (2-1 buydown, started Dec 2025)
- **Alert Threshold** — Only notifies when rate found ≤ 5.5% (meaningful saving)
- **Dashboard Integration** — Alerts appear as a green card on the dashboard with current vs found rate, monthly savings, and source link
- **Powered by HEARTBEAT.md** — Agent instructions stored in `openclaw/HEARTBEAT.md`

---

## Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React + TypeScript | UI framework |
| Tailwind CSS | Styling |
| Recharts | Charts and graphs |
| React Query | API state management |
| React Dropzone | File upload UI |
| Framer Motion | Animations |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API server |
| pdfplumber + PyMuPDF | PDF extraction |
| Claude Vision API | PDF transaction parsing |
| Claude API | Transaction categorization + recommendations |
| pandas | CSV parsing |
| SQLAlchemy | ORM |

### Infrastructure
| Technology | Purpose |
|---|---|
| PostgreSQL (Supabase) | Primary database |
| Render | Cloud deployment |
| OpenClaw | AI agent for mortgage rate monitoring |
| JWT | Authentication |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   USER BROWSER                          │
│         React + TypeScript (Render Static Site)         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS REST API
┌──────────────────────▼──────────────────────────────────┐
│              FastAPI Backend (Render Web Service)        │
│  ┌──────────┐ ┌────────────┐ ┌──────────────────────┐   │
│  │ Auth/JWT │ │ PDF Parser │ │  Dashboard Analytics │   │
│  └──────────┘ └─────┬──────┘ └──────────────────────┘   │
│                     │ Claude Vision                       │
└─────────────────────┼───────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼──────┐             ┌───────▼──────┐
│  PostgreSQL  │             │  Claude API  │
│  (Supabase)  │             │ (DataExpert) │
└──────────────┘             └──────────────┘

┌─────────────────────────────────────────────────────────┐
│                  OpenClaw Agent                         │
│  Reads HEARTBEAT.md → Searches mortgage rates daily     │
│  → POSTs alerts to FastAPI → Appears on dashboard       │
└─────────────────────────────────────────────────────────┘
```

---

## API Endpoints

```
POST   /auth/register
POST   /auth/login

GET    /accounts
POST   /accounts

POST   /statements/upload          — PDF or CSV upload
GET    /statements
GET    /statements/{id}/status

GET    /transactions               — with month/year/category filters
PATCH  /transactions/{id}          — update category
PATCH  /transactions/{id}/flag     — add to watchlist
PATCH  /transactions/{id}/exclude  — exclude from calculations
POST   /transactions/recategorize  — re-run AI categorization

GET    /dashboard/summary          — income, expenses, savings, DTI
GET    /dashboard/categories       — spending by category
GET    /dashboard/trends           — 12-month trend data
GET    /dashboard/recurring        — recurring vs adhoc by month
GET    /dashboard/insights         — cash flow, subscription audit, wealth leaks

GET    /recommendations
POST   /recommendations/refresh

GET    /rules
POST   /rules
DELETE /rules/{id}

POST   /mortgage/rate-alert        — OpenClaw agent posts daily finds
GET    /mortgage/rate-alerts       — dashboard fetches latest alerts
```

---

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Supabase account
- Anthropic API key (or DataExpert proxy)

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

cp ../.env.example .env
# Fill in DATABASE_URL, ANTHROPIC_API_KEY, ANTHROPIC_BASE_URL, JWT_SECRET

uvicorn main:app --reload
# API running at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
npm install

# Create .env
echo "REACT_APP_API_URL=http://localhost:8000" > .env

npm start
# App running at http://localhost:3000
```

### Seed Demo Data

```bash
cd backend
python3 seed.py
# Creates: demo@finsight.com / password123
```

---

## OpenClaw Mortgage Agent

The agent runs inside OpenClaw and monitors 15-year conventional mortgage rates daily.

**Mortgage Details:**
- Property: Townhome, $392,000
- Loan: ~$350,000
- Current Rate: 6.3% (2-1 buydown, started Dec 2025)
- Year 1 effective: 4.3% | Year 2: 5.3% | Year 3+: 6.3%

**Setup:**
1. Copy `openclaw/HEARTBEAT.md` into your OpenClaw workspace
2. Set environment variables:
```
FINSIGHT_API_URL=https://finsight-api-jc83.onrender.com
FINSIGHT_AGENT_TOKEN=your-agent-token
```
3. Agent runs every morning, posts alerts when rates ≤ 5.5%

---

## Deployment

Deployed on Render free tier:
- **Backend:** Render Web Service (Python, FastAPI)
- **Frontend:** Render Static Site (React)
- **Database:** Supabase PostgreSQL

Push to `main` branch → Render auto-deploys both services.

---

## Security
- JWT authentication with 24-hour expiry
- Row-level data isolation (users only see their own data)
- No raw financial data sent to Claude — only transaction descriptions
- Agent endpoint protected by bearer token
- `.env` files excluded from git — all secrets in Render environment variables
- Duplicate detection prevents re-import of same transactions

---

*Built with FastAPI · React · PostgreSQL · Claude AI · OpenClaw*
