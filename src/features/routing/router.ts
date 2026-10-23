import { Department, DepartmentOffice, CivicCategory } from '@/types';
import { calculateHaversineDistanceMeters } from '@/features/duplicate-detection/duplicateDetector';

export interface RoutingOptions {
  initialRadiusKm?: number;  // default 5km
  expansionStepKm?: number;  // default 5km
  maxRadiusKm?: number;      // default 50km
  state?: string;
  district?: string;
  localBodyName?: string;
  preferVerified?: boolean;
}

export interface RoutingDecision {
  selectedDepartmentId: string;
  selectedDepartmentName: string;
  selectedOfficeId: string | null;
  selectedOfficeName: string | null;
  distanceKm: number;
  initialRadiusKm: number;
  expandedRadiusKm: number;
  expansionSteps: number;
  decisionReason: string;
  flaggedForAdminReview: boolean;
  matchedJurisdiction?: string;
  isOfficeVerified?: boolean;
}

/**
 * Smart Department Routing Service.
 * Matches civic category, coordinates, and Pan-India jurisdiction hierarchy to the nearest
 * active eligible public department office, dynamically expanding the geographic perimeter if necessary.
 */
export function routeComplaint(
  category: CivicCategory,
  userSelectedDepartmentId: string | undefined,
  latitude: number,
  longitude: number,
  departments: Department[],
  offices: DepartmentOffice[],
  options: RoutingOptions = {}
): RoutingDecision {
  const initialRadiusKm = options.initialRadiusKm ?? 5;
  const expansionStepKm = options.expansionStepKm ?? 5;
  const maxRadiusKm = options.maxRadiusKm ?? 50;
  const preferVerified = options.preferVerified ?? true;

  // Step 1: Identify eligible active departments for this category
  let eligibleDepartments = departments.filter(
    (dept) => dept.active && dept.categories.includes(category)
  );

  // If user selected a specific department, verify if it handles this category
  if (userSelectedDepartmentId) {
    const userSelected = eligibleDepartments.find(
      (dept) => dept.id === userSelectedDepartmentId
    );
    if (userSelected) {
      eligibleDepartments = [userSelected];
    }
  }

  // If no departments handle this category at all
  if (eligibleDepartments.length === 0) {
    return {
      selectedDepartmentId: '',
      selectedDepartmentName: 'Unassigned',
      selectedOfficeId: null,
      selectedOfficeName: null,
      distanceKm: 0,
      initialRadiusKm,
      expandedRadiusKm: initialRadiusKm,
      expansionSteps: 0,
      decisionReason: `No active public service department is registered for category "${category}". Flagged for administrative assignment.`,
      flaggedForAdminReview: true,
      isOfficeVerified: false,
    };
  }

  const eligibleDeptIds = new Set(eligibleDepartments.map((d) => d.id));

  // Step 2: Filter active offices belonging to eligible departments
  let eligibleOffices = offices.filter(
    (office) => office.active && eligibleDeptIds.has(office.department_id)
  );

  // Jurisdiction-aware filtering: If state or district is specified, prioritize matching offices
  if (options.district || options.state) {
    const jurisdictionMatchedOffices = eligibleOffices.filter((office) => {
      const matchDistrict = options.district && office.district &&
        office.district.toLowerCase() === options.district.toLowerCase();
      const matchState = options.state && office.state &&
        office.state.toLowerCase() === options.state.toLowerCase();
      const matchLocalBody = options.localBodyName && office.local_body_name &&
        office.local_body_name.toLowerCase() === options.localBodyName.toLowerCase();
      return matchLocalBody || matchDistrict || matchState;
    });

    if (jurisdictionMatchedOffices.length > 0) {
      eligibleOffices = jurisdictionMatchedOffices;
    }
  }

  if (eligibleOffices.length === 0) {
    return {
      selectedDepartmentId: eligibleDepartments[0].id,
      selectedDepartmentName: eligibleDepartments[0].name,
      selectedOfficeId: null,
      selectedOfficeName: null,
      distanceKm: 0,
      initialRadiusKm,
      expandedRadiusKm: initialRadiusKm,
      expansionSteps: 0,
      decisionReason: `Eligible department "${eligibleDepartments[0].name}" has no registered local offices in this jurisdiction. Flagged for Administrative Review.`,
      flaggedForAdminReview: true,
      isOfficeVerified: false,
    };
  }

  // Calculate distances for all eligible offices
  const officesWithDistances = eligibleOffices.map((office) => {
    const meters = calculateHaversineDistanceMeters(
      latitude,
      longitude,
      office.latitude,
      office.longitude
    );
    const distanceKm = parseFloat((meters / 1000).toFixed(2));
    const dept = eligibleDepartments.find((d) => d.id === office.department_id);
    const isVerified = office.verification_status === 'VERIFIED';
    return {
      office,
      department: dept!,
      distanceKm,
      isVerified,
    };
  });

  // Step 3: Dynamic Radius Expansion Loop
  let currentRadius = initialRadiusKm;
  let expansionSteps = 0;

  while (currentRadius <= maxRadiusKm) {
    const inRange = officesWithDistances.filter(
      (item) => item.distanceKm <= currentRadius
    );

    if (inRange.length > 0) {
      // Sort primarily by verification status if preferVerified, then by distance
      inRange.sort((a, b) => {
        if (preferVerified && a.isVerified !== b.isVerified) {
          return a.isVerified ? -1 : 1;
        }
        return a.distanceKm - b.distanceKm;
      });

      const best = inRange[0];
      const jurisdictionTag = best.office.local_body_name || best.office.district || 'Local Authority';

      let reason = `Nearest eligible public office (${best.office.office_name} - ${jurisdictionTag}) located ${best.distanceKm} km away.`;
      if (best.isVerified) {
        reason += ' (Official data verified).';
      } else {
        reason += ' (Office contact data pending administrative verification).';
      }

      if (expansionSteps > 0) {
        reason += ` Dispatched after ${expansionSteps} dynamic perimeter expansion steps (${initialRadiusKm} km → ${currentRadius} km).`;
      }

      return {
        selectedDepartmentId: best.department.id,
        selectedDepartmentName: best.department.name,
        selectedOfficeId: best.office.id,
        selectedOfficeName: best.office.office_name,
        distanceKm: best.distanceKm,
        initialRadiusKm,
        expandedRadiusKm: currentRadius,
        expansionSteps,
        decisionReason: reason,
        flaggedForAdminReview: !best.isVerified && best.distanceKm > (best.office.service_radius_km || 15),
        matchedJurisdiction: jurisdictionTag,
        isOfficeVerified: best.isVerified,
      };
    }

    currentRadius += expansionStepKm;
    expansionSteps++;
  }

  // Step 4: No office found even after reaching maxRadiusKm
  // Select department but flag for administrative review instead of silently misrouting
  const defaultDept = eligibleDepartments[0];
  return {
    selectedDepartmentId: defaultDept.id,
    selectedDepartmentName: defaultDept.name,
    selectedOfficeId: null,
    selectedOfficeName: null,
    distanceKm: 0,
    initialRadiusKm,
    expandedRadiusKm: maxRadiusKm,
    expansionSteps,
    decisionReason: `No eligible public service office located within maximum radius of ${maxRadiusKm} km. Flagged for Administrative Review.`,
    flaggedForAdminReview: true,
    isOfficeVerified: false,
  };
}
