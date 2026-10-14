// Test the provider adapter directly without contacting Anthropic or using credentials.
// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { ANTHROPIC_MAX_OUTPUT_TOKENS, readAnthropicStream } from '../../supabase/functions/ai-advanced-planner/anthropicStream';

const sse = (...events: unknown[]) => new Response(events.map(event => `data: ${JSON.stringify(event)}`).join('\n\n'));
const delta = (text: string) => ({ type: 'content_block_delta', delta: { type: 'text_delta', text } });
const stopped = { type: 'message_stop' };

describe('Claude plan stream', () => {
  it('provides 16,384 tokens for detailed plans instead of 8,192', () => {
    expect(ANTHROPIC_MAX_OUTPUT_TOKENS).toBe(16384);
  });
  it('returns a complete plan including the final SSE event without a newline', async () => {
    await expect(readAnthropicStream(sse(delta('{"plan":'), delta('{"modules":[]}}'), { type: 'message_delta', delta: { stop_reason: 'end_turn' } }, stopped))).resolves.toBe('{"plan":{"modules":[]}}');
  });
  it('rejects token-limited output even if it contains valid JSON', async () => {
    await expect(readAnthropicStream(sse(delta('{"plan":{}}'), { type: 'message_delta', delta: { stop_reason: 'max_tokens' } }, stopped))).rejects.toThrow('max_tokens');
  });
  it('rejects provider errors after partial output', async () => {
    await expect(readAnthropicStream(sse(delta('{"plan":'), { type: 'error', error: { message: 'overloaded' } }))).rejects.toThrow('overloaded');
  });
  it('rejects disconnected streams rather than accepting partial JSON', async () => {
    await expect(readAnthropicStream(sse(delta('{"plan":')))).rejects.toThrow('before completion');
  });
});