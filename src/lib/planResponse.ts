import type { GeneratedPlan } from '@/types/trainingPlan';

/** Read complete SSE frames, including the final unterminated frame, without quadratic reparsing. */
export async function readPlanResponse(response: Response): Promise<GeneratedPlan> {
  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;
    try { message = JSON.parse(text).error || message; } catch { /* retain status */ }
    throw new Error(message);
  }
  if (!response.body) throw new Error('Réponse vide du service de génération.');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let pending = '';
  let json = '';
  let result: GeneratedPlan | undefined;
  const consume = (line: string) => {
    if (!line.startsWith('data:')) return;
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') return;
    const data = JSON.parse(payload);
    if (data.error) throw new Error(data.error);
    if (data.plan) result = data.plan;
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      pending += chunk;
      if (!response.headers.get('content-type')?.includes('text/event-stream')) json += chunk;
      const lines = pending.split('\n');
      pending = lines.pop() || '';
      lines.forEach(consume);
    }
    pending += decoder.decode();
    consume(pending);
    if (!result && json) {
      const data = JSON.parse(json);
      if (data.error) throw new Error(data.error);
      result = data.plan;
    }
  } finally { reader.releaseLock(); }
  if (!result || !Array.isArray(result.modules) || !result.modules.length || !result.title) {
    throw new Error('Réponse incomplète du service de génération. Aucun plan partiel affiché.');
  }
  return result;
}