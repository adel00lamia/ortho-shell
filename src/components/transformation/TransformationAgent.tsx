import { useState } from 'react';
import { BookOpen, Copy, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import agentMark from '@/assets/transformation-agent.png';
import { Conversation, ConversationContent, ConversationEmptyState, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageAction, MessageActions, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputFooter, PromptInputSubmit, PromptInputTextarea } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { buildTransformationInsights, type TransformationSnapshot } from '@/lib/transformationAnalysis';

type ChatMessage = { id: string; role: 'user' | 'assistant'; content: string; sources?: { label: string; type: string }[]; confidence?: 'high' | 'medium' | 'low' };

export function TransformationAgent({ snapshot, fr }: { snapshot: TransformationSnapshot; fr: boolean }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [status, setStatus] = useState<'ready' | 'submitted' | 'error'>('ready');
  const suggestions = fr ? ['Où la chaîne stratégie-exécution se rompt-elle ?', 'Quelles tâches prioriser pour Humain + IA ?', 'Quels rôles nécessitent un reskilling ?'] : ['Where does the strategy-execution chain break?', 'Which tasks should Human + AI prioritize?', 'Which roles need reskilling?'];

  const ask = async (question: string) => {
    const clean = question.trim();
    if (!clean || status === 'submitted') return;
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'user', content: clean }]);
    setStatus('submitted');
    const insights = buildTransformationInsights(snapshot, fr);
    const { data, error } = await supabase.functions.invoke('transformation-analyst', { body: { question: clean, language: fr ? 'fr' : 'en' } });
    if (error || !data?.answer) {
      const fallback = insights.length
        ? `${fr ? 'Analyse calculée sur les données visibles :' : 'Analysis calculated from visible data:'}\n\n${insights.map((item) => `- **${item.title}** — ${item.detail}`).join('\n')}`
        : (fr ? 'Les données disponibles ne permettent pas encore d’établir une priorité. Complétez les objectifs, capacités, processus et tâches.' : 'Available data is not yet sufficient to establish a priority. Complete objectives, capabilities, processes and tasks.');
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: fallback, sources: [{ label: fr ? 'Données du WorkGraph affiché' : 'Displayed WorkGraph data', type: 'deterministic' }], confidence: insights.length ? 'high' : 'low' }]);
      setStatus('error');
      toast.error(fr ? 'Agent IA indisponible : analyse déterministe affichée.' : 'AI agent unavailable: deterministic analysis shown.');
      return;
    }
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: 'assistant', content: data.answer, sources: data.sources ?? [], confidence: data.confidence ?? 'medium' }]);
    setStatus('ready');
  };

  return (
    <aside className="transformation-panel flex min-h-[620px] min-w-0 flex-col overflow-hidden lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3"><img src={agentMark} alt="" width={44} height={44} className="h-11 w-11 object-contain"/><div className="min-w-0 flex-1"><h2 className="font-serif text-xl">{fr ? 'Agent Transformation' : 'Transformation Agent'}</h2><p className="text-xs text-muted-foreground">{fr ? 'Analyse sourcée · lecture seule' : 'Sourced analysis · read only'}</p></div><ShieldCheck className="h-4 w-4 text-primary" /></div>
      </div>
      <Conversation className="min-h-0 flex-1">
        <ConversationContent className="gap-5 p-4">
          {!messages.length && <ConversationEmptyState icon={<img src={agentMark} alt="" width={64} height={64} className="h-16 w-16 object-contain"/>} title={fr ? 'Interrogez votre WorkGraph' : 'Ask your WorkGraph'} description={fr ? 'L’agent relie les faits, explique les scores et cite ses sources.' : 'The agent connects facts, explains scores and cites sources.'}><div className="space-y-2">{suggestions.map((suggestion) => <Button key={suggestion} variant="outline" className="h-auto w-full whitespace-normal py-2 text-left text-xs" onClick={() => ask(suggestion)}>{suggestion}</Button>)}</div></ConversationEmptyState>}
          {messages.map((message) => <Message key={message.id} from={message.role}><MessageContent><MessageResponse>{message.content}</MessageResponse></MessageContent>{message.role === 'assistant' && <div className="space-y-2"><div className="flex flex-wrap gap-1">{message.sources?.map((source) => <Badge key={`${source.type}-${source.label}`} variant="outline" className="gap-1 text-[10px]"><BookOpen className="h-3 w-3" />{source.label}</Badge>)}{message.confidence && <Badge variant="secondary" className="text-[10px]">{fr ? 'Confiance' : 'Confidence'} · {message.confidence}</Badge>}</div><MessageActions><MessageAction tooltip={fr ? 'Copier' : 'Copy'} onClick={() => navigator.clipboard.writeText(message.content)}><Copy className="h-3.5 w-3.5" /></MessageAction></MessageActions></div>}</Message>)}
          {status === 'submitted' && <Shimmer className="text-sm">{fr ? 'Analyse des relations…' : 'Analyzing relationships…'}</Shimmer>}
        </ConversationContent><ConversationScrollButton />
      </Conversation>
      <div className="border-t border-border p-3"><PromptInput onSubmit={({ text }) => ask(text)}><PromptInputTextarea placeholder={fr ? 'Posez une question sur la transformation…' : 'Ask about the transformation…'} /><PromptInputFooter className="justify-end"><PromptInputSubmit status={status === 'submitted' ? 'submitted' : status === 'error' ? 'error' : 'ready'} disabled={status === 'submitted'} /></PromptInputFooter></PromptInput><p className="mt-2 text-[10px] text-muted-foreground">{fr ? 'Aucune création, modification ou suppression de données.' : 'No data creation, modification or deletion.'}</p></div>
    </aside>
  );
}