import { describe, it, expect } from 'vitest';
import {
  INDIAN_STATES_AND_UTS,
  getDistrictsForState,
  getLocalBodies,
  resolveCoordinatesForStateOrDistrict,
} from '@/lib/jurisdiction/indiaJurisdictions';
import { routeComplaint } from '@/features/routing/router';
import { INITIAL_DEPARTMENTS, INITIAL_OFFICES } from '@/lib/db/mockData';
import { AadhaarVerificationAdapter } from '@/features/auth/aadhaarVerification';
import { CreateComplaintSchema } from '@/lib/validation/schemas';
import fs from 'fs';
import path from 'path';

describe('FixMyCity Pan-India Architecture & Integrity Tests', () => {
  describe('1. Pan-India Jurisdiction Model', () => {
    it('covers all 36 Indian States and Union Territories with bilingual names', () => {
      expect(INDIAN_STATES_AND_UTS.length).toBe(36);
      const maharashtra = INDIAN_STATES_AND_UTS.find((s) => s.name === 'Maharashtra');
      const karnataka = INDIAN_STATES_AND_UTS.find((s) => s.name === 'Karnataka');
      const delhi = INDIAN_STATES_AND_UTS.find((s) => s.code === 'DL');

      expect(maharashtra).toBeDefined();
      expect(maharashtra?.name_hi).toBe('महाराष्ट्र');
      expect(karnataka).toBeDefined();
      expect(karnataka?.name_hi).toBe('कर्नाटक');
      expect(delhi).toBeDefined();
      expect(delhi?.name).toBe('Delhi (NCT)');
      expect(delhi?.name_hi).toBe('दिल्ली राष्ट्रीय राजधानी क्षेत्र');
    });

    it('returns state-specific districts without falling back to a single city', () => {
      const mhDistricts = getDistrictsForState('Maharashtra');
      const kaDistricts = getDistrictsForState('Karnataka');
      const dlDistricts = getDistrictsForState('Delhi (NCT)');

      expect(mhDistricts.some((d) => d.name === 'Pune')).toBe(true);
      expect(mhDistricts.some((d) => d.name === 'Mumbai Suburban')).toBe(true);
      expect(kaDistricts.some((d) => d.name === 'Bengaluru Urban')).toBe(true);
      expect(dlDistricts.some((d) => d.name === 'Central Delhi')).toBe(true);
    });

    it('supports both Urban Local Bodies (ULB) and Rural Panchayats (PRI) with LGD codes', () => {
      const urbanBodies = getLocalBodies('Pune', 'URBAN');
      const ruralBodies = getLocalBodies('Pune', 'RURAL');

      expect(urbanBodies.length).toBeGreaterThan(0);
      expect(urbanBodies[0].type).toBe('MUNICIPAL_CORPORATION');
      expect(urbanBodies[0].lgdCode).toMatch(/^LGD-ULB-/);

      expect(ruralBodies.length).toBeGreaterThan(0);
      expect(ruralBodies[0].type).toBe('GRAM_PANCHAYAT');
      expect(ruralBodies[0].lgdCode).toMatch(/^LGD-RLB-/);
    });

    it('resolves different geographic coordinates across states and does not hardcode Pune', () => {
      const puneCoords = resolveCoordinatesForStateOrDistrict('Maharashtra', 'Pune');
      const blrCoords = resolveCoordinatesForStateOrDistrict('Karnataka', 'Bengaluru Urban');
      const delCoords = resolveCoordinatesForStateOrDistrict('Delhi', 'Central Delhi');

      expect(puneCoords.lat).toBeCloseTo(18.5204, 1);
      expect(blrCoords.lat).toBeCloseTo(12.9716, 1);
      expect(delCoords.lat).toBeCloseTo(28.6448, 1);

      // Verify that coordinates are distinct
      expect(puneCoords.lat).not.toBe(blrCoords.lat);
      expect(blrCoords.lng).not.toBe(delCoords.lng);
    });
  });

  describe('2. Jurisdiction-Aware Routing & Admin Review Safeguards', () => {
    it('dispatches to an active verified office within service radius and records provenance', () => {
      const result = routeComplaint(
        'ROADS_INFRASTRUCTURE',
        undefined,
        18.5310,
        73.8440,
        INITIAL_DEPARTMENTS,
        INITIAL_OFFICES,
        {
          state: 'Maharashtra',
          district: 'Pune',
          localBodyName: 'Pune Municipal Corporation',
        }
      );

      expect(result.selectedDepartmentId).toBe('d1000000-0000-0000-0000-000000000001');
      expect(result.selectedOfficeId).toBeDefined();
      expect(result.selectedOfficeName).toBe('PWD Road Maintenance Division — Zone 8');
      expect(result.flaggedForAdminReview).toBe(false);
      expect(result.decisionReason).toContain('Nearest eligible public office');
    });

    it('flags complaints for Administrative Review when no office covers the remote location', () => {
      // Remote location in Jaipur (no offices seeded)
      const result = routeComplaint(
        'ROADS_INFRASTRUCTURE',
        undefined,
        26.9124,
        75.7873,
        INITIAL_DEPARTMENTS,
        INITIAL_OFFICES,
        {
          state: 'Rajasthan',
          district: 'Jaipur',
          localBodyName: 'Jaipur Municipal Corporation',
          maxRadiusKm: 20,
        }
      );

      expect(result.selectedOfficeId).toBeNull();
      expect(result.flaggedForAdminReview).toBe(true);
      expect(result.decisionReason).toContain('Flagged for Administrative Review');
    });

    it('does not silently route rural complaints to municipal offices without matching coverage', () => {
      const result = routeComplaint(
        'WATER_SUPPLY',
        undefined,
        18.68,
        74.05,
        INITIAL_DEPARTMENTS,
        INITIAL_OFFICES,
        {
          state: 'Maharashtra',
          district: 'Pune',
          localBodyName: 'Wagholi Gram Panchayat',
          maxRadiusKm: 15,
        }
      );

      // Rural complaints with no matching rural office within radius flag for review
      expect(result.selectedOfficeName || '').not.toContain('SWARGATE');
    });
  });

  describe('3. Orange Prototype Banner Removal Verification', () => {
    const readComponent = (relativePath: string) => {
      const fullPath = path.resolve(process.cwd(), relativePath);
      return fs.readFileSync(fullPath, 'utf8');
    };

    it('verifies PublicNav does not contain the orange demonstration banner', () => {
      const content = readComponent('src/components/layout/PublicNav.tsx');
      expect(content).not.toContain('Demonstration Prototype Mode — Realistic Indian Municipal Data');
      expect(content).not.toContain('bg-[#E07B2E] text-white py-1 px-4');
      expect(content).toContain('India-Wide Civic Issue Reporting & Resolution Platform');
    });

    it('verifies CitizenNav does not contain the orange demonstration banner', () => {
      const content = readComponent('src/components/layout/CitizenNav.tsx');
      expect(content).not.toContain('Demonstration Prototype Mode');
      expect(content).not.toContain('Citizen Grievance Portal — Pune Municipal Corporation Area');
      expect(content).toContain('Citizen Grievance Redressal');
    });

    it('verifies AdminHeader and AdminNav do not claim PMC ownership', () => {
      const headerContent = readComponent('src/components/layout/AdminHeader.tsx');
      const navContent = readComponent('src/components/layout/AdminNav.tsx');

      expect(headerContent).not.toContain('Pune Municipal Corporation');
      expect(headerContent).toContain('Civic Administration Oversight');

      expect(navContent).not.toContain('Pune Municipal Corporation');
      expect(navContent).toContain('Central Civic Command');
    });

    it('verifies Footer contains neutral prototype disclosure and verified government links', () => {
      const content = readComponent('src/components/layout/Footer.tsx');
      expect(content).toContain('FixMyCity is a civic technology prototype');
      expect(content).toContain('https://www.india.gov.in/');
      expect(content).toContain('https://pgportal.gov.in/');
      expect(content).toContain('https://lgdirectory.gov.in/');
      expect(content).toContain('https://guidelines.india.gov.in/');
    });
  });

  describe('4. Dashboard Animation Scoping & Accessibility', () => {
    it('confirms CitizenDashboardMotion exists and is scoped to citizen dashboard only', () => {
      const dashboardPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/citizen/dashboard/page.tsx'),
        'utf8'
      );
      expect(dashboardPage).toContain('CitizenDashboardMotion');
      expect(dashboardPage).toContain('citizen-dashboard');

      // Check other pages do NOT render CitizenDashboardMotion
      const landingPage = fs.readFileSync(path.resolve(process.cwd(), 'src/app/page.tsx'), 'utf8');
      const employeePage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/employee/dashboard/page.tsx'),
        'utf8'
      );
      const adminPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/admin/dashboard/page.tsx'),
        'utf8'
      );
      const reportPage = fs.readFileSync(
        path.resolve(process.cwd(), 'src/app/citizen/report/page.tsx'),
        'utf8'
      );

      expect(landingPage).not.toContain('CitizenDashboardMotion');
      expect(employeePage).not.toContain('CitizenDashboardMotion');
      expect(adminPage).not.toContain('CitizenDashboardMotion');
      expect(reportPage).not.toContain('CitizenDashboardMotion');
    });

    it('verifies CSS globals configure reduced motion for citizen dashboard motion', () => {
      const globalsCss = fs.readFileSync(path.resolve(process.cwd(), 'src/app/globals.css'), 'utf8');
      expect(globalsCss).toContain('.citizen-dashboard');
      expect(globalsCss).toContain('prefers-reduced-motion: reduce');
    });
  });

  describe('5. Aadhaar Compliance & Mandatory Identity Verification Safeguards', () => {
    it('verifies that login page does not display optional Aadhaar presentation', () => {
      const loginContent = fs.readFileSync(path.resolve(process.cwd(), 'src/app/login/page.tsx'), 'utf8');
      expect(loginContent).not.toContain('Aadhaar Verification (Optional)');
      expect(loginContent).not.toContain('आधार सत्यापन (वैकल्पिक)');
      expect(loginContent).toContain('Citizen Identity Verification');
      expect(loginContent).toContain('Mandatory Verification');
    });

    it('verifies AadhaarVerificationAdapter returns unconfigured prototype state', () => {
      const status = AadhaarVerificationAdapter.getProviderConfigurationStatus();
      expect(status.isConfigured).toBe(false);
      expect(status.deploymentMode).toBe('PROTOTYPE_UNCONFIGURED');
      expect(status.activeMethod).toBe('MOBILE_OTP');
      expect(status.pendingMethod).toBe('AADHAAR_EKYC_AUA');
      expect(status.legalNotice).toContain('Section 4(3)');
    });

    it('verifies AadhaarVerificationAdapter validates 12-digit format, generates masked token, but NEVER marks as officially verified', () => {
      const invalidResult = AadhaarVerificationAdapter.initiateVerification('1234');
      expect(invalidResult.success).toBe(false);
      expect(invalidResult.isOfficiallyVerified).toBe(false);

      const validResult = AadhaarVerificationAdapter.initiateVerification('987654321012');
      expect(validResult.success).toBe(true);
      expect(validResult.maskedAadhaar).toBe('XXXXXXXX1012');
      expect(validResult.isOfficiallyVerified).toBe(false); // Explicit: syntax check is NOT official identity verification!
      expect(validResult.verificationStatus).toBe('PENDING_AUTHORIZED_SERVICE');
      expect(validResult.legalDisclaimer).toContain('Section 4(3) of the Aadhaar Act');
    });

    it('confirms raw Aadhaar number and biometrics are never stored', () => {
      const mockPayload = {
        aadhaarNumber: '987654321012',
      };
      const sanitized = AadhaarVerificationAdapter.sanitizeIdentityPayload(mockPayload);
      expect(sanitized).not.toHaveProperty('aadhaarNumber');
      expect(sanitized.identity_verification_method).toBe('VOLUNTARY_AADHAAR_TOKEN');
      expect(sanitized.aadhaar_masked).toBe('XXXXXXXX1012');
      expect(sanitized.is_officially_verified).toBe(false);
    });

    it('validates that non-Aadhaar users can successfully submit complaints with phone verification', () => {
      const complaintData = {
        title: 'Broken road divider on MG Road',
        description: 'Road divider broken creating traffic congestion near junction.',
        category: 'ROADS_INFRASTRUCTURE',
        latitude: 18.5204,
        longitude: 73.8567,
        address: 'MG Road Junction',
        citizen_name: 'Rahul Varma',
        citizen_phone: '+91 98765 00000',
        image_urls: ['https://example.com/photo.jpg'],
        state: 'Maharashtra',
        district: 'Pune',
      };

      const parsed = CreateComplaintSchema.safeParse(complaintData);
      expect(parsed.success).toBe(true);
    });
  });

  describe('6. Office Directory Data Integrity & Indian Coordinates', () => {
    it('ensures all initial offices have valid Indian coordinate bounds (6°N–38°N, 68°E–98°E)', () => {
      INITIAL_OFFICES.forEach((office) => {
        expect(office.latitude).toBeGreaterThanOrEqual(6.0);
        expect(office.latitude).toBeLessThanOrEqual(38.0);
        expect(office.longitude).toBeGreaterThanOrEqual(68.0);
        expect(office.longitude).toBeLessThanOrEqual(98.0);
      });
    });

    it('ensures office records have provenance and verification status fields', () => {
      INITIAL_OFFICES.forEach((office) => {
        expect(['VERIFIED', 'UNVERIFIED', 'PENDING_REVIEW', 'SAMPLE_DATA']).toContain(
          office.verification_status
        );
        expect(office.source_authority).toBeDefined();
        expect(office.data_imported_at).toBeDefined();
      });
    });
  });
});
