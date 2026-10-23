import { describe, it, expect } from 'vitest';
import { classifyIssue } from '@/features/classification/classifier';

describe('Core Algorithm 1: Issue Classification Service', () => {
  it('correctly classifies road potholes with high confidence', async () => {
    const result = await classifyIssue('Severe deep pothole on main road causing two wheelers to skid');
    expect(result.suggestedCategory).toBe('ROADS_INFRASTRUCTURE');
    expect(result.confidence).toBeGreaterThan(0.6);
    expect(result.detectedKeywords).toContain('pothole');
  });

  it('correctly classifies garbage accumulation', async () => {
    const result = await classifyIssue('Overflowing garbage bins and kachra pile attracting dogs and flies');
    expect(result.suggestedCategory).toBe('WASTE_MANAGEMENT');
    expect(result.detectedKeywords).toContain('garbage');
  });

  it('correctly classifies broken streetlights', async () => {
    const result = await classifyIssue('Dark streetlight pole wire hanging near park');
    expect(result.suggestedCategory).toBe('STREET_LIGHTING');
  });

  it('correctly classifies drinking water leakage', async () => {
    const result = await classifyIssue('Major pipeline burst and clean drinking water leakage on pavement');
    expect(result.suggestedCategory).toBe('WATER_SUPPLY');
    expect(result.detectedKeywords).toContain('leakage');
  });

  it('provides honest baseline fallback when text has no recognized civic keywords', async () => {
    const result = await classifyIssue('Random unstructured non civic text 12345');
    expect(result.isAiAssisted).toBe(false);
    expect(result.confidence).toBeLessThan(0.5);
  });
});
