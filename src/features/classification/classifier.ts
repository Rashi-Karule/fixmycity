import { CivicCategory } from '@/types';

export interface ClassificationResult {
  suggestedCategory: CivicCategory;
  confidence: number;
  explanation: string;
  detectedKeywords: string[];
  isAiAssisted: boolean;
}

const CATEGORY_KEYWORDS: Record<CivicCategory, string[]> = {
  ROADS_INFRASTRUCTURE: [
    'pothole', 'potholes', 'crater', 'road', 'asphalt', 'tar', 'bitumen', 'footpath',
    'pavement', 'divider', 'bridge', 'flyover', 'sinkhole', 'broken road', 'gaddha', 'sadak'
  ],
  WASTE_MANAGEMENT: [
    'garbage', 'waste', 'trash', 'debris', 'dump', 'dustbin', 'litter', 'plastic',
    'kachra', 'safai', 'overflowing bin', 'decaying', 'rotting', 'garbage pile'
  ],
  WATER_SUPPLY: [
    'leakage', 'leak', 'water pipe', 'burst pipe', 'water supply', 'no water', 'contaminated water',
    'pipeline', 'drainage overflow', 'low pressure', 'sewage water', 'pani'
  ],
  STREET_LIGHTING: [
    'street light', 'streetlight', 'lamp', 'dark street', 'pole', 'bulb', 'lighting',
    'flickering', 'no light', 'electric pole', 'wire hanging', 'andhera', 'bijli'
  ],
  TRAFFIC_TRANSPORT: [
    'traffic', 'signal', 'traffic light', 'zebra crossing', 'bus stop', 'congestion',
    'parking', 'illegal parking', 'speed breaker', 'signboard'
  ],
  ENVIRONMENT_POLLUTION: [
    'pollution', 'smoke', 'burning', 'air pollution', 'noise', 'chemical', 'dust',
    'toxic', 'tree fallen', 'deforestation', 'industrial waste'
  ],
  PUBLIC_HEALTH: [
    'mosquito', 'dengue', 'malaria', 'stagnant water', 'foul smell', 'health hazard',
    'open defecation', 'sanitation', 'dead animal', 'pest'
  ],
  SAFETY_GOVERNANCE: [
    'open manhole', 'manhole cover missing', 'collapse risk', 'fire hazard', 'illegal construction',
    'encroachment', 'unauthorized', 'safety hazard', 'danger'
  ],
};

/**
 * Modular Civic Issue Classifier.
 * Uses an honest, transparent heuristic token & semantic keyword analyzer as the baseline,
 * structured with an extensible interface for plugging in deep-learning vision models.
 */
export async function classifyIssue(
  titleAndDescription: string,
  imageMetadata?: { filename?: string; mimeType?: string; sizeBytes?: number }
): Promise<ClassificationResult> {
  const normalizedText = (titleAndDescription || '').toLowerCase();
  
  // Keyword scoring
  const scores: Record<CivicCategory, { score: number; matches: string[] }> = {
    ROADS_INFRASTRUCTURE: { score: 0, matches: [] },
    WASTE_MANAGEMENT: { score: 0, matches: [] },
    WATER_SUPPLY: { score: 0, matches: [] },
    STREET_LIGHTING: { score: 0, matches: [] },
    TRAFFIC_TRANSPORT: { score: 0, matches: [] },
    ENVIRONMENT_POLLUTION: { score: 0, matches: [] },
    PUBLIC_HEALTH: { score: 0, matches: [] },
    SAFETY_GOVERNANCE: { score: 0, matches: [] },
  };

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CivicCategory, string[]][]) {
    for (const kw of keywords) {
      if (normalizedText.includes(kw)) {
        scores[category].score += 2;
        scores[category].matches.push(kw);
      }
    }
  }

  // Check filename hints if provided (e.g. "pothole_photo.jpg")
  if (imageMetadata?.filename) {
    const fname = imageMetadata.filename.toLowerCase();
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [CivicCategory, string[]][]) {
      for (const kw of keywords) {
        if (fname.includes(kw)) {
          scores[category].score += 1.5;
          if (!scores[category].matches.includes(kw)) {
            scores[category].matches.push(kw);
          }
        }
      }
    }
  }

  // Find category with highest score
  let bestCategory: CivicCategory = 'ROADS_INFRASTRUCTURE';
  let maxScore = 0;
  let detectedMatches: string[] = [];

  for (const [cat, data] of Object.entries(scores) as [CivicCategory, { score: number; matches: string[] }][]) {
    if (data.score > maxScore) {
      maxScore = data.score;
      bestCategory = cat;
      detectedMatches = data.matches;
    }
  }

  if (maxScore > 0) {
    const confidence = Math.min(0.95, 0.55 + maxScore * 0.1);
    return {
      suggestedCategory: bestCategory,
      confidence: parseFloat(confidence.toFixed(2)),
      explanation: `Detected civic keywords: ${detectedMatches.slice(0, 3).join(', ')}`,
      detectedKeywords: detectedMatches,
      isAiAssisted: true,
    };
  }

  // Fallback if no keywords matched
  return {
    suggestedCategory: 'ROADS_INFRASTRUCTURE',
    confidence: 0.35,
    explanation: 'No specific civic keywords identified. Manual category selection recommended.',
    detectedKeywords: [],
    isAiAssisted: false,
  };
}
