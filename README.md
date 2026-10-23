# FixMyCity

**Citizens Issue Reporting & Government Accountability System**

[![Test Suite](https://img.shields.io/badge/tests-23%20passed-success)](file:///Users/rashikarule/Documents/fixmycity/tests)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-17304F)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38B2AC)](https://tailwindcss.com)
[![Bilingual](https://img.shields.io/badge/Language-English%20%7C%20%E0%A4%B9%E0%A4%BF%E0%A4%82%E0%A4%A6%E0%A4%B0%E0%A5%80-E07B2E)](#bilingual-support)

A full-stack, enterprise-grade civic issue reporting and government accountability web application developed as a College Idea Lab project prototype. Built with realistic Indian municipal administration data (Pune Municipal Corporation area), it empowers citizens to report civic infrastructure grievances, automatically detects duplicate issues, dispatches reports to the nearest eligible ward office using dynamic radius expansion, enforces strict priority-based SLA deadlines, and triggers automated administrative escalations when deadlines are breached.

---

## 🏛️ Key Features & System Capabilities

### 1. Citizen Portal
- **Photo Evidence & Location:** Capture/upload grievance photos (validated MIME type & size <= 5MB) and pinpoint exact coordinates with browser GPS or interactive OpenStreetMap fallback.
- **AI-Assisted Classification:** Modular heuristic token classifier suggests civic categories (`pothole`, `garbage`, `water_leakage`, `street_light`, `traffic`, `sanitation`, `environment`, `safety`) with confidence scores. Citizens can confirm or manually adjust the selection.
- **Department Selection:** Citizens can select the responsible municipal department during reporting. The smart routing engine validates eligibility against active ward offices.
- **GPS Duplicate Prevention:** Pre-submission spatial query (150m default radius) compares geographic proximity, category, and description similarity. If a duplicate exists, citizens are prompted to **"Support Existing Complaint (+1)"** rather than creating ticket backlog.
- **Community Feed & GIS Map:** Explore real-time tickets with Leaflet GIS pins color-coded by status, filter by category or SLA state, and contribute verified public comments.

### 2. Government Employee Operational Dashboard
- **Department-Restricted Queue:** Field staff access grievances assigned exclusively to their authorized municipal department (e.g., PWD, Solid Waste, Water Board).
- **SLA Countdown & Urgency Indicators:** Real-time countdown timers calculated from configurable priority policies (IST).
- **Resolution Verification:** Enforces mandatory on-site photo proof and detailed work notes before an issue can be transitioned to `RESOLVED`.
- **Priority Re-assessment:** Authorized officers can adjust priority levels, automatically recalculating the deadline with full audit logging.

### 3. Executive Administration Command Center
- **System-Wide Analytics:** Live metrics including total grievances, SLA compliance rate, overdue breaches, average resolution hours, and department-wise performance tables.
- **Automated Escalation Scanner:** Executes idempotent scans to detect unresolved overdue complaints and generate formal escalation notices for senior municipal leadership.
- **CSV Ward Directory Import:** Bulk-import verified municipal ward offices, GPS coordinates, and helplines.
- **Configurable SLA Policies:** Modify duration hours for Intermediate (default 24h), Moderate (default 3d), and Standard (default 7d) urgency levels.

### 4. Bilingual Support (English & Hindi)
- Real language toggle across the entire application, including navigation, forms, validation messages, complaint statuses, and notifications.
- Complete parity across locale dictionary files (`src/locales/en.json` and `src/locales/hi.json`).
- Persistent user preference stored in `localStorage`.

---

## ⚡ Quick Start & Setup

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation
```bash
# Clone or navigate to the repository
cd fixmycity

# Install dependencies
npm install --legacy-peer-deps
```

### Run Automated Test Suite
```bash
# Executes 23 comprehensive unit & integration tests
npm test
```

### Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm start
```

---

## 🔑 Demonstration Accounts & Role Switching

For seamless prototype evaluation, use the quick role switcher in the top navigation bar or log in with these pre-seeded demo accounts:

| Role | Name / Title | Identifier | Demo Password / OTP | Default Scope |
|---|---|---|---|---|
| **Citizen** | Aarav Sharma | `+91 98765 43210` | OTP: `123456` | Report issues, track tickets, upvote, comment |
| **Staff Officer** | Er. Sunita Kulkarni | `EMP-PWD-409` | `Officer@123` | Public Works & Roads Infrastructure Dept |
| **Administrator** | Dr. Rajeshwar Rao, IAS | `ADM-PMC-001` | `Admin@123` | Municipal Commissioner (System-wide) |

---

## 🧠 Core Algorithms

### 1. Issue Classification Service (`src/features/classification/`)
- Tokenizes title, description, and photo metadata against Indian civic terminology.
- Computes category match scores and returns confidence percentages.
- Structured with an extensible interface for plugging in external vision models (e.g. Gemini Vision or custom CNNs).

### 2. GPS Duplicate Detection (`src/features/duplicate-detection/`)
- Computes geodesic distance using the Haversine formula.
- Evaluates composite similarity score: 40% distance proximity, 40% category match, 20% word-token Jaccard similarity.
- **Critical rule:** Different nearby issues (e.g. broken streetlight 10m from a pothole) are **never** merged.

### 3. Smart Department Routing with Radius Expansion (`src/features/routing/`)
- Filters active departments eligible for the selected category.
- Ranks ward offices by geographic distance.
- If no office is within the initial 5km perimeter, initiates **Dynamic Radius Expansion** in 5km increments up to 50km.
- If no office exists or category is unserved, marks complaint as `UNDER_ADMIN_REVIEW` rather than misrouting to an unrelated department.

### 4. Idempotent Escalation Engine (`src/features/escalation/`)
- Scheduled execution via `POST /api/cron/escalate` with `Authorization: Bearer <CRON_SECRET>`.
- Evaluates complaints where `status != 'RESOLVED'` and `now > deadline`.
- Dispatches escalation records with overdue hours and flags tickets for senior administrative review.
- **Idempotency guarantee:** Repeated cron runs will not produce duplicate records for the same overdue ticket.

---

## 📁 Repository Structure

```
fixmycity/
├── README.md
├── .env.example
├── vitest.config.ts
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Public landing page with live GIS map
│   │   ├── citizen/
│   │   │   ├── report/page.tsx       # Grievance reporting with GPS & AI suggestion
│   │   │   └── complaints/page.tsx   # Community feed & GIS map
│   │   ├── track/page.tsx            # Live SLA tracker & audit history
│   │   ├── employee/page.tsx         # Operational staff queue & resolution proof
│   │   ├── admin/page.tsx            # Executive command center & SLA metrics
│   │   └── api/                      # Next.js Route Handlers
│   ├── components/
│   │   ├── layout/                   # Navbar, Footer
│   │   ├── maps/                     # SSR-safe Leaflet GIS map
│   │   ├── complaints/               # ComplaintCard, DuplicateAlertModal
│   │   └── ui/                       # StatusBadge, CategoryBadge, PriorityBadge
│   ├── features/
│   │   ├── auth/                     # Role-based AuthContext & demo switcher
│   │   ├── classification/           # Modular issue classifier
│   │   ├── duplicate-detection/      # Haversine duplicate detector
│   │   ├── routing/                  # Smart routing & radius expansion
│   │   └── escalation/               # SLA deadlines & escalation engine
│   ├── lib/
│   │   ├── db/                       # DB service (Dual-mode: local seed + Supabase)
│   │   ├── i18n/                     # Bilingual LanguageContext
│   │   └── validation/               # Zod schemas
│   ├── locales/
│   │   ├── en.json                   # English dictionary
│   │   └── hi.json                   # Hindi dictionary
│   └── types/                        # Core TypeScript domain models
├── supabase/
│   ├── migrations/                   # Full PostgreSQL schema with RLS & indexes
│   └── seed.sql                      # Realistic Indian municipal seed data
├── tests/
│   ├── unit/                         # Classifier, duplicate, routing, escalation tests
│   └── integration/                  # Business rules, authorization, bilingual parity
└── docs/
    ├── architecture.md               # Technical architecture & component diagrams
    ├── database.md                   # Database schema & entity relationships
    ├── setup.md                      # External services & deployment guide
    └── department-data.md            # Municipal directory maintenance & CSV guide
```

---

## 🧪 Verified Test Suite Summary

Run `npm test` to verify the 23 test suites covering all required scenarios:
1. `tests/unit/classifier.test.ts` — Pothole, waste, streetlight, water leak, and baseline fallback classification.
2. `tests/unit/duplicateDetection.test.ts` — Same-category nearby duplicate detection and non-merging of different nearby issues.
3. `tests/unit/routing.test.ts` — Category-to-department matching, nearest office selection, dynamic radius expansion, and administrative review flagging.
4. `tests/unit/escalation.test.ts` — Priority deadline calculation, escalation of unresolved overdue tickets, and idempotency guarantees.
5. `tests/integration/businessRules.test.ts` — Zod form validation, unique tracking ID generation, resolution proof requirements, employee authorization restrictions, support upvotes, and English/Hindi dictionary parity.

---

## 📜 Academic Project Notice
FixMyCity is developed as a college prototype for demonstrative and academic evaluation. Department office locations, citizen names, and phone numbers are simulated for demonstration within the Pune Municipal Corporation jurisdiction area and do not represent an official integration with municipal authorities.
