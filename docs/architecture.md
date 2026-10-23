# Technical Architecture Documentation: FixMyCity

## 1. High-Level Architectural Overview

FixMyCity is structured around a decoupled, modular civic-tech architecture engineered for high transparency, strict accountability, and sub-second responsiveness.

```mermaid
graph TD
    User([Browser Client]) --> NextApp[Next.js 16 App Router]
    
    subgraph Frontend Layer
        NextApp --> I18n[Bilingual Context (EN / HI)]
        NextApp --> AuthContext[Role-Aware Auth Context]
        NextApp --> LeafletMap[GIS Leaflet / OpenStreetMap]
        NextApp --> UIComponents[Tailwind Editorial Civic Theme]
    end

    subgraph Service Engines
        NextApp --> RouterEngine[Smart Dept Router & Radius Expander]
        NextApp --> DupEngine[Haversine Duplicate Detection]
        NextApp --> ClassEngine[Modular Classification Engine]
        NextApp --> EscEngine[Automated SLA Escalation Engine]
    end

    subgraph Data & Storage Layer
        NextApp --> DBService[Unified DB Service Layer]
        DBService -->|Remote| Supabase[Supabase PostgreSQL + RLS]
        DBService -->|Local/Test| InMemory[Seeded Municipal Store]
        DBService --> Storage[Supabase Storage / Controlled Multipart]
    end
```

---

## 2. Core Service Engines

### A. Modular Issue Classifier (`src/features/classification/`)
- Analyzes text and image metadata against municipal problem taxonomies.
- Generates category suggestion (`suggested_category`) and numerical confidence score (`classification_confidence`).
- Retains both the suggested category and the final citizen-confirmed category for model telemetry and auditing.

### B. GPS Duplicate Detector (`src/features/duplicate-detection/`)
- Evaluates submitted GPS coordinates against unresolved community tickets within a configurable perimeter (default: 150m).
- Uses the Haversine formula to compute exact distance in meters.
- Evaluates Jaccard token overlap between grievance descriptions.
- Enforces strict category matching: different issues at the same location (e.g. broken streetlight next to a pothole) are never merged.

### C. Smart Department Router (`src/features/routing/`)
- Validates citizen's chosen department against registered category capabilities.
- Determines the closest municipal office by distance.
- If no office is within the initial search radius (5km), triggers **Dynamic Radius Expansion** in 5km increments up to 50km.
- If no office exists or category is unserved, transitions ticket to `UNDER_ADMIN_REVIEW` with an audit note rather than arbitrarily misrouting.

### D. Automated SLA Escalation Engine (`src/features/escalation/`)
- Calculates deadlines from configurable priority policies (IST).
- Endpoint: `POST /api/cron/escalate` secured with bearer token.
- Scans unresolved complaints (`status != 'RESOLVED'`) where `now > deadline`.
- Idempotently creates `escalation_records` and flags complaint as `is_escalated = true`.

---

## 3. Security & Role-Based Authorization
- **Role Isolation:** Citizens cannot access operational or administrative controls. Employees can only mutate tickets belonging to their authorized department.
- **Resolution Proof Enforcement:** Closing an issue requires mandatory on-site photo proof and substantive resolution notes.
- **Privacy Protection:** Public community feeds mask citizen phone numbers and private identifiers.
