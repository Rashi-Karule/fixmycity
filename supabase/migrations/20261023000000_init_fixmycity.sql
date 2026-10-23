-- ==============================================================================
-- FixMyCity: Citizens Issue Reporting & Government Accountability System
-- Database Migration: 20261023000000_init_fixmycity.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Supabase auth.users or prototype identities)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    role VARCHAR(50) NOT NULL CHECK (role IN ('CITIZEN', 'EMPLOYEE', 'ADMIN')),
    department_id UUID,
    employee_id VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Priority Policies Table
CREATE TABLE IF NOT EXISTS priority_policies (
    id VARCHAR(50) PRIMARY KEY,
    priority_level VARCHAR(50) NOT NULL UNIQUE CHECK (priority_level IN ('INTERMEDIATE', 'MODERATE', 'STANDARD')),
    label VARCHAR(100) NOT NULL,
    label_hi VARCHAR(100) NOT NULL,
    duration_hours INTEGER NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Departments Master Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    name_hi VARCHAR(255) NOT NULL,
    description TEXT,
    categories TEXT[] NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    helpline VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Department Offices Table (Geographic municipal wards/offices)
CREATE TABLE IF NOT EXISTS department_offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES departments(id) ON DELETE CASCADE,
    office_name VARCHAR(255) NOT NULL,
    office_code VARCHAR(50) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    service_radius_km DOUBLE PRECISION DEFAULT 5.0,
    jurisdiction_area VARCHAR(255),
    phone VARCHAR(50),
    contact_person VARCHAR(255),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Complaints Master Table
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tracking_id VARCHAR(50) NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    suggested_category VARCHAR(100),
    classification_confidence DOUBLE PRECISION,
    department_id UUID NOT NULL REFERENCES departments(id),
    department_office_id UUID REFERENCES department_offices(id),
    citizen_id UUID NOT NULL REFERENCES profiles(id),
    citizen_name VARCHAR(255),
    citizen_phone VARCHAR(20),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    landmark VARCHAR(255),
    address TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'UNDER_ADMIN_REVIEW', 'REJECTED')),
    priority VARCHAR(50) NOT NULL DEFAULT 'MODERATE' CHECK (priority IN ('INTERMEDIATE', 'MODERATE', 'STANDARD')),
    deadline TIMESTAMPTZ NOT NULL,
    is_escalated BOOLEAN DEFAULT FALSE,
    image_urls TEXT[] DEFAULT '{}',
    resolution_image_url TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    supports_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Complaint Attachments Table
CREATE TABLE IF NOT EXISTS complaint_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INTEGER,
    attachment_type VARCHAR(50) NOT NULL CHECK (attachment_type IN ('EVIDENCE', 'RESOLUTION')),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Complaint Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS complaint_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status_from VARCHAR(50),
    status_to VARCHAR(50) NOT NULL,
    changed_by_user_id UUID NOT NULL REFERENCES profiles(id),
    changed_by_name VARCHAR(255) NOT NULL,
    changed_by_role VARCHAR(50) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Complaint Supports / Upvotes Table (Prevents double upvoting)
CREATE TABLE IF NOT EXISTS complaint_supports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_complaint_support UNIQUE(complaint_id, user_id)
);

-- 9. Complaint Comments Table
CREATE TABLE IF NOT EXISTS complaint_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id),
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(50) NOT NULL,
    comment_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Complaint Routing Decisions Log
CREATE TABLE IF NOT EXISTS complaint_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    department_office_id UUID REFERENCES department_offices(id),
    initial_radius_km DOUBLE PRECISION NOT NULL,
    expanded_radius_km DOUBLE PRECISION NOT NULL,
    expansion_steps INTEGER NOT NULL DEFAULT 0,
    distance_km DOUBLE PRECISION NOT NULL,
    decision_reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Escalation Records Table (Idempotent tracking)
CREATE TABLE IF NOT EXISTS escalation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    complaint_id UUID NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    department_id UUID NOT NULL REFERENCES departments(id),
    original_deadline TIMESTAMPTZ NOT NULL,
    escalation_timestamp TIMESTAMPTZ DEFAULT NOW(),
    overdue_hours INTEGER NOT NULL,
    follow_up_status VARCHAR(50) DEFAULT 'PENDING' CHECK (follow_up_status IN ('PENDING', 'IN_REVIEW', 'ACTIONED', 'DISMISSED')),
    follow_up_notes TEXT,
    actioned_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_complaint_escalation UNIQUE(complaint_id)
);

-- 12. Notification Records Table
CREATE TABLE IF NOT EXISTS notification_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID REFERENCES profiles(id),
    recipient_role VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    reference_id VARCHAR(100),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    actor_id UUID NOT NULL,
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & SPATIAL QUERIES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_category ON complaints(category);
CREATE INDEX IF NOT EXISTS idx_complaints_dept ON complaints(department_id);
CREATE INDEX IF NOT EXISTS idx_complaints_deadline ON complaints(deadline);
CREATE INDEX IF NOT EXISTS idx_complaints_lat_lon ON complaints(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking_id ON complaints(tracking_id);
CREATE INDEX IF NOT EXISTS idx_escalation_records_complaint ON escalation_records(complaint_id);
CREATE INDEX IF NOT EXISTS idx_dept_offices_coords ON department_offices(latitude, longitude);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE escalation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE complaint_status_history ENABLE ROW LEVEL SECURITY;

-- Public can read non-confidential complaint info
CREATE POLICY public_complaints_read ON complaints
    FOR SELECT USING (true);

-- Authenticated citizens can create complaints
CREATE POLICY citizen_complaint_insert ON complaints
    FOR INSERT WITH CHECK (true);

-- Employees can update complaints assigned to their department
CREATE POLICY employee_complaint_update ON complaints
    FOR UPDATE USING (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'ADMIN'
            ) OR
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role = 'EMPLOYEE' 
                AND profiles.department_id = complaints.department_id
            )
        )
    );
