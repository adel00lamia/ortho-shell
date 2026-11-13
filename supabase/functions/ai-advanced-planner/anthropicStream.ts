// Leave enough room for the full six-module engineering plan, including French prose.
export const ANTHROPIC_MAX_OUTPUT_TOKENS = 16384;

export const readAnthropicStream = async (response: Response): Promise<string> => {
  if (!response.body) throw new Error('Claude returned no response body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let output = '';
  let terminalError = '';
  let completed = false;
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload) return;
    let event;
    try { event = JSON.parse(payload); } catch { return; }
    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta' && typeof event.delta.text === 'string') output += event.delta.text;
    if (event.type === 'error') terminalError = event.error?.message || 'Claude generation failed';
    if (event.type === 'message_delta' && event.delta?.stop_reason === 'max_tokens') terminalError = 'Claude response truncated (max_tokens). Please reduce the plan scope and regenerate.';
    if (event.type === 'message_stop') completed = true;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    if (buffer) consume(buffer);
  } finally {
    reader.releaseLock();
  }
  // Never pass partial JSON to the plan parser, even when some text arrived.
  if (terminalError) throw new Error(terminalError);
  if (!completed) throw new Error('Claude stream ended before completion. Please regenerate.');
  if (!output) throw new Error('Claude returned an empty response');
  return output;
};