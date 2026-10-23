import { Department, DepartmentOffice, CivicCategory } from '@/types';
import { calculateHaversineDistanceMeters } from '@/features/duplicate-detection/duplicateDetector';

export interface RoutingOptions {
  initialRadiusKm?: number;  // default 5km
  expansionStepKm?: number;  // default 5km
  maxRadiusKm?: number;      // default 50km
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
}

/**
 * Smart Department Routing Service.
 * Matches civic category and coordinates to the nearest active eligible municipal department office,
 * dynamically expanding the geographic perimeter if necessary.
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

  // Step 1: Identify eligible active departments for this category
  let eligibleDepartments = departments.filter(
    (dept) => dept.active && dept.categories.includes(category)
  );

  // If user selected a specific department, verify if it's eligible
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
      decisionReason: `No active municipal department is registered to handle category "${category}". Flagged for administrative assignment.`,
      flaggedForAdminReview: true,
    };
  }

  const eligibleDeptIds = new Set(eligibleDepartments.map((d) => d.id));

  // Step 2: Filter active offices belonging to eligible departments
  const eligibleOffices = offices.filter(
    (office) => office.active && eligibleDeptIds.has(office.department_id)
  );

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
      decisionReason: `Eligible department "${eligibleDepartments[0].name}" has no registered active local offices. Routed to department head for manual review.`,
      flaggedForAdminReview: true,
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
    return {
      office,
      department: dept!,
      distanceKm,
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
      // Pick the closest eligible office
      inRange.sort((a, b) => a.distanceKm - b.distanceKm);
      const best = inRange[0];

      let reason = `Nearest eligible municipal office (${best.office.office_name}) located ${best.distanceKm} km away.`;
      if (expansionSteps > 0) {
        reason += ` (Dispatched after ${expansionSteps} dynamic radius expansion steps from ${initialRadiusKm} km to ${currentRadius} km).`;
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
        flaggedForAdminReview: false,
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
    decisionReason: `No eligible office found within maximum radius of ${maxRadiusKm} km. Flagged for Administrative Review.`,
    flaggedForAdminReview: true,
  };
}
