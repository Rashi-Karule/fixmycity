import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { analyzeCivicImage } from '@/features/classification/imageAnalyzer';

describe('AI Vision Analysis Service: Gemini 3.8 Flash & Heuristic Fallback', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.GEMINI_API_KEY;
    delete process.env.VISION_AI_API_KEY;
    vi.restoreAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('1. Provides honest fallback when no Gemini API key is configured', async () => {
    const result = await analyzeCivicImage({
      filename: 'pothole_crater.jpg',
      mimeType: 'image/jpeg',
      userHint: 'deep pothole on roadway',
    });

    expect(result.isModelConfigured).toBe(false);
    expect(result.confidence).toBeUndefined();
    expect(result.suggestedCategory).toBe('ROADS_INFRASTRUCTURE');
    expect(result.analysisNotice).toContain('not configured');
    expect(result.detectedElements.length).toBeGreaterThan(0);
  });

  it('2. Successfully analyzes image when Gemini API key is configured and returns valid JSON', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';

    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  category: 'ROADS_INFRASTRUCTURE',
                  title: 'Deep Asphalt Pothole on Roadway',
                  description: 'Large road surface depression with exposed gravel posing a vehicular hazard.',
                  detectedElements: ['asphalt depression', 'loose gravel', 'road hazard'],
                  confidence: 0.94,
                }),
              },
            ],
          },
        },
      ],
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => mockGeminiResponse,
    } as any);

    const result = await analyzeCivicImage({
      imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/jpeg',
      filename: 'street_pothole.jpg',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    // Ensure API endpoint calls gemini-3.8-flash by default
    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('gemini-3.8-flash:generateContent');

    expect(result.isModelConfigured).toBe(true);
    expect(result.modelProvider).toContain('gemini-3.8-flash');
    expect(result.suggestedCategory).toBe('ROADS_INFRASTRUCTURE');
    expect(result.suggestedTitle).toBe('Deep Asphalt Pothole on Roadway');
    expect(result.confidence).toBe(0.94);
    expect(result.detectedElements).toContain('asphalt depression');
    expect(result.isAiAssisted).toBe(true);
  });

  it('3. Robustly parses Gemini response wrapped in markdown code blocks', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';

    const markdownWrappedJson = `\`\`\`json
{
  "category": "WASTE_MANAGEMENT",
  "title": "Overflowing Garbage Container",
  "description": "Solid municipal waste overflowing onto pavement.",
  "detectedElements": ["overflowing bin", "plastic waste"],
  "confidence": 0.91
}
\`\`\``;

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({
        candidates: [{ content: { parts: [{ text: markdownWrappedJson }] } }],
      }),
    } as any);

    const result = await analyzeCivicImage({
      imageBase64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/png',
      filename: 'garbage_dump.png',
    });

    expect(result.isModelConfigured).toBe(true);
    expect(result.suggestedCategory).toBe('WASTE_MANAGEMENT');
    expect(result.suggestedTitle).toBe('Overflowing Garbage Container');
    expect(result.confidence).toBe(0.91);
    expect(result.detectedElements).toContain('overflowing bin');
  });

  it('4. Activates honest fallback when Gemini API returns 429 rate limit or 500 error', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Rate limit exceeded',
    } as any);

    const result = await analyzeCivicImage({
      imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      filename: 'broken_streetlight.jpg',
      mimeType: 'image/jpeg',
      userHint: 'broken streetlight dark road',
    });

    // In fallback mode, never label as AI verified, never fake confidence
    expect(result.isModelConfigured).toBe(false);
    expect(result.confidence).toBeUndefined();
    expect(result.suggestedCategory).toBe('STREET_LIGHTING');
    expect(result.analysisNotice).toContain('unavailable');
  });

  it('5. Falls back to gemini-2.5-flash if gemini-3.8-flash returns 404', async () => {
    process.env.GEMINI_API_KEY = 'test-gemini-key-123';

    // First call (gemini-3.8-flash) returns 404
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: async () => 'Model not found',
      } as any)
      // Second call (fallback gemini-2.5-flash) succeeds
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        statusText: 'OK',
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      category: 'WATER_SUPPLY',
                      title: 'Burst Water Pipe on Sidewalk',
                      description: 'Water spraying from broken municipal pipeline.',
                      detectedElements: ['pipeline fracture', 'water pooling'],
                      confidence: 0.89,
                    }),
                  },
                ],
              },
            },
          ],
        }),
      } as any);

    const result = await analyzeCivicImage({
      imageBase64: 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      mimeType: 'image/jpeg',
    });

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(fetchSpy.mock.calls[0][0]).toContain('gemini-3.8-flash');
    expect(fetchSpy.mock.calls[1][0]).toContain('gemini-2.5-flash');

    expect(result.isModelConfigured).toBe(true);
    expect(result.modelProvider).toContain('gemini-2.5-flash');
    expect(result.suggestedCategory).toBe('WATER_SUPPLY');
    expect(result.suggestedTitle).toBe('Burst Water Pipe on Sidewalk');
  });
});
