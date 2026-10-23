import {
  Department,
  DepartmentOffice,
  Complaint,
  ComplaintStatus,
  ComplaintStatusHistory,
  ComplaintComment,
  EscalationRecord,
  PriorityLevel,
  PriorityPolicy,
  UserProfile,
  CivicCategory,
} from '@/types';
import {
  INITIAL_DEPARTMENTS,
  INITIAL_OFFICES,
  INITIAL_COMPLAINTS,
  INITIAL_ESCALATIONS,
  INITIAL_POLICIES,
  INITIAL_STATUS_HISTORY,
  INITIAL_PROFILES,
} from './mockData';
import { calculateDeadline, scanAndEscalateComplaints } from '@/features/escalation/escalationEngine';

// In-memory data store for deterministic testing & offline demonstration
class InMemoryDatabase {
  departments: Department[] = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
  offices: DepartmentOffice[] = JSON.parse(JSON.stringify(INITIAL_OFFICES));
  complaints: Complaint[] = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS));
  escalations: EscalationRecord[] = JSON.parse(JSON.stringify(INITIAL_ESCALATIONS));
  policies: PriorityPolicy[] = JSON.parse(JSON.stringify(INITIAL_POLICIES));
  statusHistory: ComplaintStatusHistory[] = JSON.parse(JSON.stringify(INITIAL_STATUS_HISTORY));
  comments: ComplaintComment[] = [];
  userSupports: { complaint_id: string; user_id: string }[] = [];
  profiles: UserProfile[] = JSON.parse(JSON.stringify(INITIAL_PROFILES));

  reset() {
    this.departments = JSON.parse(JSON.stringify(INITIAL_DEPARTMENTS));
    this.offices = JSON.parse(JSON.stringify(INITIAL_OFFICES));
    this.complaints = JSON.parse(JSON.stringify(INITIAL_COMPLAINTS));
    this.escalations = JSON.parse(JSON.stringify(INITIAL_ESCALATIONS));
    this.policies = JSON.parse(JSON.stringify(INITIAL_POLICIES));
    this.statusHistory = JSON.parse(JSON.stringify(INITIAL_STATUS_HISTORY));
    this.comments = [];
    this.userSupports = [];
    this.profiles = JSON.parse(JSON.stringify(INITIAL_PROFILES));
  }
}

// Global singleton to preserve state across Route Handlers / module reloads in dev
const globalForDb = globalThis as unknown as { inMemoryDb?: InMemoryDatabase };
export const db = globalForDb.inMemoryDb ?? new InMemoryDatabase();
if (process.env.NODE_ENV !== 'production') globalForDb.inMemoryDb = db;

export const dbService = {
  async getDepartments(): Promise<Department[]> {
    return db.departments;
  },

  async getDepartmentOffices(): Promise<DepartmentOffice[]> {
    return db.offices;
  },

  async getPriorityPolicies(): Promise<PriorityPolicy[]> {
    return db.policies;
  },

  async updatePriorityPolicy(level: PriorityLevel, durationHours: number): Promise<PriorityPolicy> {
    const policy = db.policies.find((p) => p.priority_level === level);
    if (!policy) {
      throw new Error(`Policy not found for priority ${level}`);
    }
    policy.duration_hours = durationHours;
    policy.updated_at = new Date().toISOString();
    return policy;
  },

  async getComplaints(filter?: {
    departmentId?: string;
    category?: CivicCategory;
    status?: ComplaintStatus;
    citizenId?: string;
  }): Promise<Complaint[]> {
    let result = [...db.complaints];

    if (filter?.departmentId) {
      result = result.filter((c) => c.department_id === filter.departmentId);
    }
    if (filter?.category) {
      result = result.filter((c) => c.category === filter.category);
    }
    if (filter?.status) {
      result = result.filter((c) => c.status === filter.status);
    }
    if (filter?.citizenId) {
      result = result.filter((c) => c.citizen_id === filter.citizenId);
    }

    return result.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  async getComplaintById(id: string): Promise<Complaint | null> {
    return db.complaints.find((c) => c.id === id) || null;
  },

  async getComplaintByTrackingId(trackingId: string): Promise<Complaint | null> {
    const normalized = (trackingId || '').trim().toUpperCase();
    return (
      db.complaints.find(
        (c) => c.tracking_id.toUpperCase() === normalized || c.id === trackingId
      ) || null
    );
  },

  async createComplaint(data: {
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
    citizen_name?: string;
    citizen_phone?: string;
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
    priority?: PriorityLevel;
    image_urls?: string[];
  }): Promise<Complaint> {
    const priority = data.priority || 'MODERATE';
    const deadline = calculateDeadline(priority, db.policies);

    // Generate unique human-readable tracking ID: FMC-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const tracking_id = `FMC-${new Date().getFullYear()}-${randomSuffix}`;

    const newComplaint: Complaint = {
      id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tracking_id,
      title: data.title,
      description: data.description,
      category: data.category,
      suggested_category: data.suggested_category,
      classification_confidence: data.classification_confidence,
      department_id: data.department_id,
      department_name: data.department_name,
      department_office_id: data.department_office_id,
      department_office_name: data.department_office_name,
      citizen_id: data.citizen_id,
      citizen_name: data.citizen_name || 'Citizen User',
      citizen_phone: data.citizen_phone,
      latitude: data.latitude,
      longitude: data.longitude,
      landmark: data.landmark,
      address: data.address,
      state: data.state,
      district: data.district,
      jurisdiction_type: data.jurisdiction_type,
      local_body_name: data.local_body_name,
      lgd_code: data.lgd_code,
      ward_or_village: data.ward_or_village,
      status: 'PENDING',
      priority,
      deadline,
      is_escalated: false,
      image_urls: data.image_urls || [],
      supports_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.complaints.unshift(newComplaint);

    // Record initial status history
    db.statusHistory.push({
      id: `hist-${Date.now()}`,
      complaint_id: newComplaint.id,
      status_from: null,
      status_to: 'PENDING',
      changed_by_user_id: data.citizen_id,
      changed_by_name: data.citizen_name || 'Citizen User',
      changed_by_role: 'CITIZEN',
      notes: 'Initial complaint registration with GPS coordinates.',
      created_at: new Date().toISOString(),
    });

    return newComplaint;
  },

  async updateComplaintStatus(
    complaintId: string,
    newStatus: ComplaintStatus,
    user: { id: string; name: string; role: 'CITIZEN' | 'EMPLOYEE' | 'ADMIN' },
    notes?: string,
    resolutionProofUrl?: string
  ): Promise<Complaint> {
    const complaint = db.complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const previousStatus = complaint.status;
    complaint.status = newStatus;
    complaint.updated_at = new Date().toISOString();

    if (newStatus === 'RESOLVED') {
      complaint.resolved_at = new Date().toISOString();
      complaint.resolved_by = user.id;
      if (resolutionProofUrl) {
        complaint.resolution_image_url = resolutionProofUrl;
      }
      if (notes) {
        complaint.resolution_notes = notes;
      }
    }

    db.statusHistory.push({
      id: `hist-${Date.now()}`,
      complaint_id: complaint.id,
      status_from: previousStatus,
      status_to: newStatus,
      changed_by_user_id: user.id,
      changed_by_name: user.name,
      changed_by_role: user.role,
      notes: notes || `Status changed from ${previousStatus} to ${newStatus}`,
      created_at: new Date().toISOString(),
    });

    return complaint;
  },

  async updateComplaintPriority(
    complaintId: string,
    newPriority: PriorityLevel,
    user: { id: string; name: string; role: 'EMPLOYEE' | 'ADMIN' },
    reason?: string
  ): Promise<Complaint> {
    const complaint = db.complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const previousPriority = complaint.priority;
    complaint.priority = newPriority;
    // Transparently recalculate deadline from original creation or current time
    complaint.deadline = calculateDeadline(newPriority, db.policies, new Date(complaint.created_at));
    complaint.updated_at = new Date().toISOString();

    db.statusHistory.push({
      id: `hist-${Date.now()}`,
      complaint_id: complaint.id,
      status_from: complaint.status,
      status_to: complaint.status,
      changed_by_user_id: user.id,
      changed_by_name: user.name,
      changed_by_role: user.role,
      notes: `Priority adjusted from ${previousPriority} to ${newPriority}. New Deadline: ${complaint.deadline}. Reason: ${reason || 'Operational reassessment'}`,
      created_at: new Date().toISOString(),
    });

    return complaint;
  },

  async toggleSupport(complaintId: string, userId: string): Promise<{ supported: boolean; newCount: number }> {
    const complaint = db.complaints.find((c) => c.id === complaintId);
    if (!complaint) throw new Error('Complaint not found');

    const existingIndex = db.userSupports.findIndex(
      (s) => s.complaint_id === complaintId && s.user_id === userId
    );

    if (existingIndex >= 0) {
      db.userSupports.splice(existingIndex, 1);
      complaint.supports_count = Math.max(0, complaint.supports_count - 1);
      return { supported: false, newCount: complaint.supports_count };
    } else {
      db.userSupports.push({ complaint_id: complaintId, user_id: userId });
      complaint.supports_count += 1;
      return { supported: true, newCount: complaint.supports_count };
    }
  },

  async addComment(
    complaintId: string,
    user: { id: string; name: string; role: 'CITIZEN' | 'EMPLOYEE' | 'ADMIN' },
    commentText: string
  ): Promise<ComplaintComment> {
    const comment: ComplaintComment = {
      id: `comm-${Date.now()}`,
      complaint_id: complaintId,
      user_id: user.id,
      user_name: user.name,
      user_role: user.role,
      comment_text: commentText.trim(),
      created_at: new Date().toISOString(),
    };
    db.comments.push(comment);
    return comment;
  },

  async getComments(complaintId: string): Promise<ComplaintComment[]> {
    return db.comments
      .filter((c) => c.complaint_id === complaintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async getStatusHistory(complaintId: string): Promise<ComplaintStatusHistory[]> {
    return db.statusHistory
      .filter((h) => h.complaint_id === complaintId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  async getEscalations(): Promise<EscalationRecord[]> {
    return db.escalations.sort(
      (a, b) => new Date(b.escalation_timestamp).getTime() - new Date(a.escalation_timestamp).getTime()
    );
  },

  async updateEscalationStatus(
    escalationId: string,
    followUpStatus: 'PENDING' | 'IN_REVIEW' | 'ACTIONED' | 'DISMISSED',
    followUpNotes: string,
    actionedBy: string
  ): Promise<EscalationRecord> {
    const record = db.escalations.find((e) => e.id === escalationId);
    if (!record) throw new Error('Escalation record not found');

    record.follow_up_status = followUpStatus;
    record.follow_up_notes = followUpNotes;
    record.actioned_by = actionedBy;
    if (followUpStatus === 'ACTIONED' || followUpStatus === 'DISMISSED') {
      record.resolved_at = new Date().toISOString();
    }
    return record;
  },

  async runEscalationScan(): Promise<{
    newEscalations: EscalationRecord[];
    escalatedComplaintIds: string[];
  }> {
    const result = scanAndEscalateComplaints(db.complaints, db.escalations, new Date());

    if (result.newEscalations.length > 0) {
      db.escalations.unshift(...result.newEscalations);

      // Mark complaints as is_escalated in memory
      for (const id of result.escalatedComplaintIds) {
        const c = db.complaints.find((comp) => comp.id === id);
        if (c) {
          c.is_escalated = true;
          c.updated_at = new Date().toISOString();
        }
      }
    }

    return result;
  },

  async importDepartmentOfficesCsv(csvContent: string): Promise<{ addedCount: number; errors: string[] }> {
    const lines = csvContent.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length < 2) {
      return { addedCount: 0, errors: ['CSV file is empty or lacks headers.'] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const errors: string[] = [];
    let addedCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim());
      if (parts.length < headers.length) {
        errors.push(`Row ${i + 1}: Insufficient columns`);
        continue;
      }

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx];
      });

      const office_name = row['office_name'] || row['name'];
      const office_code = row['office_code'] || row['code'] || `OFF-${Date.now()}-${i}`;
      const department_id = row['department_id'] || db.departments[0].id;
      const address = row['address'] || 'Municipal Ward Office';
      const lat = parseFloat(row['latitude'] || row['lat'] || '18.5204');
      const lon = parseFloat(row['longitude'] || row['lon'] || '73.8567');
      const radius = parseFloat(row['service_radius_km'] || '6.0');

      // Duplicate detection by office_code
      if (db.offices.some((o) => o.office_code.toLowerCase() === office_code.toLowerCase())) {
        errors.push(`Row ${i + 1}: Duplicate office_code "${office_code}" already registered.`);
        continue;
      }

      if (!office_name || isNaN(lat) || isNaN(lon)) {
        errors.push(`Row ${i + 1}: Invalid name or coordinates`);
        continue;
      }

      // Validate geographic bounds within India (approx 6°N - 37.6°N, 68.7°E - 97.4°E)
      if (lat < 6.0 || lat > 37.6 || lon < 68.7 || lon > 97.4) {
        errors.push(`Row ${i + 1}: Coordinates (${lat}, ${lon}) fall outside Indian geographic boundaries.`);
        continue;
      }

      const phoneRaw = (row['phone'] || '').trim();
      const verifiedPhone = phoneRaw && phoneRaw !== '020-25501000' && phoneRaw !== '020-25430012' ? phoneRaw : 'Not yet verified';

      const newOffice: DepartmentOffice = {
        id: `f-imported-${Date.now()}-${i}`,
        department_id,
        office_name,
        office_code,
        address,
        latitude: lat,
        longitude: lon,
        service_radius_km: radius,
        jurisdiction_area: row['jurisdiction_area'] || 'Regional Unit',
        phone: verifiedPhone,
        contact_person: row['contact_person'] || 'Duty Officer',
        active: true,
        state: row['state'] || 'Unspecified State',
        district: row['district'] || 'Unspecified District',
        local_body_type: (row['local_body_type'] as any) || 'MUNICIPAL_CORPORATION',
        local_body_name: row['local_body_name'] || 'Local Civic Body',
        lgd_code: row['lgd_code'] || 'LGD-IMPORT',
        source_authority: 'Admin Verified CSV Import',
        source_url: 'https://lgdirectory.gov.in/',
        verification_status: 'VERIFIED',
        last_verified_at: new Date().toISOString(),
        data_imported_at: new Date().toISOString(),
      };

      db.offices.push(newOffice);
      addedCount++;
    }

    return { addedCount, errors };
  },

  resetDatabase() {
    db.reset();
  },
};
