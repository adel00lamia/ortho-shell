import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SpeakingStyle } from './speakingStyle';

type Props = {
  fr: boolean;
  value: SpeakingStyle;
  onChange: (next: SpeakingStyle) => void;
};

/** Lets the user record or type how they actually speak, so model answers sound like them. */
export function SpeakingStyleCard({ fr, value, onChange }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startDictation = () => {
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = fr ? 'fr-FR' : 'en-US';
    rec.continuous = true;
    rec.interimResults = false;
    let base = value.sample;
    rec.onresult = (e: any) => {
      let add = '';
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        if (e.results[i].isFinal) add += `${e.results[i][0].transcript} `;
      }
      if (add) {
        base = `${base} ${add}`.trim();
        onChange({ ...value, sample: base });
      }
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopDictation = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  };

  const dictationAvailable = typeof window !== 'undefined'
    && !!((window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition);

  const toggle = <K extends keyof SpeakingStyle>(key: K, a: SpeakingStyle[K], b: SpeakingStyle[K], labelA: string, labelB: string) => (
    <div className="flex gap-2">
      {[{ v: a, l: labelA }, { v: b, l: labelB }].map((opt) => (
        <button
          key={String(opt.v)}
          type="button"
          onClick={() => onChange({ ...value, [key]: opt.v })}
          className={cn(
            'rounded-full border px-3 py-1 text-xs transition-colors',
            value[key] === opt.v ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {opt.l}
        </button>
      ))}
    </div>
  );

  return (
    <Card className="border-primary/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquare className="h-4 w-4 text-primary" />
          {fr ? 'Ma façon de parler' : 'How I speak'}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {fr
            ? "Parle ou écris 3 à 5 phrases comme tu le dirais vraiment. Les réponses modèles seront réécrites avec tes mots, pour que tu puisses les dire naturellement."
            : 'Speak or type 3 to 5 sentences the way you really would. Model answers get rewritten in your words so you can say them naturally.'}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {dictationAvailable && (
            <Button
              type="button"
              size="sm"
              variant={listening ? 'destructive' : 'secondary'}
              onClick={listening ? stopDictation : startDictation}
            >
              {listening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
              {listening
                ? (fr ? 'Arrêter la dictée' : 'Stop dictation')
                : (fr ? 'Dicter au micro' : 'Dictate with mic')}
            </Button>
          )}
          {value.sample.trim() && (
            <Badge variant="outline">
              {fr ? `${value.sample.trim().split(/\s+/).length} mots enregistrés` : `${value.sample.trim().split(/\s+/).length} words captured`}
            </Badge>
          )}
          {value.sample.trim() && (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange({ ...value, sample: '' })}>
              {fr ? 'Effacer' : 'Clear'}
            </Button>
          )}
        </div>
        <Textarea
          rows={4}
          value={value.sample}
          onChange={(e) => onChange({ ...value, sample: e.target.value })}
          placeholder={fr
            ? "Ex : « Moi je bosse surtout sur le sourcing, je pars du besoin du manager, après je trie et j'appelle les gens assez vite… »"
            : 'e.g. "Basically I mostly do sourcing, I start from the manager\'s need, then I screen and call people pretty fast…"'}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <p className="text-xs font-medium">{fr ? 'Ton' : 'Tone'}</p>
            {toggle('register', 'natural', 'formal', fr ? 'Naturel' : 'Natural', fr ? 'Soutenu' : 'Formal')}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">{fr ? 'Longueur' : 'Length'}</p>
            {toggle('length', 'short', 'detailed', fr ? 'Phrases courtes' : 'Short', fr ? 'Développé' : 'Detailed')}
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium">{fr ? 'Adresse' : 'Address'}</p>
            {toggle('address', 'vous', 'tu', fr ? 'Vouvoiement' : 'Formal', fr ? 'Tutoiement' : 'Informal')}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
