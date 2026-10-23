import { describe, it, expect } from 'vitest';
import { routeComplaint } from '@/features/routing/router';
import { Department, DepartmentOffice } from '@/types';

describe('Core Algorithm 3: Smart Department Routing & Dynamic Radius Expansion', () => {
  const departments: Department[] = [
    {
      id: 'dept-roads',
      code: 'DEPT-ROADS',
      name: 'Public Works Dept',
      name_hi: 'लोक निर्माण विभाग',
      description: 'Roads & Infrastructure',
      categories: ['ROADS_INFRASTRUCTURE'],
      contact_email: 'roads@demo.in',
      helpline: '101',
      active: true,
    },
    {
      id: 'dept-water',
      code: 'DEPT-WATER',
      name: 'Water Supply Board',
      name_hi: 'जल आपूर्ति बोर्ड',
      description: 'Water Supply',
      categories: ['WATER_SUPPLY'],
      contact_email: 'water@demo.in',
      helpline: '102',
      active: true,
    },
  ];

  const offices: DepartmentOffice[] = [
    {
      id: 'office-roads-close',
      department_id: 'dept-roads',
      office_name: 'Shivajinagar Road Office',
      office_code: 'ROADS-SHIVAJI',
      address: 'Shivajinagar, Pune',
      latitude: 18.5300,
      longitude: 73.8450,
      service_radius_km: 5.0,
      jurisdiction_area: 'Shivajinagar',
      phone: '111',
      contact_person: 'Officer A',
      active: true,
    },
    {
      id: 'office-roads-far',
      department_id: 'dept-roads',
      office_name: 'Hadapsar Road Office',
      office_code: 'ROADS-HADAPSAR',
      address: 'Hadapsar, Pune',
      latitude: 18.5089, // ~9km away
      longitude: 73.9260,
      service_radius_km: 10.0,
      jurisdiction_area: 'Hadapsar',
      phone: '222',
      contact_person: 'Officer B',
      active: true,
    },
    {
      id: 'office-water-distant',
      department_id: 'dept-water',
      office_name: 'Distant Water Unit',
      office_code: 'WATER-DISTANT',
      address: 'Outer Ring, Pune',
      latitude: 18.6500, // ~15km away
      longitude: 73.8000,
      service_radius_km: 20.0,
      jurisdiction_area: 'Outer',
      phone: '333',
      contact_person: 'Officer C',
      active: true,
    },
  ];

  it('matches correct category to department (Item 6)', () => {
    const decision = routeComplaint(
      'ROADS_INFRASTRUCTURE',
      undefined,
      18.5285,
      73.8480,
      departments,
      offices
    );
    expect(decision.selectedDepartmentId).toBe('dept-roads');
    expect(decision.selectedDepartmentName).toBe('Public Works Dept');
  });

  it('selects the nearest eligible office geographically (Item 7)', () => {
    const decision = routeComplaint(
      'ROADS_INFRASTRUCTURE',
      undefined,
      18.5285,
      73.8480, // Near Shivajinagar
      departments,
      offices,
      { initialRadiusKm: 5 }
    );

    expect(decision.selectedOfficeId).toBe('office-roads-close');
    expect(decision.expansionSteps).toBe(0);
    expect(decision.distanceKm).toBeLessThan(2.0);
  });

  it('dynamically expands search radius when no office is within initial radius (Item 8)', () => {
    // Water complaint reported at Shivajinagar, but the only water office is ~15km away
    const decision = routeComplaint(
      'WATER_SUPPLY',
      undefined,
      18.5285,
      73.8480,
      departments,
      offices,
      { initialRadiusKm: 5, expansionStepKm: 5, maxRadiusKm: 30 }
    );

    // Initial 5km had no office, so it expanded in 5km steps up to 15-20km
    expect(decision.selectedOfficeId).toBe('office-water-distant');
    expect(decision.expansionSteps).toBeGreaterThanOrEqual(2);
    expect(decision.expandedRadiusKm).toBeGreaterThan(decision.initialRadiusKm);
    expect(decision.flaggedForAdminReview).toBe(false);
  });

  it('flags complaint for administrative review when no eligible department exists (Item 9)', () => {
    // Category not handled by any department in this test dataset
    const decision = routeComplaint(
      'SAFETY_GOVERNANCE',
      undefined,
      18.5285,
      73.8480,
      departments,
      offices
    );

    expect(decision.flaggedForAdminReview).toBe(true);
    expect(decision.selectedOfficeId).toBeNull();
    expect(decision.decisionReason).toContain('Flagged for administrative');
  });
});
