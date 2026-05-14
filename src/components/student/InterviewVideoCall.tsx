import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader2, User as UserIcon, ScrollText, Lightbulb, Zap } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import coachAvatar from '@/assets/interview-coach-avatar.jpg';
import { toast } from 'sonner';

type ChatMsg = { role: 'user' | 'assistant'; content: string };

interface Props {
  open: boolean;
  onClose: () => void;
  chat: ChatMsg[];
  chatLoading: boolean;
  language: 'fr' | 'en' | 'ar';
  position: string;
  onStart: () => void;
  onUserAnswer: (text: string) => void;
}

const LOCALE_OPTIONS = [
  { value: 'fr-FR', label: '🇫🇷 Français (France)' },
  { value: 'fr-CA', label: '🇨🇦 Français (Canada)' },
  { value: 'en-US', label: '🇺🇸 English (US)' },
  { value: 'en-GB', label: '🇬🇧 English (UK)' },
  { value: 'ar-MA', label: '🇲🇦 العربية (المغرب)' },
  { value: 'ar-SA', label: '🇸🇦 العربية (السعودية)' },
  { value: 'ar-EG', label: '🇪🇬 العربية (مصر)' },
];

// Score a voice — higher is more natural / less robotic.
function scoreVoice(v: SpeechSynthesisVoice): number {
  const n = `${v.name} ${(v as any).voiceURI ?? ''}`.toLowerCase();
  let s = 0;
  if (/(neural|natural|premium|enhanced|wavenet|studio|online)/.test(n)) s += 50;
  if (/(google|microsoft)/.test(n)) s += 30;
  if (/(siri|samantha|amelie|amélie|thomas|daniel|karen|moira|tessa|hoda|maged|laila|zeina)/.test(n)) s += 20;
  if (/(novelty|whisper|bad|cellos|organ|deranged|trinoids|zarvox|bahh|bells)/.test(n)) s -= 80;
  if (!v.localService) s += 10; // cloud voices usually sound better
  return s;
}

function pickBestVoice(voices: SpeechSynthesisVoice[], locale: string): SpeechSynthesisVoice | undefined {
  const lang = locale.split('-')[0];
  const exact = voices.filter((v) => v.lang.toLowerCase() === locale.toLowerCase());
  const sameLang = voices.filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()));
  const pool = exact.length ? exact : sameLang;
  return pool.sort((a, b) => scoreVoice(b) - scoreVoice(a))[0];
}

// Strip Markdown so the TTS engine reads natural prose only.
function stripMarkdownForSpeech(input: string): string {
  return input
    // tip blocks
    .replace(/\[TIP\][\s\S]*?\[\/TIP\]/gi, '')
    // fenced code & inline code
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    // markdown tables: drop separator rows (|---|---|), turn cell rows into "a, b, c."
    .replace(/^\s*\|?[\s:|-]*-+[\s:|-]*\|?\s*$/gm, '')
    .replace(/^\s*\|(.+)\|\s*$/gm, (_m, row: string) =>
      row.split('|').map((c) => c.trim()).filter(Boolean).join(', ') + '.'
    )
    // blockquotes (one or more leading >)
    .replace(/^\s*>+\s?/gm, '')
    // headings
    .replace(/^#{1,6}\s+/gm, '')
    // lists
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    // emphasis
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    // images & links
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // horizontal rules
    .replace(/^\s*([-*_])\1{2,}\s*$/gm, '')
    // any leftover md chars
    .replace(/[*_~`>#|]/g, '')
    // collapse whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

type SR = any;

export function InterviewVideoCall({ open, onClose, chat, chatLoading, language, position, onStart, onUserAnswer }: Props) {
  const fr = language === 'fr';
  const ar = language === 'ar';
  const defaultLocale = ar ? 'ar-MA' : fr ? 'fr-FR' : 'en-US';
  const [locale, setLocale] = useState<string>(defaultLocale);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceURI, setVoiceURI] = useState<string>('');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasStarted, setHasStarted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  const recognitionRef = useRef<SR>(null);
  const lastSpokenRef = useRef<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Sync locale with parent language changes
  useEffect(() => { setLocale(defaultLocale); }, [defaultLocale]);

  // Load voices (browsers populate them async)
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  const localeVoices = useMemo(() => {
    const lang = locale.split('-')[0];
    return voices
      .filter((v) => v.lang.toLowerCase().startsWith(lang.toLowerCase()))
      .sort((a, b) => scoreVoice(b) - scoreVoice(a));
  }, [voices, locale]);

  // Auto-pick best voice on locale change
  useEffect(() => {
    if (!localeVoices.length) { setVoiceURI(''); return; }
    if (!localeVoices.find((v) => v.voiceURI === voiceURI)) {
      const best = pickBestVoice(localeVoices, locale);
      setVoiceURI(best?.voiceURI ?? localeVoices[0].voiceURI);
    }
  }, [localeVoices, locale, voiceURI]);

  // Speak the agent's latest message
  useEffect(() => {
    if (!open) return;
    const last = chat[chat.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (last.content === lastSpokenRef.current) return;
    if (muted) return;
    lastSpokenRef.current = last.content;
    const spoken = stripMarkdownForSpeech(last.content);

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = locale;
      // Slightly slower + warmer pitch = less robotic
      u.rate = 0.92;
      u.pitch = 1.05;
      u.volume = 1;
      const chosen = voices.find((v) => v.voiceURI === voiceURI) ?? pickBestVoice(voices, locale);
      if (chosen) { u.voice = chosen; u.lang = chosen.lang; }
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => { setIsSpeaking(false); startListening(); };
      u.onerror = () => setIsSpeaking(false);
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error('TTS error', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, open, muted, locale, voiceURI, voices]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      try { window.speechSynthesis.cancel(); } catch {}
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      setIsSpeaking(false);
      setTranscript('');
      setHasStarted(false);
      lastSpokenRef.current = '';
    }
  }, [open]);

  const startListening = useCallback(() => {
    const SpeechRecognition: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error(fr ? 'Reconnaissance vocale non supportée par ce navigateur. Utilisez Chrome.' : 'Speech recognition not supported. Try Chrome.');
      return;
    }
    try {
      const rec = new SpeechRecognition();
      rec.lang = locale;
      rec.continuous = false;
      rec.interimResults = true;
      let finalText = '';
      rec.onstart = () => { setIsListening(true); setTranscript(''); };
      rec.onresult = (e: any) => {
        let interim = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i];
          if (r.isFinal) finalText += r[0].transcript;
          else interim += r[0].transcript;
        }
        setTranscript(finalText + interim);
      };
      rec.onerror = (e: any) => {
        console.warn('SR error', e?.error);
        setIsListening(false);
      };
      rec.onend = () => {
        setIsListening(false);
        const text = finalText.trim();
        if (text.length > 1) onUserAnswer(text);
        setTranscript('');
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Recognition start failed', e);
      setIsListening(false);
    }
  }, [locale, fr, onUserAnswer]);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setIsListening(false);
  };

  const handleStart = () => {
    setHasStarted(true);
    onStart();
  };

  const handleHangup = () => {
    try { window.speechSynthesis.cancel(); } catch {}
    try { recognitionRef.current?.stop(); } catch {}
    onClose();
  };

  const lastAssistant = [...chat].reverse().find((m) => m.role === 'assistant')?.content?.replace(/\[TIP\][\s\S]*?\[\/TIP\]/gi, '').trim();

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleHangup()}>
      <DialogContent className="max-w-3xl p-0 overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white">
        <DialogTitle className="sr-only">{fr ? 'Entretien vidéo IA' : 'AI Video Interview'}</DialogTitle>

        <div className="relative h-[600px] flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between gap-2 px-4 py-3 bg-gradient-to-b from-black/50 to-transparent">
            <div className="flex items-center gap-2 shrink-0">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] font-medium uppercase tracking-wider">
                {fr ? 'En direct' : ar ? 'مباشر' : 'Live'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-1 justify-end">
              <Select value={locale} onValueChange={setLocale}>
                <SelectTrigger className="h-8 w-[150px] bg-white/10 border-white/20 text-white text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {localeVoices.length > 0 && (
                <Select value={voiceURI} onValueChange={setVoiceURI}>
                  <SelectTrigger className="h-8 w-[160px] bg-white/10 border-white/20 text-white text-xs">
                    <SelectValue placeholder={fr ? 'Voix' : 'Voice'} />
                  </SelectTrigger>
                  <SelectContent>
                    {localeVoices.map((v) => (
                      <SelectItem key={v.voiceURI} value={v.voiceURI}>
                        {v.name.length > 28 ? v.name.slice(0, 28) + '…' : v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="icon" variant="ghost" className="h-8 w-8 text-white hover:bg-white/10 shrink-0" onClick={() => setMuted(!muted)}>
                {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Agent stage */}
          <div className="flex-1 flex flex-col items-center justify-center gap-8 px-6">
            {/* Animated voice orb */}
            <div className="relative">
              <AnimatePresence>
                {isSpeaking && (
                  <>
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full bg-indigo-500/20"
                        initial={{ scale: 1, opacity: 0.6 }}
                        animate={{ scale: 1.6 + i * 0.3, opacity: 0 }}
                        transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4, ease: 'easeOut' }}
                      />
                    ))}
                  </>
                )}
              </AnimatePresence>
              <motion.div
                animate={{
                  scale: isSpeaking ? [1, 1.04, 1] : 1,
                  boxShadow: isSpeaking
                    ? '0 0 80px rgba(99,102,241,0.7), 0 0 0 4px rgba(255,255,255,0.15)'
                    : '0 0 40px rgba(99,102,241,0.35), 0 0 0 3px rgba(255,255,255,0.1)',
                }}
                transition={{ duration: 0.8, repeat: isSpeaking ? Infinity : 0 }}
                className="relative h-48 w-48 rounded-full overflow-hidden ring-2 ring-white/20"
              >
                <img
                  src={coachAvatar}
                  alt={fr ? "Coach IA Sarah" : ar ? "المدربة الافتراضية سارة" : "AI Coach Sarah"}
                  className="h-full w-full object-cover"
                  loading="lazy"
                  width={512}
                  height={512}
                />
                {/* speaking shimmer overlay */}
                {isSpeaking && (
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-t from-indigo-500/30 via-transparent to-transparent"
                    animate={{ opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                  />
                )}
                {/* live status pill */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md">
                  <span className={`h-1.5 w-1.5 rounded-full ${isSpeaking ? 'bg-emerald-400 animate-pulse' : isListening ? 'bg-red-400 animate-pulse' : 'bg-white/60'}`} />
                  <span className="text-[10px] font-medium text-white">Sarah</span>
                </div>
              </motion.div>
            </div>

            <div className="text-center max-w-md min-h-[80px]">
              <div className="text-xs uppercase tracking-wider text-indigo-300 mb-2">
                {chatLoading ? (fr ? 'Réfléchit...' : 'Thinking...')
                  : isSpeaking ? (fr ? 'Parle' : 'Speaking')
                  : isListening ? (fr ? 'Écoute' : 'Listening')
                  : (fr ? 'En attente' : 'Ready')}
              </div>
              <p className="text-sm text-white/90 leading-relaxed line-clamp-3">
                {chatLoading ? '...' : (lastAssistant || (fr ? 'Cliquez sur Démarrer pour commencer l\'entretien.' : 'Click Start to begin the interview.'))}
              </p>
            </div>

            {/* User transcript bubble */}
            {(isListening || transcript) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20"
              >
                <UserIcon className="h-3 w-3 text-emerald-400" />
                <span className="text-xs text-white/90 max-w-xs truncate">
                  {transcript || (fr ? 'Parlez...' : 'Speak now...')}
                </span>
                {isListening && (
                  <div className="flex gap-0.5">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{ height: ['4px', '12px', '4px'] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                        className="w-0.5 bg-emerald-400 rounded-full"
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </div>

          {/* Controls */}
          <div className="relative z-10 flex items-center justify-center gap-4 py-6 bg-gradient-to-t from-black/60 to-transparent">
            {!hasStarted ? (
              <Button size="lg" onClick={handleStart} disabled={!position.trim() || chatLoading} className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-full px-8">
                {chatLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Mic className="h-4 w-4 mr-2" />}
                {fr ? 'Démarrer l\'entretien' : 'Start interview'}
              </Button>
            ) : (
              <>
                <Button
                  size="icon"
                  onClick={isListening ? stopListening : startListening}
                  disabled={isSpeaking || chatLoading}
                  className={`h-14 w-14 rounded-full ${isListening ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-white/15 hover:bg-white/25'}`}
                >
                  {isListening ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </Button>
                <Button
                  size="icon"
                  onClick={() => setShowTranscript((s) => !s)}
                  className={`h-14 w-14 rounded-full ${showTranscript ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-white/15 hover:bg-white/25'}`}
                  title={fr ? 'Transcription' : ar ? 'النص الكامل' : 'Transcript'}
                >
                  <ScrollText className="h-6 w-6" />
                </Button>
                <Button
                  size="icon"
                  onClick={handleHangup}
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>

          {/* Transcript overlay */}
          <AnimatePresence>
            {showTranscript && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-0 bottom-[88px] top-[60px] z-20 mx-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-indigo-300" />
                    <span className="text-sm font-medium">
                      {fr ? 'Transcription complète' : ar ? 'النص الكامل للمقابلة' : 'Full transcript'}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/70">
                      {chat.length} {fr ? 'messages' : ar ? 'رسائل' : 'messages'}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-white/70 hover:bg-white/10" onClick={() => setShowTranscript(false)}>
                    {fr ? 'Fermer' : ar ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
                <ScrollArea className="flex-1 px-4 py-3">
                  {chat.length === 0 ? (
                    <p className="text-sm text-white/50 text-center py-8">
                      {fr ? 'Aucun échange pour le moment.' : ar ? 'لا توجد محادثة بعد.' : 'No conversation yet.'}
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {chat.map((m, idx) => {
                        if (m.role === 'user') {
                          return (
                            <div key={idx} className="flex justify-end">
                              <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-emerald-500/20 border border-emerald-400/30 px-3 py-2">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <UserIcon className="h-3 w-3 text-emerald-300" />
                                  <span className="text-[10px] uppercase tracking-wider text-emerald-300">{fr ? 'Vous' : ar ? 'أنت' : 'You'}</span>
                                </div>
                                <p className="text-sm text-white/90 whitespace-pre-wrap leading-relaxed">{m.content}</p>
                              </div>
                            </div>
                          );
                        }
                        // assistant: split tips and question
                        const tipRegex = /\[TIP\]([\s\S]*?)\[\/TIP\]/gi;
                        const tips: string[] = [];
                        let tm;
                        while ((tm = tipRegex.exec(m.content)) !== null) {
                          const t = tm[1]?.trim();
                          if (t) tips.push(t);
                        }
                        const question = m.content.replace(tipRegex, '').trim();
                        return (
                          <div key={idx} className="flex justify-start">
                            <div className="max-w-[85%] space-y-2">
                              {tips.map((t, i) => (
                                <div key={i} className="rounded-xl bg-amber-500/15 border border-amber-400/30 px-3 py-2 flex gap-2">
                                  <Lightbulb className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" />
                                  <div>
                                    <div className="text-[10px] uppercase tracking-wider text-amber-300 mb-0.5">
                                      {fr ? `Conseil ${tips.length > 1 ? `${i + 1}/${tips.length}` : ''}` : ar ? `نصيحة ${tips.length > 1 ? `${i + 1}/${tips.length}` : ''}` : `Tip ${tips.length > 1 ? `${i + 1}/${tips.length}` : ''}`}
                                    </div>
                                    <p className="text-xs text-amber-50/90 whitespace-pre-wrap leading-relaxed">{t}</p>
                                  </div>
                                </div>
                              ))}
                              {question && (
                                <div className="rounded-2xl rounded-bl-sm bg-white/10 border border-white/15 px-3 py-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <img src={coachAvatar} alt="" className="h-4 w-4 rounded-full object-cover" />
                                    <span className="text-[10px] uppercase tracking-wider text-indigo-300">Sarah</span>
                                  </div>
                                  <p className="text-sm text-white/95 whitespace-pre-wrap leading-relaxed">{question}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
