import { describe, it, expect } from 'vitest';
import {
  calculateDeadline,
  scanAndEscalateComplaints,
  getSlaStatus,
  DEFAULT_PRIORITY_POLICIES,
} from '@/features/escalation/escalationEngine';
import { Complaint, EscalationRecord } from '@/types';

describe('SLA Deadline & Automated Escalation Engine', () => {
  it('calculates deadline transparently based on priority policies (Item 10)', () => {
    const base = new Date('2026-10-23T10:00:00Z');

    // Intermediate priority -> 24 hours
    const deadlineIntermediate = calculateDeadline('INTERMEDIATE', DEFAULT_PRIORITY_POLICIES, base);
    expect(new Date(deadlineIntermediate).toISOString()).toBe('2026-10-24T10:00:00.000Z');

    // Moderate priority -> 72 hours (3 days)
    const deadlineModerate = calculateDeadline('MODERATE', DEFAULT_PRIORITY_POLICIES, base);
    expect(new Date(deadlineModerate).toISOString()).toBe('2026-10-26T10:00:00.000Z');

    // Standard priority -> 168 hours (7 days)
    const deadlineStandard = calculateDeadline('STANDARD', DEFAULT_PRIORITY_POLICIES, base);
    expect(new Date(deadlineStandard).toISOString()).toBe('2026-10-30T10:00:00.000Z');
  });

  it('correctly calculates SLA status and overdue hours', () => {
    const pastDeadline = new Date(Date.now() - 5 * 3600000).toISOString(); // 5 hours ago
    const status = getSlaStatus(pastDeadline);
    expect(status.isOverdue).toBe(true);
    expect(status.hoursOverdue).toBe(5);

    const futureDeadline = new Date(Date.now() + 10 * 3600000).toISOString();
    const futureStatus = getSlaStatus(futureDeadline);
    expect(futureStatus.isOverdue).toBe(false);
    expect(futureStatus.hoursRemaining).toBe(10);
  });

  const now = new Date('2026-10-23T12:00:00Z');

  const testComplaints: Complaint[] = [
    {
      id: 'comp-overdue-1',
      tracking_id: 'FMC-101',
      title: 'Overdue open pothole',
      description: 'Test description',
      category: 'ROADS_INFRASTRUCTURE',
      department_id: 'dept-roads',
      citizen_id: 'cit-1',
      latitude: 18.5,
      longitude: 73.8,
      address: 'Pune',
      status: 'PENDING', // Unresolved and past deadline
      priority: 'INTERMEDIATE',
      deadline: '2026-10-23T06:00:00Z', // 6 hours past deadline
      is_escalated: false,
      image_urls: [],
      supports_count: 0,
      created_at: '2026-10-22T06:00:00Z',
      updated_at: '2026-10-22T06:00:00Z',
    },
    {
      id: 'comp-resolved-past-deadline',
      tracking_id: 'FMC-102',
      title: 'Resolved water issue',
      description: 'Test description',
      category: 'WATER_SUPPLY',
      department_id: 'dept-water',
      citizen_id: 'cit-1',
      latitude: 18.5,
      longitude: 73.8,
      address: 'Pune',
      status: 'RESOLVED', // Marked resolved!
      priority: 'INTERMEDIATE',
      deadline: '2026-10-23T06:00:00Z',
      is_escalated: false,
      image_urls: [],
      supports_count: 0,
      created_at: '2026-10-22T06:00:00Z',
      updated_at: '2026-10-23T05:00:00Z',
    },
    {
      id: 'comp-pending-future',
      tracking_id: 'FMC-103',
      title: 'Future streetlight issue',
      description: 'Test description',
      category: 'STREET_LIGHTING',
      department_id: 'dept-light',
      citizen_id: 'cit-1',
      latitude: 18.5,
      longitude: 73.8,
      address: 'Pune',
      status: 'PENDING',
      priority: 'MODERATE',
      deadline: '2026-10-25T12:00:00Z', // In the future!
      is_escalated: false,
      image_urls: [],
      supports_count: 0,
      created_at: '2026-10-22T12:00:00Z',
      updated_at: '2026-10-22T12:00:00Z',
    },
  ];

  it('escalates ONLY unresolved overdue complaints (Item 11)', () => {
    const existingEscalations: EscalationRecord[] = [];

    const result = scanAndEscalateComplaints(testComplaints, existingEscalations, now);

    // Only comp-overdue-1 should be escalated!
    // comp-resolved-past-deadline is resolved (no escalation allowed)
    // comp-pending-future has not crossed deadline (no escalation allowed)
    expect(result.newEscalations.length).toBe(1);
    expect(result.escalatedComplaintIds).toEqual(['comp-overdue-1']);
    expect(result.newEscalations[0].overdue_hours).toBe(6);
    expect(result.newEscalations[0].follow_up_status).toBe('PENDING');
  });

  it('guarantees repeated escalation jobs will NOT create duplicate records (Item 12)', () => {
    // First run creates an escalation
    const firstRun = scanAndEscalateComplaints(testComplaints, [], now);
    expect(firstRun.newEscalations.length).toBe(1);

    const existingEscalations = [...firstRun.newEscalations];

    // Second run with the same complaints and existing escalation records
    const secondRun = scanAndEscalateComplaints(testComplaints, existingEscalations, now);

    // Must be completely idempotent — zero new escalations produced!
    expect(secondRun.newEscalations.length).toBe(0);
    expect(secondRun.escalatedComplaintIds.length).toBe(0);
  });
});
