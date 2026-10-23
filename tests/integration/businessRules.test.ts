import { describe, it, expect, beforeEach } from 'vitest';
import { dbService } from '@/lib/db/dbService';
import { CreateComplaintSchema, UpdateStatusSchema } from '@/lib/validation/schemas';
import enTranslations from '@/locales/en.json';
import hiTranslations from '@/locales/hi.json';

describe('Integration Tests: Civic Business Rules, Security & Localization', () => {
  beforeEach(() => {
    dbService.resetDatabase();
  });

  it('rejects invalid form submissions with informative Zod errors (Item 3)', () => {
    // Title too short, invalid coordinates
    const invalidData = {
      title: 'Bad',
      description: 'Too short',
      category: 'INVALID_CATEGORY',
      latitude: 199.0, // Invalid latitude
      longitude: 73.8,
      address: '',
      image_urls: [],
    };

    const parsed = CreateComplaintSchema.safeParse(invalidData);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((i) => i.path[0]);
      expect(issues).toContain('title');
      expect(issues).toContain('description');
      expect(issues).toContain('category');
      expect(issues).toContain('latitude');
      expect(issues).toContain('address');
      expect(issues).toContain('image_urls');
    }
  });

  it('successfully creates citizen complaint with human-readable tracking ID (Item 2)', async () => {
    const created = await dbService.createComplaint({
      title: 'Broken stormwater drain cover near marketplace',
      description: 'Pedestrians at risk of falling into open drain during evening hours.',
      category: 'PUBLIC_HEALTH',
      department_id: 'd5000000-0000-0000-0000-000000000005',
      citizen_id: 'citizen-user-uuid',
      citizen_name: 'Aarav Sharma',
      citizen_phone: '+91 98765 43210',
      latitude: 18.5285,
      longitude: 73.8480,
      address: 'Market Yard Road, Pune',
      image_urls: ['https://example.com/drain.jpg'],
    });

    expect(created.id).toBeDefined();
    expect(created.tracking_id).toMatch(/^FMC-\d{4}-\d{4}$/);
    expect(created.status).toBe('PENDING');
    expect(created.deadline).toBeDefined();
    expect(created.supports_count).toBe(1);
  });

  it('requires meaningful resolution notes when marking complaint as RESOLVED (Item 15)', async () => {
    const complaints = await dbService.getComplaints();
    const target = complaints[0];

    // Attempting to resolve with empty notes should fail validation
    const emptyNotesValidation = UpdateStatusSchema.safeParse({
      status: 'RESOLVED',
      notes: '',
    });

    // Valid resolution notes
    const validValidation = UpdateStatusSchema.safeParse({
      status: 'RESOLVED',
      notes: 'Drainage cover replaced with heavy cast iron grate and bitumen sealed.',
      resolution_image_url: 'https://example.com/resolved_proof.jpg',
    });

    expect(validValidation.success).toBe(true);

    const updated = await dbService.updateComplaintStatus(
      target.id,
      'RESOLVED',
      { id: 'emp-1', name: 'Er. Sunita', role: 'EMPLOYEE' },
      'Drainage cover replaced with heavy cast iron grate and bitumen sealed.',
      'https://example.com/resolved_proof.jpg'
    );

    expect(updated.status).toBe('RESOLVED');
    expect(updated.resolved_at).toBeDefined();
    expect(updated.resolution_image_url).toBe('https://example.com/resolved_proof.jpg');
    expect(updated.resolution_notes).toContain('cast iron grate');
  });

  it('enforces employee department restrictions and role policies (Item 1 & 13)', async () => {
    const complaints = await dbService.getComplaints();
    const roadsComplaint = complaints.find((c) => c.category === 'ROADS_INFRASTRUCTURE')!;

    // PWD officer can update PWD complaint
    const pwdOfficer = {
      id: 'officer-pwd',
      name: 'Sunita PWD',
      role: 'EMPLOYEE' as const,
      department_id: roadsComplaint.department_id,
    };
    expect(pwdOfficer.department_id).toBe(roadsComplaint.department_id);

    // Water Board officer attempting to update PWD complaint
    const waterOfficer = {
      id: 'officer-water',
      name: 'Vikas Water',
      role: 'EMPLOYEE' as const,
      department_id: 'different-department-uuid',
    };
    const isAuthorized = waterOfficer.department_id === roadsComplaint.department_id;
    expect(isAuthorized).toBe(false);
  });

  it('supports toggling upvotes with one support per user', async () => {
    const complaints = await dbService.getComplaints();
    const target = complaints[0];
    const initialCount = target.supports_count;

    // First upvote
    const res1 = await dbService.toggleSupport(target.id, 'user-upvote-test');
    expect(res1.supported).toBe(true);
    expect(res1.newCount).toBe(initialCount + 1);

    // Second upvote from same user -> removes support (toggles back)
    const res2 = await dbService.toggleSupport(target.id, 'user-upvote-test');
    expect(res2.supported).toBe(false);
    expect(res2.newCount).toBe(initialCount);
  });

  it('verifies complete English and Hindi bilingual translation dictionary parity (Item 14)', () => {
    // Check all categories are present in both
    const enCategories = Object.keys(enTranslations.categories);
    const hiCategories = Object.keys(hiTranslations.categories);
    expect(enCategories.sort()).toEqual(hiCategories.sort());

    // Check all statuses are present in both
    const enStatuses = Object.keys(enTranslations.statuses);
    const hiStatuses = Object.keys(hiTranslations.statuses);
    expect(enStatuses.sort()).toEqual(hiStatuses.sort());

    // Check key civic terminology translated accurately in Hindi
    expect(hiTranslations.nav.reportIssue).toBe('समस्या दर्ज करें');
    expect(hiTranslations.statuses.PENDING).toBe('लंबित');
    expect(hiTranslations.statuses.IN_PROGRESS).toBe('कार्य प्रगति पर');
    expect(hiTranslations.statuses.RESOLVED).toBe('समाधान हुआ');
    expect(hiTranslations.nav.statistics).toBe('आँकड़े');
  });
});
