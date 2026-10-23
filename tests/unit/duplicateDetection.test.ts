import { describe, it, expect } from 'vitest';
import {
  calculateHaversineDistanceMeters,
  findDuplicateCandidates,
} from '@/features/duplicate-detection/duplicateDetector';
import { Complaint } from '@/types';

describe('Core Algorithm 2: GPS Duplicate Candidate Detection', () => {
  it('accurately computes Haversine geographic distance between coordinates', () => {
    // 2 known points in Shivajinagar Pune (~500m apart)
    const dist = calculateHaversineDistanceMeters(18.5285, 73.8480, 18.5314, 73.8446);
    expect(dist).toBeGreaterThan(400);
    expect(dist).toBeLessThan(600);
  });

  const existingComplaints: Complaint[] = [
    {
      id: 'c-test-1',
      tracking_id: 'FMC-2026-1001',
      title: 'Deep pothole on road',
      description: 'Dangerous crater on road surface near bus stop',
      category: 'ROADS_INFRASTRUCTURE',
      department_id: 'dept-roads',
      citizen_id: 'citizen-1',
      latitude: 18.5285,
      longitude: 73.8480,
      address: 'JM Road, Shivajinagar',
      status: 'PENDING',
      priority: 'MODERATE',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      is_escalated: false,
      image_urls: [],
      supports_count: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'c-test-2',
      tracking_id: 'FMC-2026-1002',
      title: 'Dark streetlight broken bulb',
      description: 'Streetlight pole not functioning',
      category: 'STREET_LIGHTING',
      department_id: 'dept-light',
      citizen_id: 'citizen-2',
      latitude: 18.5286, // Only 15 meters away from the pothole!
      longitude: 73.8481,
      address: 'JM Road, Shivajinagar',
      status: 'PENDING',
      priority: 'MODERATE',
      deadline: new Date(Date.now() + 86400000).toISOString(),
      is_escalated: false,
      image_urls: [],
      supports_count: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  it('detects duplicate candidate for same-category nearby reports (Item 4)', () => {
    const candidates = findDuplicateCandidates(
      {
        latitude: 18.5287, // ~25 meters from c-test-1
        longitude: 73.8481,
        category: 'ROADS_INFRASTRUCTURE',
        title: 'Broken road with pothole',
        description: 'Large crater near bus stop',
      },
      existingComplaints,
      { radiusMeters: 150 }
    );

    expect(candidates.length).toBe(1);
    expect(candidates[0].complaint.id).toBe('c-test-1');
    expect(candidates[0].categoryMatch).toBe(true);
    expect(candidates[0].distanceMeters).toBeLessThan(50);
  });

  it('does NOT merge different nearby issues even if within 15 meters (Item 5)', () => {
    // Reporting a broken streetlight at coordinates right next to the pothole
    const candidates = findDuplicateCandidates(
      {
        latitude: 18.5285,
        longitude: 73.8480,
        category: 'STREET_LIGHTING',
        title: 'Street light out',
        description: 'Dark pole',
      },
      [existingComplaints[0]] // Only the pothole exists
    );

    // Should NOT flag pothole as a duplicate of a streetlight!
    expect(candidates.length).toBe(0);
  });

  it('does not flag issues outside the configurable radius', () => {
    const candidates = findDuplicateCandidates(
      {
        latitude: 18.5580, // Several kilometers away
        longitude: 73.8070,
        category: 'ROADS_INFRASTRUCTURE',
        title: 'Pothole on road',
        description: 'Road crater',
      },
      existingComplaints,
      { radiusMeters: 150 }
    );

    expect(candidates.length).toBe(0);
  });
});
