import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { useTrackEvent } from '@/hooks/useXAPIEvents';
import { createScormAPI, installScormAPI, cleanupScormAPI, type ScormData } from '@/lib/scormBridge';
import { X, Maximize2, Minimize2, Play, RotateCcw, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

interface ScormPlayerProps {
  moduleId: string;
  moduleTitle: string;
  scormUrl: string;
  entryPoint?: string;
  onClose: () => void;
  onComplete?: (score: number | null, passed: boolean) => void;
}

export function ScormPlayer({
  moduleId,
  moduleTitle,
  scormUrl,
  entryPoint = 'index.html',
  onClose,
  onComplete,
}: ScormPlayerProps) {
  const { user } = useAuth();
  const trackEvent = useTrackEvent();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const startTimeRef = useRef<Date>(new Date());

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [status, setStatus] = useState<string>('not attempted');
  const [score, setScore] = useState<number | null>(null);
  const [bookmark, setBookmark] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Track launch
  useEffect(() => {
    trackEvent.mutate({
      module_id: moduleId,
      verb: 'launched',
      object_type: 'scorm_package',
    });
  }, [moduleId]);

  const handleScormEvent = useCallback((event: {
    type: string;
    key?: string;
    value?: string;
    data: ScormData;
  }) => {
    if (event.type === 'setValue' && event.key && event.value !== undefined) {
      switch (event.key) {
        case 'cmi.core.lesson_status': {
          setStatus(event.value);
          const isComplete = event.value === 'completed' || event.value === 'passed';
          const isFailed = event.value === 'failed';

          if (isComplete) {
            trackEvent.mutate({
              module_id: moduleId,
              verb: 'completed',
              object_type: 'scorm_package',
              result_score: score ?? undefined,
              result_success: true,
            });
          }
          if (event.value === 'passed') {
            trackEvent.mutate({
              module_id: moduleId,
              verb: 'passed',
              object_type: 'scorm_package',
              result_score: score ?? undefined,
              result_success: true,
            });
          }
          if (isFailed) {
            trackEvent.mutate({
              module_id: moduleId,
              verb: 'failed',
              object_type: 'scorm_package',
              result_score: score,
              result_success: false,
            });
          }
          break;
        }
        case 'cmi.core.score.raw': {
          const s = parseFloat(event.value);
          if (!isNaN(s)) setScore(s);
          break;
        }
        case 'cmi.core.lesson_location':
          setBookmark(event.value);
          break;
      }
    }

    if (event.type === 'finish') {
      const finalStatus = event.data['cmi.core.lesson_status'];
      const finalScore = event.data['cmi.core.score.raw']
        ? parseFloat(event.data['cmi.core.score.raw'])
        : null;
      const passed = finalStatus === 'passed' || finalStatus === 'completed';

      trackEvent.mutate({
        module_id: moduleId,
        verb: finalStatus === 'incomplete' ? 'suspended' : 'completed',
        object_type: 'scorm_package',
        result_score: finalScore,
        result_success: passed,
        context_data: {
          bookmark: event.data['cmi.core.lesson_location'],
          suspend_data: event.data['cmi.suspend_data'],
          session_time: event.data['cmi.core.session_time'],
        },
      });

      onComplete?.(finalScore, passed);
    }
  }, [moduleId, score, trackEvent, onComplete]);

  // Initialize SCORM API when iframe loads
  const handleIframeLoad = useCallback(() => {
    if (!iframeRef.current || !user) return;

    const studentName = user.user_metadata?.first_name
      ? `${user.user_metadata.last_name || ''}, ${user.user_metadata.first_name}`
      : user.email || 'Learner';

    const { api } = createScormAPI(
      studentName,
      user.id,
      null, // savedData - could load from xapi_events context_data
      handleScormEvent
    );

    installScormAPI(iframeRef.current, api);
  }, [user, handleScormEvent]);

  useEffect(() => {
    return () => cleanupScormAPI();
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  const handleClose = () => {
    if (status === 'incomplete') {
      trackEvent.mutate({
        module_id: moduleId,
        verb: 'suspended',
        object_type: 'scorm_package',
        context_data: { bookmark, elapsed },
      });
    }
    cleanupScormAPI();
    onClose();
  };

  const contentUrl = scormUrl.endsWith('/')
    ? `${scormUrl}${entryPoint}`
    : `${scormUrl}/${entryPoint}`;

  const statusColor =
    status === 'completed' || status === 'passed'
      ? 'text-green-500'
      : status === 'failed'
        ? 'text-red-500'
        : status === 'incomplete'
          ? 'text-amber-500'
          : 'text-muted-foreground';

  const statusIcon =
    status === 'completed' || status === 'passed'
      ? <CheckCircle2 className="h-4 w-4 text-green-500" />
      : status === 'failed'
        ? <AlertTriangle className="h-4 w-4 text-red-500" />
        : <Clock className="h-4 w-4 text-muted-foreground" />;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-3">
          <span className="font-medium text-sm truncate max-w-[300px]">{moduleTitle}</span>
          <Badge variant="outline" className="text-xs">SCORM</Badge>
        </div>

        <div className="flex items-center gap-4">
          {/* Status */}
          <div className="flex items-center gap-1.5">
            {statusIcon}
            <span className={`text-xs font-medium capitalize ${statusColor}`}>{status}</span>
          </div>

          {/* Score */}
          {score !== null && (
            <Badge variant={score >= 70 ? 'default' : 'destructive'} className="text-xs">
              Score: {score}%
            </Badge>
          )}

          {/* Timer */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatTime(elapsed)}
          </div>

          {/* Actions */}
          <Button variant="ghost" size="sm" onClick={toggleFullscreen}>
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* SCORM iframe */}
      <div className="flex-1 relative">
        <iframe
          ref={iframeRef}
          src={contentUrl}
          onLoad={handleIframeLoad}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; microphone; camera"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title={moduleTitle}
        />
      </div>
    </div>
  );
}
