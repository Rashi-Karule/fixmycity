import { CivicCategory } from '@/types';
import { classifyIssue } from './classifier';

export interface ImageAnalysisRequest {
  imageBase64?: string;
  mimeType?: string;
  filename?: string;
  userHint?: string;
}

export interface ImageAnalysisResult {
  isModelConfigured: boolean;
  modelProvider: string;
  suggestedCategory: CivicCategory;
  suggestedTitle: string;
  suggestedDescription: string;
  confidence?: number;
  detectedElements: string[];
  analysisNotice: string;
  isAiAssisted: boolean;
}

const VALID_CATEGORIES: CivicCategory[] = [
  'ROADS_INFRASTRUCTURE',
  'WASTE_MANAGEMENT',
  'WATER_SUPPLY',
  'STREET_LIGHTING',
  'TRAFFIC_TRANSPORT',
  'ENVIRONMENT_POLLUTION',
  'PUBLIC_HEALTH',
  'SAFETY_GOVERNANCE',
];

/**
 * Robust JSON parser for Gemini responses that handles markdown code fences
 * and unstructured text wrapping.
 */
function parseGeminiJsonResponse(rawText: string): any {
  let cleaned = rawText.trim();
  // Strip markdown code fences if present (e.g. ```json ... ```)
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-z]*\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Fallback: extract substring between first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    }
    throw new Error('Unable to extract valid JSON from Gemini output.');
  }
}

/**
 * Executes a single generateContent call to Gemini REST API with timeout.
 */
async function callGeminiApi(
  modelId: string,
  apiKey: string,
  promptText: string,
  mimeType: string,
  cleanBase64: string,
  timeoutMs: number = 12000
): Promise<{ ok: boolean; status: number; statusText: string; json?: any; errorText?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Official Google Gemini REST endpoint
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: promptText },
              {
                inlineData: {
                  mimeType,
                  data: cleanBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      return {
        ok: false,
        status: response.status,
        statusText: response.statusText,
        errorText,
      };
    }

    const json = await response.json();
    return {
      ok: true,
      status: response.status,
      statusText: response.statusText,
      json,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Modular Image Classification Service.
 * Inspects server environment for configured Vision AI model (e.g. GEMINI_API_KEY / VISION_AI_API_KEY).
 * If configured, executes multimodal vision analysis using gemini-3.8-flash.
 * If not configured or if API fails, transparently reports fallback state without inventing fake CNN confidence.
 */
export async function analyzeCivicImage(
  request: ImageAnalysisRequest
): Promise<ImageAnalysisResult> {
  const visionApiKey = (process.env.GEMINI_API_KEY || process.env.VISION_AI_API_KEY || '').trim();
  const configuredModel = (process.env.GEMINI_MODEL || 'gemini-3.8-flash').trim();

  // 1. Genuine Vision Model Execution (When configured via server environment)
  if (visionApiKey && request.imageBase64) {
    try {
      const cleanBase64 = request.imageBase64.includes('base64,')
        ? request.imageBase64.split('base64,')[1].trim()
        : request.imageBase64.trim();

      // Normalize MIME type
      let mimeType = (request.mimeType || 'image/jpeg').toLowerCase().trim();
      if (mimeType === 'image/jpg') mimeType = 'image/jpeg';
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(mimeType)) {
        mimeType = 'image/jpeg';
      }

      const promptText = `
You are an expert municipal civic issue analyzer for the FixMyCity civic governance platform.
Analyze this photo of a municipal or public infrastructure problem.
Identify civic issues such as potholes, road craters, garbage heaps, broken streetlights, drainage blockages, open manholes, or water pipeline leakages.

Return ONLY a valid, raw JSON object with the following fields:
- "category": Must be EXACTLY one of:
  "ROADS_INFRASTRUCTURE", "WASTE_MANAGEMENT", "WATER_SUPPLY", "STREET_LIGHTING",
  "TRAFFIC_TRANSPORT", "ENVIRONMENT_POLLUTION", "PUBLIC_HEALTH", "SAFETY_GOVERNANCE"
- "title": Concise factual headline (5 to 10 words, describing only visible objects, e.g., "Deep pothole on asphalt roadway", "Overflowing municipal garbage container", "Water pipeline burst on public footpath")
- "description": Concise factual summary of visible conditions (max 35 words, e.g., "Severe asphalt crater with loose bitumen debris posing a hazard to traffic.")
- "detectedElements": Array of 2 to 5 specific physical objects/features visible in the image (e.g., ["asphalt fracture", "water pooling", "road hazard"])
- "confidence": A numeric confidence score between 0.60 and 0.99 based on visual clarity and certainty.

Rules:
1. Base your classification only on physical objects clearly visible in the photograph. Do not invent municipal office names, citizen identities, or locations.
2. Return strictly raw JSON. Do not wrap in markdown or add conversational text.
`;

      // Attempt with primary model
      let activeModel = configuredModel;
      let apiResult = await callGeminiApi(activeModel, visionApiKey, promptText, mimeType, cleanBase64);

      // If 404 (model not found on older account/key), fallback to gemini-2.5-flash before dropping to heuristics
      if (!apiResult.ok && apiResult.status === 404 && activeModel === 'gemini-3.8-flash') {
        console.warn(`[ImageAnalyzer] gemini-3.8-flash returned 404, attempting fallback to gemini-2.5-flash.`);
        activeModel = 'gemini-2.5-flash';
        apiResult = await callGeminiApi(activeModel, visionApiKey, promptText, mimeType, cleanBase64);
      }

      if (apiResult.ok && apiResult.json) {
        const candidateText = apiResult.json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText) {
          const parsed = parseGeminiJsonResponse(candidateText);

          const category: CivicCategory = VALID_CATEGORIES.includes(parsed.category)
            ? (parsed.category as CivicCategory)
            : 'ROADS_INFRASTRUCTURE';

          const title = typeof parsed.title === 'string' && parsed.title.trim().length > 0
            ? parsed.title.trim().slice(0, 100)
            : 'Civic Issue Detected';

          const description = typeof parsed.description === 'string' && parsed.description.trim().length > 0
            ? parsed.description.trim().slice(0, 300)
            : 'Observed civic hazard requiring municipal action.';

          const confidence = typeof parsed.confidence === 'number' && !isNaN(parsed.confidence)
            ? Math.min(0.99, Math.max(0.50, Number(parsed.confidence.toFixed(2))))
            : 0.90;

          const detectedElements: string[] = Array.isArray(parsed.detectedElements)
            ? parsed.detectedElements
                .filter((el: unknown): el is string => typeof el === 'string' && el.trim().length > 0)
                .map((el: string) => el.trim().slice(0, 40))
                .slice(0, 5)
            : ['Civic infrastructure'];

          return {
            isModelConfigured: true,
            modelProvider: `Google Gemini (${activeModel})`,
            suggestedCategory: category,
            suggestedTitle: title,
            suggestedDescription: description,
            confidence,
            detectedElements: detectedElements.length > 0 ? detectedElements : ['Civic infrastructure'],
            analysisNotice: `Identified via configured multimodal Google Gemini (${activeModel}) Vision model. Review and confirm below.`,
            isAiAssisted: true,
          };
        }
      } else {
        // Safe logging without secrets
        console.warn(`[ImageAnalyzer] Gemini API call unsuccessful (Status: ${apiResult.status}). Activating honest fallback.`);
      }
    } catch (err: unknown) {
      // Safe logging without secrets
      const safeMessage = err instanceof Error ? err.message : 'Unknown error';
      console.warn(`[ImageAnalyzer] Gemini analysis encountered error: ${safeMessage}. Activating honest fallback.`);
    }
  }

  // 2. Honest Fallback when Vision AI Model is NOT configured or unavailable in prototype
  // If user provided filename or optional hint text, use honest heuristic classifier
  const hintText = [request.userHint, request.filename].filter(Boolean).join(' ');
  const heuristic = await classifyIssue(hintText, {
    filename: request.filename,
    mimeType: request.mimeType,
  });

  const categoryTitles: Record<CivicCategory, { title: string; desc: string; elements: string[] }> = {
    ROADS_INFRASTRUCTURE: {
      title: 'Damaged Road or Pothole Issue',
      desc: 'Pothole or surface degradation observed on municipal roadway.',
      elements: ['Road surface', 'Bitumen/Asphalt', 'Pavement'],
    },
    WASTE_MANAGEMENT: {
      title: 'Garbage Accumulation or Uncollected Waste',
      desc: 'Trash pile or overflowing garbage bin requiring sanitation clearance.',
      elements: ['Solid waste', 'Litter/Debris', 'Sanitation bin'],
    },
    WATER_SUPPLY: {
      title: 'Water Pipe Leakage or Low Pressure',
      desc: 'Water pipe rupture or surface water accumulation reported.',
      elements: ['Water pipeline', 'Surface runoff', 'Plumbing'],
    },
    STREET_LIGHTING: {
      title: 'Non-Functional or Damaged Streetlight',
      desc: 'Dark street or flickering streetlight pole reported.',
      elements: ['Electric pole', 'Lighting fixture', 'Overhead wire'],
    },
    TRAFFIC_TRANSPORT: {
      title: 'Traffic Signal or Transit Infrastructure Issue',
      desc: 'Traffic signal malfunction, damaged sign, or bus stop obstruction.',
      elements: ['Traffic sign', 'Road marking', 'Transit stop'],
    },
    ENVIRONMENT_POLLUTION: {
      title: 'Environmental or Pollution Concern',
      desc: 'Air smoke, illegal dumping, or fallen tree blocking civic area.',
      elements: ['Environmental hazard', 'Smoke/Dust', 'Fallen vegetation'],
    },
    PUBLIC_HEALTH: {
      title: 'Public Health or Drainage Hazard',
      desc: 'Stagnant water breeding vector mosquitoes or foul odor reported.',
      elements: ['Drainage grate', 'Stagnant water', 'Sanitation concern'],
    },
    SAFETY_GOVERNANCE: {
      title: 'Open Manhole or Hazardous Civic Condition',
      desc: 'Missing manhole cover, hazardous cave-in, or collapse risk.',
      elements: ['Manhole opening', 'Pedestrian hazard', 'Safety barrier'],
    },
  };

  const template = categoryTitles[heuristic.suggestedCategory];

  const analysisNotice = visionApiKey
    ? 'Gemini Vision AI was unavailable (rate limit, network timeout, or connection error). Category estimated from file/metadata heuristics without neural network confidence. Please review and confirm your category below.'
    : 'Vision AI model provider is not configured in this prototype. Category suggested from file/metadata heuristics. Please review and confirm your category below.';

  return {
    isModelConfigured: false,
    modelProvider: visionApiKey
      ? 'None (Gemini Unavailable — Heuristic Fallback)'
      : 'None (Vision AI Provider Not Configured)',
    suggestedCategory: heuristic.suggestedCategory,
    suggestedTitle: template.title,
    suggestedDescription: template.desc,
    confidence: undefined, // Honestly omitted because no trained neural network was used
    detectedElements: template.elements,
    analysisNotice,
    isAiAssisted: heuristic.isAiAssisted,
  };
}
