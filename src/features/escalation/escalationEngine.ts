import {
  Complaint,
  EscalationRecord,
  PriorityLevel,
  PriorityPolicy,
} from '@/types';

export const DEFAULT_PRIORITY_POLICIES: PriorityPolicy[] = [
  {
    id: 'policy-intermediate',
    priority_level: 'INTERMEDIATE',
    label: 'Intermediate Priority',
    label_hi: 'उच्च प्राथमिकता',
    duration_hours: 24, // 24 hours
    description: 'Hazardous situations, water main bursts, road sinkholes, live electric wires.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'policy-moderate',
    priority_level: 'MODERATE',
    label: 'Moderate Priority',
    label_hi: 'मध्यम प्राथमिकता',
    duration_hours: 72, // 3 days
    description: 'Community garbage accumulation, dark streetlights, drainage blockage.',
    updated_at: new Date().toISOString(),
  },
  {
    id: 'policy-standard',
    priority_level: 'STANDARD',
    label: 'Standard Priority',
    label_hi: 'सामान्य प्राथमिकता',
    duration_hours: 168, // 7 days (1 week)
    description: 'Routine pothole repair, pavement leveling, municipal sign replacements.',
    updated_at: new Date().toISOString(),
  },
];

/**
 * Calculates deadline for a complaint based on priority level and active policy.
 */
export function calculateDeadline(
  priority: PriorityLevel,
  policies: PriorityPolicy[] = DEFAULT_PRIORITY_POLICIES,
  baseDate: Date = new Date()
): string {
  const policy = policies.find((p) => p.priority_level === priority) ||
    DEFAULT_PRIORITY_POLICIES.find((p) => p.priority_level === priority);

  const hours = policy ? policy.duration_hours : 72;
  const deadlineDate = new Date(baseDate.getTime() + hours * 60 * 60 * 1000);
  return deadlineDate.toISOString();
}

/**
 * Computes remaining hours until deadline, or hours overdue.
 */
export function getSlaStatus(deadlineIso: string): {
  isOverdue: boolean;
  hoursRemaining: number;
  hoursOverdue: number;
  formattedRemaining: string;
} {
  const now = Date.now();
  const deadlineMs = new Date(deadlineIso).getTime();
  const diffMs = deadlineMs - now;
  const diffHours = Math.round(diffMs / (1000 * 60 * 60));

  if (diffHours < 0) {
    const overdue = Math.abs(diffHours);
    return {
      isOverdue: true,
      hoursRemaining: 0,
      hoursOverdue: overdue,
      formattedRemaining: `${overdue}h overdue`,
    };
  }

  return {
    isOverdue: false,
    hoursRemaining: diffHours,
    hoursOverdue: 0,
    formattedRemaining: `${diffHours}h remaining`,
  };
}

/**
 * Core Escalation Engine.
 * Scans unresolved complaints, detects SLA violations, and generates idempotent escalation records.
 * Repeated executions will NOT produce duplicate escalation records for the same ticket.
 */
export function scanAndEscalateComplaints(
  complaints: Complaint[],
  existingEscalations: EscalationRecord[],
  currentDate: Date = new Date()
): {
  newEscalations: EscalationRecord[];
  escalatedComplaintIds: string[];
} {
  const nowTime = currentDate.getTime();
  const newEscalations: EscalationRecord[] = [];
  const escalatedComplaintIds: string[] = [];

  // Create lookup for existing escalations by complaint_id to guarantee idempotency
  const alreadyEscalatedComplaintIds = new Set(
    existingEscalations.map((rec) => rec.complaint_id)
  );

  for (const complaint of complaints) {
    // Only unresolved and active complaints are evaluated
    if (complaint.status === 'RESOLVED' || complaint.status === 'REJECTED') {
      continue;
    }

    const deadlineTime = new Date(complaint.deadline).getTime();
    const isOverdue = nowTime > deadlineTime;

    if (isOverdue && !alreadyEscalatedComplaintIds.has(complaint.id)) {
      const overdueHours = Math.max(1, Math.round((nowTime - deadlineTime) / (1000 * 60 * 60)));

      const escalationRecord: EscalationRecord = {
        id: `esc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        complaint_id: complaint.id,
        tracking_id: complaint.tracking_id,
        complaint_title: complaint.title,
        department_id: complaint.department_id,
        department_name: complaint.department_name,
        original_deadline: complaint.deadline,
        escalation_timestamp: currentDate.toISOString(),
        overdue_hours: overdueHours,
        follow_up_status: 'PENDING',
        follow_up_notes: `Automated SLA Escalation: Complaint remained unresolved ${overdueHours} hours past designated deadline.`,
        created_at: currentDate.toISOString(),
      };

      newEscalations.push(escalationRecord);
      escalatedComplaintIds.push(complaint.id);
      alreadyEscalatedComplaintIds.add(complaint.id);
    }
  }

  return {
    newEscalations,
    escalatedComplaintIds,
  };
}
