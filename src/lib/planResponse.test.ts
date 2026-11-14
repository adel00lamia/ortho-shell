import { describe, expect, it } from 'vitest';
import { readPlanResponse } from './planResponse';
import { parsePlanSection, PLAN_SECTIONS } from '../../supabase/functions/ai-advanced-planner/planContract';

describe('Complete plan delivery', () => {
  const plan = { title: 'RH', modules: [{ title: 'Paie' }] };
  it('reads split JSON and French characters in the final SSE frame', async () => {
    const encoded = new TextEncoder().encode(`: keepalive\n\ndata: ${JSON.stringify({ plan })}`);
    const stream = new ReadableStream({ start(c) { for (const byte of encoded) c.enqueue(new Uint8Array([byte])); c.close(); } });
    await expect(readPlanResponse(new Response(stream, { headers: { 'content-type': 'text/event-stream' } }))).resolves.toEqual(plan);
  });
  it('surfaces terminal errors instead of showing a previous partial plan', async () => {
    const body = `data: ${JSON.stringify({ plan })}\n\ndata: {"error":"max_tokens"}\n\n`;
    await expect(readPlanResponse(new Response(body, { headers: { 'content-type': 'text/event-stream' } }))).rejects.toThrow('max_tokens');
  });
  it('rejects interrupted JSON', async () => {
    await expect(readPlanResponse(new Response('data: {"plan":', { headers: { 'content-type': 'text/event-stream' } }))).rejects.toThrow();
  });
  it('keeps plain JSON compatibility', async () => {
    await expect(readPlanResponse(new Response(JSON.stringify({ plan })))).resolves.toEqual(plan);
  });
  it('requires every analysis section rather than silently dropping it', () => {
    expect(() => parsePlanSection('{"plan":{"market_research":{}}}', PLAN_SECTIONS[2])).toThrow('risk_assessment');
  });
  it('rejects truncated JSON even when followed by another complete object', () => {
    expect(() => parsePlanSection('{"plan": { {"plan":{"title":"RH"}}', ['title'])).toThrow();
  });
  it('rejects modules lacking detailed learning outcomes', () => {
    const modules = Array.from({ length: 4 }, () => ({ title: 'RH', description: 'D', duration: '7 h', observed_difficulty: 'D', accountable_owner: 'DRH' }));
    expect(() => parsePlanSection(JSON.stringify({ plan: { modules } }), ['modules'])).toThrow('learning_objectives');
  });
});