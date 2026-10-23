export type UserRole = 'CITIZEN' | 'EMPLOYEE' | 'ADMIN';

export type CivicCategory =
  | 'WASTE_MANAGEMENT'
  | 'WATER_SUPPLY'
  | 'ROADS_INFRASTRUCTURE'
  | 'STREET_LIGHTING'
  | 'TRAFFIC_TRANSPORT'
  | 'ENVIRONMENT_POLLUTION'
  | 'PUBLIC_HEALTH'
  | 'SAFETY_GOVERNANCE';

export type ComplaintStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'UNDER_ADMIN_REVIEW'
  | 'REJECTED';

export type PriorityLevel = 'INTERMEDIATE' | 'MODERATE' | 'STANDARD';

export type IdentityVerificationStatus =
  | 'VERIFIED_MOBILE_OTP'
  | 'AADHAAR_PENDING_GOVT_INTEGRATION'
  | 'UNVERIFIED';

export type IdentityVerificationMethod = 'MOBILE_OTP' | 'AADHAAR_EKYC';

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  role: UserRole;
  department_id?: string;
  department_name?: string;
  employee_id?: string;

  // Mandatory Identity Verification Gate
  identity_verified: boolean;
  identity_verification_status: IdentityVerificationStatus;
  identity_verification_method: IdentityVerificationMethod;
  identity_verified_at?: string;
  aadhaar_masked_token?: string; // e.g. "XXXXXXXX1012" - never raw 12 digits!

  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  name_hi: string;
  code: string;
  description: string;
  categories: CivicCategory[];
  contact_email: string;
  helpline: string;
  active: boolean;
}

export type GovernmentLevel = 'CENTRAL' | 'STATE' | 'DISTRICT' | 'LOCAL_URBAN' | 'LOCAL_RURAL';

export type LocalBodyType =
  | 'MUNICIPAL_CORPORATION'
  | 'MUNICIPALITY'
  | 'TOWN_PANCHAYAT'
  | 'GRAM_PANCHAYAT'
  | 'BLOCK_PANCHAYAT'
  | 'ZILLA_PARISHAD';

export type OfficeVerificationStatus = 'VERIFIED' | 'NOT_YET_VERIFIED' | 'SAMPLE_DATA';

export interface DepartmentOffice {
  id: string;
  department_id: string;
  department_name?: string;
  office_name: string;
  office_code: string;
  address: string;
  latitude: number;
  longitude: number;
  service_radius_km: number;
  jurisdiction_area: string;
  phone: string;
  contact_person: string;
  active: boolean;

  // Pan-India & Provenance fields (Government-ready data integrity)
  government_level?: GovernmentLevel;
  state?: string;
  district?: string;
  local_body_type?: LocalBodyType;
  local_body_name?: string;
  lgd_code?: string;
  official_website?: string;
  source_url?: string;
  source_authority?: string;
  verification_status?: OfficeVerificationStatus;
  last_verified_at?: string;
  data_imported_at?: string;
}

export interface ComplaintAttachment {
  id: string;
  complaint_id: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  attachment_type: 'EVIDENCE' | 'RESOLUTION';
  uploaded_at: string;
}

export interface ComplaintStatusHistory {
  id: string;
  complaint_id: string;
  status_from: ComplaintStatus | null;
  status_to: ComplaintStatus;
  changed_by_user_id: string;
  changed_by_name: string;
  changed_by_role: UserRole;
  notes?: string;
  created_at: string;
}

export interface ComplaintSupport {
  id: string;
  complaint_id: string;
  user_id: string;
  created_at: string;
}

export interface ComplaintComment {
  id: string;
  complaint_id: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  comment_text: string;
  created_at: string;
}

export interface ComplaintRoute {
  id: string;
  complaint_id: string;
  department_id: string;
  department_office_id?: string;
  initial_radius_km: number;
  expanded_radius_km: number;
  expansion_steps: number;
  distance_km: number;
  decision_reason: string;
  created_at: string;
}

export interface EscalationRecord {
  id: string;
  complaint_id: string;
  tracking_id?: string;
  complaint_title?: string;
  department_id: string;
  department_name?: string;
  original_deadline: string;
  escalation_timestamp: string;
  overdue_hours: number;
  follow_up_status: 'PENDING' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED';
  follow_up_notes?: string;
  actioned_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface PriorityPolicy {
  id: string;
  priority_level: PriorityLevel;
  label: string;
  label_hi: string;
  duration_hours: number;
  description: string;
  updated_at: string;
}

export interface Complaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: CivicCategory;
  suggested_category?: CivicCategory;
  classification_confidence?: number;
  department_id: string;
  department_name?: string;
  department_office_id?: string;
  department_office_name?: string;
  citizen_id: string;
  citizen_phone?: string;
  citizen_name?: string;
  latitude: number;
  longitude: number;
  landmark?: string;
  address: string;
  state?: string;
  district?: string;
  jurisdiction_type?: 'URBAN' | 'RURAL';
  local_body_name?: string;
  lgd_code?: string;
  ward_or_village?: string;
  status: ComplaintStatus;
  priority: PriorityLevel;
  deadline: string;
  is_escalated: boolean;
  image_urls: string[];
  resolution_image_url?: string;
  resolution_notes?: string;
  resolved_at?: string;
  resolved_by?: string;
  supports_count: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id: string;
  actor_name: string;
  actor_role: UserRole;
  details: Record<string, unknown>;
  created_at: string;
}

export interface DuplicateCandidate {
  complaint: Complaint;
  distanceMeters: number;
  categoryMatch: boolean;
  similarityScore: number;
  reasons: string[];
}
