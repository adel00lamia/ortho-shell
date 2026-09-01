import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Plus, Presentation, FileText, Users, Lock, Unlock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { COMPANY_SIZES, HR_ROLES, SECTORS } from '@/config/diagnosticEngine';
import {
  useCreateSession, useDiagnosticRealtime, useDiagnosticSessions, useSessionParticipants, useToggleSession,
} from '@/hooks/useDiagnosticEngine';
import { buildCohortInsights, filterParticipants } from '@/lib/diagnosticAggregate';
import { CohortInsightsView } from '@/components/diagnostic/CohortInsightsView';

const ALL = '__all__';

export default function AiHrWorkshops() {
  const { data: sessions = [], isLoading } = useDiagnosticSessions();
  const createSession = useCreateSession();
  const toggle = useToggleSession();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', city: '', event_date: '' });
  const [filters, setFilters] = useState<{ role?: string; companySize?: string; sector?: string }>({});

  const active = sessions.find((s) => s.id === selectedId) ?? sessions[0] ?? null;
  const { data: participants = [] } = useSessionParticipants(active?.id, 30000);
  useDiagnosticRealtime(active?.id);

  const insights = useMemo(
    () => buildCohortInsights(filterParticipants(participants, filters)),
    [participants, filters],
  );

  const participantUrl = active ? `${window.location.origin}/diagnostic/${active.code}` : '';

  const create = async () => {
    if (!form.title.trim()) return;
    try {
      const s = await createSession.mutateAsync({
        title: form.title.trim(),
        city: form.city.trim() || undefined,
        event_date: form.event_date || undefined,
      });
      setSelectedId(s.id);
      setForm({ title: '', city: '', event_date: '' });
      toast.success('Session créée');
    } catch {
      toast.error('Impossible de créer la session. Connectez-vous en tant qu’organisateur.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">AI × HR Diagnostic — Sessions</h1>
          <p className="text-sm text-muted-foreground">
            Diagnostiquer → Prioriser → Apprendre → Expérimenter → Mesurer
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link to="/diagnostic" target="_blank">
            <ExternalLink className="h-4 w-4" /> Ouvrir le diagnostic
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Nouvelle session</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Intitulé</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="AI × HR – Casablanca – Septembre 2026"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Ville</Label>
                  <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Date</Label>
                  <Input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} />
                </div>
              </div>
              <Button className="w-full gap-2" onClick={create} disabled={createSession.isPending || !form.title.trim()}>
                <Plus className="h-4 w-4" /> Créer la session
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Sessions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {isLoading && <p className="text-xs text-muted-foreground">Chargement…</p>}
              {!isLoading && sessions.length === 0 && (
                <p className="text-xs text-muted-foreground">Aucune session pour l’instant.</p>
              )}
              {sessions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedId(s.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    active?.id === s.id ? 'border-primary bg-primary/10' : 'border-border/60 hover:border-primary/40'
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {[s.city, s.event_date].filter(Boolean).join(' • ') || 'Sans date'} · {s.code}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {!active && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">
              Créez une session pour générer un QR code participant.
            </CardContent></Card>
          )}

          {active && (
            <>
              <Card>
                <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <CardTitle className="text-base">{active.title}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      Code session : <span className="font-mono font-bold">{active.code}</span>
                    </p>
                  </div>
                  <Badge variant={active.is_open ? 'default' : 'secondary'}>
                    {active.is_open ? 'Ouverte' : 'Fermée'}
                  </Badge>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-6">
                  <div className="rounded-xl bg-white p-3">
                    <QRCodeSVG value={participantUrl} size={132} />
                  </div>
                  <div className="min-w-[220px] flex-1 space-y-3">
                    <div className="flex gap-2">
                      <Input readOnly value={participantUrl} className="font-mono text-xs" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => { navigator.clipboard.writeText(participantUrl); toast.success('Lien copié'); }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link to={`/diagnostic/live/${active.code}`} target="_blank">
                          <Presentation className="h-4 w-4" /> Écran live
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="gap-2">
                        <Link to={`/diagnostic/report/${active.code}`} target="_blank">
                          <FileText className="h-4 w-4" /> Rapport de session
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => toggle.mutate({ id: active.id, is_open: !active.is_open })}
                      >
                        {active.is_open ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                        {active.is_open ? 'Clôturer' : 'Réouvrir'}
                      </Button>
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {participants.length} participant(s) — résultats anonymisés
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                  <FilterSelect label="Fonction" value={filters.role} options={HR_ROLES.map((r) => ({ value: r.key, label: r.label }))} onChange={(v) => setFilters({ ...filters, role: v })} />
                  <FilterSelect label="Effectif" value={filters.companySize} options={COMPANY_SIZES.map((c) => ({ value: c, label: c }))} onChange={(v) => setFilters({ ...filters, companySize: v })} />
                  <FilterSelect label="Secteur" value={filters.sector} options={SECTORS.map((c) => ({ value: c, label: c }))} onChange={(v) => setFilters({ ...filters, sector: v })} />
                </CardContent>
              </Card>

              <CohortInsightsView insights={insights} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterSelect({ label, value, options, onChange }: {
  label: string; value?: string; options: { value: string; label: string }[]; onChange: (v?: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? ALL} onValueChange={(v) => onChange(v === ALL ? undefined : v)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Tous</SelectItem>
          {options.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}
