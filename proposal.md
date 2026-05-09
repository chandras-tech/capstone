# FinSight — Personal Budget & Spend Analyzer
### Capstone Project Proposal

> *"If you don't know how much you are spending and earning in a day, you can't be rich."*

---

## 1. Project Overview

FinSight is an AI-powered personal finance dashboard that allows users to upload
bank statements (credit cards, debit cards, salary slips) and get a clear picture
of their financial health — income, expenses, debt ratios — with actionable AI
recommendations to improve their financial life.

---

## 2. Problem Statement

Most people:
- Don't track where their money goes
- Don't know their income-to-debt ratio
- Miss opportunities (better mortgage rates, cashback stores, unnecessary subscriptions)
- React to financial problems instead of preventing them

FinSight solves this by making financial awareness automatic and intelligent.

---

## 3. Core Features

### Phase 1 — Data Ingestion
- Upload PDF/CSV bank statements (credit card, debit card, salary)
- Auto-parse and extract transactions using AI
- Auto-categorize: Food, Rent, Mortgage, Shopping, Travel, Utilities, etc.
- Support multiple accounts and banks

### Phase 2 — Dashboard & Analytics
- Monthly income vs expenses chart
- Income-to-debt ratio meter
- Category-wise spending breakdown (pie/bar charts)
- Cash flow trend (last 6/12 months)
- Credit card utilization tracker
- Savings rate calculator

### Phase 3 — AI Recommendations
- Mortgage rate optimization suggestions
- Cashback grocery store recommendations
- Subscription audit (identify unused recurring charges)
- Spending alerts ("You spent 40% more on dining this month")
- Savings opportunity detection
- Debt payoff strategy (avalanche vs snowball)

---

## 4. Tech Stack

### Frontend (UI)
| Technology | Purpose |
|---|---|
| **React + TypeScript** | UI framework |
| **Tailwind CSS** | Styling |
| **Recharts** | Charts and graphs |
| **React Query** | API state management |
| **React Dropzone** | File upload UI |
| **shadcn/ui** | Component library |

### Backend
| Technology | Purpose |
|---|---|
| **FastAPI (Python)** | REST API server |
| **Celery + Redis** | Background jobs (PDF parsing) |
| **pdfplumber / PyMuPDF** | PDF statement parsing |
| **pandas** | Data processing |
| **Claude API (Anthropic)** | AI categorization + recommendations |

### Database
| Technology | Purpose |
|---|---|
| **PostgreSQL** | Primary database (transactions, users) |
| **Redis** | Job queue + caching |
| **SQLAlchemy** | ORM |
| **Alembic** | Database migrations |

### Infrastructure
| Technology | Purpose |
|---|---|
| **Docker + Docker Compose** | Local development |
| **AWS S3 / Cloudflare R2** | Statement file storage |
| **JWT** | Authentication |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     USER BROWSER                        │
│              React + TypeScript Frontend                │
│   [Upload] [Dashboard] [Charts] [AI Recommendations]   │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS REST API
┌──────────────────────▼──────────────────────────────────┐
│                  FastAPI Backend                         │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐ │
│  │  Auth Layer │ │ File Handler │ │  Analytics Engine│ │
│  └─────────────┘ └──────┬───────┘ └──────────────────┘ │
│                         │                               │
│  ┌──────────────────────▼───────────────────────────┐  │
│  │           Celery Background Workers               │  │
│  │  [PDF Parser] [AI Categorizer] [Recommendation]  │  │
│  └──────────────────────┬───────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │
        ┌─────────────────┼──────────────────┐
        │                 │                  │
┌───────▼──────┐  ┌───────▼──────┐  ┌───────▼──────┐
│  PostgreSQL  │  │    Redis     │  │  Claude API  │
│  (Primary DB)│  │  (Job Queue) │  │  (AI Engine) │
└──────────────┘  └──────────────┘  └──────────────┘
        │
┌───────▼──────┐
│  S3 / R2     │
│ (PDF Storage)│
└──────────────┘
```

---

## 6. Database Schema

```sql
-- Users
users (id, email, name, password_hash, created_at)

-- Financial accounts (bank, credit card, etc.)
accounts (id, user_id, name, type, bank_name, currency)

-- Uploaded statement files
statements (id, account_id, file_url, period_start, period_end, status)

-- Individual transactions parsed from statements
transactions (
  id, account_id, statement_id,
  date, description, amount, type (credit/debit),
  category, subcategory, merchant,
  is_recurring, created_at
)

-- AI generated recommendations
recommendations (id, user_id, type, title, body, potential_saving, created_at)

-- Monthly summaries (pre-aggregated for dashboard speed)
monthly_summaries (
  id, user_id, month, year,
  total_income, total_expenses,
  total_debt_payments, savings,
  debt_to_income_ratio, top_categories
)
```

---

## 7. AI Integration (Claude API)

### 7.1 Transaction Categorization
```
Input:  "WHOLEFDS MKT #10 $127.43"
Output: { category: "Groceries", merchant: "Whole Foods", type: "debit" }
```

### 7.2 Recommendation Engine
```
Input:  User's last 3 months of transactions + financial profile
Output: Ranked list of personalized recommendations

Examples:
- "Your mortgage at 7.2% — current market rates are 6.1%. 
   Refinancing could save you $312/month."
- "You spent $840 at Kroger last month. 
   Switching to HEB (5% cashback) saves ~$42/month."
- "You have 4 streaming services ($67/month). 
   Netflix + one is $22. Potential saving: $45/month."
```

### 7.3 Spending Anomaly Detection
```
Input:  Current month vs historical average
Output: "Dining spend is 2.3x your 6-month average. 
         You're $340 over your usual pattern."
```

---

## 8. Project Phases & Timeline

**Deadline: May 8, 2026 (15 days from April 23)**

```
Week 1 — Build Core (Apr 23 – Apr 29)
│
├── Days 1-2 (Apr 23-24): Foundation
│   ├── Docker Compose setup (FastAPI + React + PostgreSQL + Redis)
│   ├── Database schema + Alembic migrations
│   ├── User auth (register/login/JWT)
│   └── File upload endpoint + S3/R2 storage
│
├── Days 3-4 (Apr 25-26): Parsing Engine
│   ├── PDF parser (pdfplumber) for credit/debit statements
│   ├── CSV import support
│   ├── Claude API integration for auto-categorization
│   └── Transaction storage + deduplication
│
└── Days 5-7 (Apr 27-29): Dashboard
    ├── Income vs Expense bar chart (monthly)
    ├── Category breakdown pie chart
    ├── Debt-to-income ratio gauge
    ├── Cash flow trend (last 6 months)
    └── Month selector + filters

Week 2 — AI + Polish + Ship (Apr 30 – May 8)
│
├── Days 8-9 (Apr 30 - May 1): AI Recommendations
│   ├── Recommendation engine (Claude API)
│   ├── Mortgage rate optimization suggestions
│   ├── Cashback grocery store tips
│   ├── Subscription audit (recurring charges)
│   └── Spending anomaly alerts
│
├── Days 10-11 (May 2-3): UI Polish
│   ├── Mobile responsive layout
│   ├── Upload progress + parsing status UI
│   └── Recommendation cards with savings estimates
│
├── Days 12-13 (May 4-5): Testing & Bug Fixes
│   ├── End-to-end flow: upload → parse → dashboard → AI tips
│   ├── Multi-account and multi-month testing
│   └── Edge cases (missing data, bad PDFs)
│
└── Days 14-15 (May 6-8): Final Polish & Demo-Ready
    ├── Seed demo data for presentation
    ├── Docker deploy (local or VPS)
    └── README + demo walkthrough

CUTS from original scope (ship fast, add later):
  ✗ PDF export of reports
  ✗ Plaid auto-sync
  ✗ Investment tracker
  ✗ Family/household view
```

---

## 9. API Endpoints

```
POST   /auth/register
POST   /auth/login

POST   /accounts              — add bank/card account
GET    /accounts              — list accounts

POST   /statements/upload     — upload PDF/CSV
GET    /statements            — list uploaded statements
GET    /statements/{id}/status — parsing status

GET    /transactions          — list with filters (month, category, account)
PATCH  /transactions/{id}     — correct category

GET    /dashboard/summary     — monthly summary stats
GET    /dashboard/trends      — 12-month trend data
GET    /dashboard/categories  — spending by category

GET    /recommendations       — AI recommendations list
POST   /recommendations/refresh — trigger fresh AI analysis
```

---

## 10. Security Considerations

- All statements stored encrypted at rest (S3 SSE)
- JWT tokens with short expiry + refresh tokens
- User can only access their own data (row-level security)
- No raw financial data sent to Claude — only anonymized transaction descriptions
- HTTPS only
- Rate limiting on upload endpoints

---

## 11. Success Metrics

- Upload → parsed transactions in < 30 seconds
- Categorization accuracy > 90%
- Dashboard loads in < 2 seconds
- At least 3 actionable AI recommendations per user per month
- Mobile responsive (works on phone)

---

## 12. Conceptual Data Model & Diagram

### Entities & Relationships

```
┌──────────┐       ┌───────────┐       ┌─────────────┐
│  User    │ 1───n │  Account  │ 1───n │  Statement  │
│──────────│       │───────────│       │─────────────│
│ id       │       │ id        │       │ id          │
│ email    │       │ user_id   │       │ account_id  │
│ name     │       │ name      │       │ file_url    │
│ password │       │ type      │       │ period_start│
└──────────┘       │ bank_name │       │ period_end  │
                   └───────────┘       │ status      │
                                       └──────┬──────┘
                                              │ 1
                                              │
                                              n
                                    ┌─────────▼──────────┐
                                    │    Transaction      │
                                    │────────────────────│
                                    │ id                  │
                                    │ account_id          │
                                    │ statement_id        │
                                    │ date                │
                                    │ description         │
                                    │ amount              │
                                    │ type (credit/debit) │
                                    │ category ───────────┼──► Category
                                    │ merchant            │    (Food, Rent,
                                    │ is_recurring        │     Travel, etc.)
                                    └─────────────────────┘

┌──────────┐ 1───n ┌──────────────────┐
│  User    │       │  Recommendation  │
│          │       │──────────────────│
│          │       │ id               │
│          │       │ user_id          │
│          │       │ type             │
│          │       │ title            │
│          │       │ body             │
│          │       │ potential_saving │
└──────────┘       └──────────────────┘

┌──────────┐ 1───n ┌──────────────────┐
│  User    │       │ Monthly Summary  │
│          │       │──────────────────│
│          │       │ user_id          │
│          │       │ month / year     │
│          │       │ total_income     │
│          │       │ total_expenses   │
│          │       │ debt_payments    │
│          │       │ savings          │
│          │       │ dti_ratio        │
└──────────┘       └──────────────────┘
```

### Key Relationships
| Relationship | Cardinality | Notes |
|---|---|---|
| User → Account | One-to-Many | User can have checking, savings, multiple credit cards |
| Account → Statement | One-to-Many | Each monthly upload is one statement |
| Statement → Transaction | One-to-Many | Hundreds of rows per statement |
| Transaction → Category | Many-to-One | AI assigns one category per transaction |
| User → Recommendation | One-to-Many | Refreshed monthly by AI engine |
| User → Monthly Summary | One-to-Many | Pre-aggregated for fast dashboard load |

---

## 13. Tools, Data Sources & Formats

### Data Sources
| Source | Type | Example |
|---|---|---|
| Credit card statements | PDF / CSV | Chase, Amex, Capital One |
| Bank / debit statements | PDF / CSV | Wells Fargo, Bank of America, Chase |
| Salary / payroll slips | PDF | ADP, Gusto, direct deposit summaries |
| Manual cash entries | UI form | User-entered cash spend |

### File Formats Supported
| Format | Parser | Notes |
|---|---|---|
| **PDF** | pdfplumber + Claude API | Handles multi-column, table-based layouts |
| **CSV** | pandas | Most banks offer CSV export |
| **OFX / QFX** | ofxparse (Python) | Quicken format — future phase |

### Tools
| Tool | Role |
|---|---|
| **pdfplumber** | Extracts raw text + tables from PDF statements |
| **pandas** | Cleans, normalizes, and transforms transaction rows |
| **Claude API** | Categorizes ambiguous descriptions, extracts merchant names |
| **Celery + Redis** | Async background parsing so UI stays responsive |
| **SQLAlchemy** | ORM for PostgreSQL writes |
| **AWS S3 / Cloudflare R2** | Stores original uploaded files (never deleted) |

---

## 14. Ingestion Strategy & Data Quality Checks

### Ingestion Pipeline

```
User uploads PDF/CSV
        │
        ▼
FastAPI /statements/upload
  ├── Save file to S3
  ├── Create statement record (status: pending)
  └── Enqueue Celery job
              │
              ▼
        Celery Worker
  ├── Extract text / tables (pdfplumber or pandas)
  ├── Normalize rows → standard schema
  │     (date, description, amount, debit/credit)
  ├── Send batches to Claude API → category + merchant
  ├── Run Data Quality Checks (see below)
  ├── Write clean transactions to PostgreSQL
  ├── Upsert monthly_summaries
  └── Mark statement status: completed (or failed)
              │
              ▼
      Frontend polls /statements/{id}/status
      → Dashboard refreshes automatically
```

### Data Quality Checks
| Check | Rule | Action on Failure |
|---|---|---|
| **Duplicate detection** | Hash(date + amount + description + account_id) must be unique | Skip duplicate, log warning |
| **Amount validation** | Amount must be numeric, non-zero, reasonable range (<$1M) | Flag for manual review |
| **Date validation** | Date must fall within statement period ± 5 days | Flag, still import |
| **Missing description** | Description cannot be null/blank | Set to "Unknown — {merchant_code}" |
| **Category confidence** | Claude returns confidence score | If < 70%, mark as "Uncategorized" for user review |
| **Balance reconciliation** | Sum of debits − credits should match statement closing balance | Alert user if mismatch > $1 |
| **Currency consistency** | All rows in a statement must share one currency | Reject mixed-currency files |
| **Period overlap** | New statement period must not fully overlap an existing one | Warn user before import |

---

## 15. Success Metrics & Stakeholder Value

### Technical Success Metrics
| Metric | Target |
|---|---|
| Upload → transactions available | < 30 seconds |
| AI categorization accuracy | > 90% |
| Dashboard initial load | < 2 seconds |
| Duplicate transaction rate | < 0.1% |
| Data quality rejection rate | < 5% of uploads |
| System uptime | > 99% during demo period |

### Product Success Metrics
| Metric | Target |
|---|---|
| AI recommendations per user/month | ≥ 3 actionable tips |
| Estimated monthly savings surfaced | > $100/user on average |
| Categories correctly assigned without user correction | > 90% |
| Mobile usability | Fully responsive, works on phone |

### Stakeholder Value

**For the Individual User**
- Know exactly where every dollar goes without manual tracking
- See income-to-debt ratio at a glance — the single most important financial health number
- Get personalized, dollar-quantified recommendations (not generic advice)
- Catch unused subscriptions and overspending before it compounds

**For a Financial Advisor / Planner**
- Client arrives with months of parsed, categorized data — no manual prep
- Advisor can focus on strategy, not data entry
- AI pre-surfaces the biggest savings opportunities to discuss

**For a Capstone Evaluator**
- Demonstrates full-stack engineering: ingestion → storage → analytics → AI
- Real-world problem with measurable outcomes
- AI integration is purposeful, not decorative — recommendations are dollar-quantified
- Extensible architecture (Plaid, multi-user, mobile app are natural next steps)

---

## 16. Future Enhancements

- Plaid integration (auto-sync bank accounts, no manual upload)
- Budget goal setting with alerts
- Investment portfolio tracker
- Tax summary report
- Family/household shared view
- WhatsApp / Telegram bot for quick spend queries

---

*Built with FastAPI · React · PostgreSQL · Claude AI*
