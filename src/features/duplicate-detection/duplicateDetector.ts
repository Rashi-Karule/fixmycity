import { Complaint, DuplicateCandidate, CivicCategory } from '@/types';

export interface DuplicateDetectionOptions {
  radiusMeters?: number;          // Default 150m
  minSimilarityThreshold?: number; // 0.0 - 1.0 (default 0.5)
  maxCandidates?: number;         // Default 3
}

/**
 * Calculates geodesic distance between two GPS coordinates in meters using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Computes Jaccard word-token similarity between two text strings.
 */
export function calculateTextSimilarity(text1: string, text2: string): number {
  const tokenize = (s: string) => {
    return new Set(
      (s || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((word) => word.length > 2)
    );
  };

  const tokens1 = tokenize(text1);
  const tokens2 = tokenize(text2);

  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of tokens1) {
    if (tokens2.has(token)) {
      intersectionCount++;
    }
  }

  const unionCount = tokens1.size + tokens2.size - intersectionCount;
  return unionCount === 0 ? 0 : intersectionCount / unionCount;
}

/**
 * Finds potential duplicate complaints based on geographic proximity,
 * category alignment, and text similarity.
 */
export function findDuplicateCandidates(
  newReport: {
    latitude: number;
    longitude: number;
    category: CivicCategory;
    title: string;
    description: string;
  },
  existingComplaints: Complaint[],
  options: DuplicateDetectionOptions = {}
): DuplicateCandidate[] {
  const radiusMeters = options.radiusMeters ?? 150;
  const minThreshold = options.minSimilarityThreshold ?? 0.45;
  const maxCandidates = options.maxCandidates ?? 3;

  const candidates: DuplicateCandidate[] = [];

  // Filter only active complaints (unresolved / under review)
  const activeExisting = existingComplaints.filter(
    (c) => c.status !== 'RESOLVED' && c.status !== 'REJECTED'
  );

  for (const existing of activeExisting) {
    const distance = calculateHaversineDistanceMeters(
      newReport.latitude,
      newReport.longitude,
      existing.latitude,
      existing.longitude
    );

    // If outside maximum radius threshold, immediately skip
    if (distance > radiusMeters) {
      continue;
    }

    const categoryMatch = existing.category === newReport.category;

    // Different categories in the same location (e.g. pothole next to streetlight) are NOT duplicates!
    if (!categoryMatch) {
      continue;
    }

    // Distance score: 1.0 at 0m, decaying to 0.0 at radiusMeters
    const distanceScore = Math.max(0, 1 - distance / radiusMeters);

    // Text similarity
    const textSim = calculateTextSimilarity(
      `${newReport.title} ${newReport.description}`,
      `${existing.title} ${existing.description}`
    );

    // Composite similarity score
    // Category match is 40% weight, distance is 40% weight, text similarity is 20% weight
    const compositeScore = (categoryMatch ? 0.4 : 0) + (distanceScore * 0.4) + (textSim * 0.2);

    const reasons: string[] = [];
    reasons.push(`Located ${distance}m away within ${radiusMeters}m search perimeter`);
    reasons.push(`Identical civic category (${existing.category})`);
    if (textSim > 0.15) {
      reasons.push(`Description tokens match ${(textSim * 100).toFixed(0)}%`);
    }

    if (compositeScore >= minThreshold) {
      candidates.push({
        complaint: existing,
        distanceMeters: distance,
        categoryMatch,
        similarityScore: parseFloat(compositeScore.toFixed(2)),
        reasons,
      });
    }
  }

  // Sort candidates by similarity score descending
  candidates.sort((a, b) => b.similarityScore - a.similarityScore);
  return candidates.slice(0, maxCandidates);
}
