import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader2, Bot, User as UserIcon } from 'lucide-react';
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

// Web Speech API types (lightweight)
type SR = any;

export function InterviewVideoCall({ open, onClose, chat, chatLoading, language, position, onStart, onUserAnswer }: Props) {
  const fr = language === 'fr';
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const recognitionRef = useRef<SR>(null);
  const lastSpokenRef = useRef<string>('');
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Speak the agent's latest message
  useEffect(() => {
    if (!open) return;
    const last = chat[chat.length - 1];
    if (!last || last.role !== 'assistant') return;
    if (last.content === lastSpokenRef.current) return;
    if (muted) return;
    lastSpokenRef.current = last.content;
    const spoken = last.content.replace(/\[TIP\][\s\S]*?\[\/TIP\]/gi, '').trim();

    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(spoken);
      u.lang = fr ? 'fr-FR' : 'en-US';
      u.rate = 1;
      u.pitch = 1;
      // Pick a matching voice if available
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((vo) => vo.lang.startsWith(u.lang.split('-')[0]));
      if (v) u.voice = v;
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => {
        setIsSpeaking(false);
        // auto-listen after agent finishes speaking
        startListening();
      };
      u.onerror = () => setIsSpeaking(false);
      utteranceRef.current = u;
      window.speechSynthesis.speak(u);
    } catch (e) {
      console.error('TTS error', e);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, open, muted, fr]);

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
      rec.lang = fr ? 'fr-FR' : 'en-US';
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
  }, [fr, onUserAnswer]);

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
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4 bg-gradient-to-b from-black/40 to-transparent">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs font-medium uppercase tracking-wider">
                {fr ? 'En direct' : 'Live'}
              </span>
            </div>
            <div className="text-sm font-medium">
              {position || (fr ? 'Entretien IA' : 'AI Interview')}
            </div>
            <Button size="icon" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setMuted(!muted)}>
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
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
                  scale: isSpeaking ? [1, 1.08, 1] : 1,
                  boxShadow: isSpeaking
                    ? '0 0 60px rgba(99,102,241,0.6)'
                    : '0 0 30px rgba(99,102,241,0.25)',
                }}
                transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
                className="relative h-44 w-44 rounded-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center"
              >
                <Bot className="h-16 w-16 text-white" />
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
                  onClick={handleHangup}
                  className="h-14 w-14 rounded-full bg-red-500 hover:bg-red-600"
                >
                  <PhoneOff className="h-6 w-6" />
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
