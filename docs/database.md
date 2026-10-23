# Database Design & Entity Architecture

## 1. Relational Entity Relationship Diagram

```mermaid
erDiagram
    PROFILES ||--o{ COMPLAINTS : "files"
    PROFILES ||--o{ COMPLAINT_COMMENTS : "posts"
    PROFILES ||--o{ COMPLAINT_SUPPORTS : "upvotes"
    DEPARTMENTS ||--o{ DEPARTMENT_OFFICES : "operates"
    DEPARTMENTS ||--o{ COMPLAINTS : "assigned_to"
    DEPARTMENT_OFFICES ||--o{ COMPLAINTS : "dispatched_to"
    COMPLAINTS ||--o{ COMPLAINT_ATTACHMENTS : "contains"
    COMPLAINTS ||--o{ COMPLAINT_STATUS_HISTORY : "tracks"
    COMPLAINTS ||--o{ COMPLAINT_ROUTES : "logs"
    COMPLAINTS ||--o| ESCALATION_RECORDS : "escalates_to"
    PRIORITY_POLICIES ||--o{ COMPLAINTS : "governs_sla"

    PROFILES {
        uuid id PK
        string name
        string phone
        string email
        string role
        uuid department_id FK
        string employee_id
        timestamp created_at
    }

    DEPARTMENTS {
        uuid id PK
        string code UK
        string name
        string name_hi
        string[] categories
        string helpline
        boolean active
    }

    DEPARTMENT_OFFICES {
        uuid id PK
        uuid department_id FK
        string office_name
        string office_code UK
        float latitude
        float longitude
        float service_radius_km
        string phone
        boolean active
    }

    COMPLAINTS {
        uuid id PK
        string tracking_id UK
        string title
        text description
        string category
        string suggested_category
        float classification_confidence
        uuid department_id FK
        uuid department_office_id FK
        uuid citizen_id FK
        float latitude
        float longitude
        string address
        string status
        string priority
        timestamp deadline
        boolean is_escalated
        text[] image_urls
        text resolution_image_url
        text resolution_notes
        timestamp resolved_at
        int supports_count
        timestamp created_at
    }

    ESCALATION_RECORDS {
        uuid id PK
        uuid complaint_id FK
        uuid department_id FK
        timestamp original_deadline
        timestamp escalation_timestamp
        int overdue_hours
        string follow_up_status
        text follow_up_notes
    }

    PRIORITY_POLICIES {
        string id PK
        string priority_level UK
        string label
        string label_hi
        int duration_hours
        text description
    }
```

---

## 2. Table Specifications & Indexing Strategy

| Table Name | Primary Key | Key Indexes | Purpose |
|---|---|---|---|
| `profiles` | `id (UUID)` | `role`, `department_id` | Stores citizen, staff, and admin identities with department assignments. |
| `departments` | `id (UUID)` | `code` (Unique) | Municipal departments master list (PWD, Waste, Water, etc.). |
| `department_offices` | `id (UUID)` | `(latitude, longitude)`, `office_code` | Ward division offices with GPS coordinates for spatial dispatch. |
| `complaints` | `id (UUID)` | `status`, `category`, `department_id`, `deadline`, `(latitude, longitude)`, `tracking_id` | Core grievance master table with SLA deadlines and resolution states. |
| `complaint_attachments` | `id (UUID)` | `complaint_id`, `attachment_type` | Controlled photo evidence and resolution proof records. |
| `complaint_status_history`| `id (UUID)` | `complaint_id`, `created_at` | Immutable audit trail recording every state change, actor, and timestamp. |
| `complaint_supports` | `id (UUID)` | Unique `(complaint_id, user_id)` | Enforces strict 1-upvote-per-user constraint to prevent ballot stuffing. |
| `escalation_records` | `id (UUID)` | Unique `complaint_id` | Guarantees idempotent escalation tracking with no duplicate records. |
| `priority_policies` | `id (String)` | `priority_level` (Unique) | Stores configurable SLA hours (Intermediate: 24h, Moderate: 72h, Standard: 168h). |

---

## 3. Row Level Security (RLS) Policy Architecture

All PostgreSQL tables are safeguarded with strict RLS policies defined in `supabase/migrations/20261023000000_init_fixmycity.sql`:
- **Public Read Access:** Public community feed and tracking routes can read complaint titles, categories, addresses, and status history. Sensitive citizen phone numbers are excluded from public select queries.
- **Citizen Inserts:** Authenticated citizens can insert complaints and comments.
- **Departmental Employee Updates:** Employees can only update complaints where `complaints.department_id = profiles.department_id`.
- **Administrative Access:** Administrators have system-wide override privileges for escalations and department directory configurations.
