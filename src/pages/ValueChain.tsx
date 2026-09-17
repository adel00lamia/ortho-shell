import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Stethoscope, ClipboardCheck, Target, BookOpen, TrendingUp, UserCheck,
  Plus, Check, Trash2, Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRole } from '@/hooks/useUserRole';
import {
  useDevelopmentItems,
  DEVELOPMENT_STAGES,
  NEXT_STATUS,
  type DevelopmentItemRow,
  type DevelopmentLever,
  type DevelopmentStatus,
} from '@/hooks/useDevelopmentItems';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/EmptyState';
import { Seo } from '@/components/seo/Seo';

const STAGE_LABELS: Record<'fr' | 'en', Record<DevelopmentStatus, string>> = {
  fr: {
    detected: 'Besoin détecté',
    decided: 'Levier décidé',
    planned: 'Inscrit au plan',
    in_training: 'Formation en cours',
    completed: 'Compétence acquise',
    cancelled: 'Abandonné',
  },
  en: {
    detected: 'Need detected',
    decided: 'Lever decided',
    planned: 'In the plan',
    in_training: 'Training running',
    completed: 'Skill acquired',
    cancelled: 'Cancelled',
  },
};

const LEVER_LABELS: Record<'fr' | 'en', Record<DevelopmentLever, string>> = {
  fr: { upskilling: 'Montée en compétence', reskilling: 'Reconversion', no_training: 'Hors formation' },
  en: { upskilling: 'Upskilling', reskilling: 'Reskilling', no_training: 'Not training' },
};

const STAGE_ICONS: Record<DevelopmentStatus, any> = {
  detected: Stethoscope,
  decided: ClipboardCheck,
  planned: Target,
  in_training: BookOpen,
  completed: UserCheck,
  cancelled: Trash2,
};

export default function ValueChain() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { companyId } = useCompanyId();
  const { role } = useUserRole();
  const canEdit = role === 'admin' || role === 'hr_manager';
  const {
    items, untrackedGaps, stats, loading,
    addGaps, updateItem, completeItem, deleteItem,
  } = useDevelopmentItems();

  const [selectedGaps, setSelectedGaps] = useState<string[]>([]);
  const [achieved, setAchieved] = useState<Record<string, string>>({});

  const plansQuery = useQuery({
    queryKey: ['value-chain-plans', companyId],
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('training_plans')
        .select('id, title')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false });
      return (data ?? []) as Array<{ id: string; title: string }>;
    },
    enabled: !!companyId,
  });
  const plans = plansQuery.data ?? [];

  const stageCounts = useMemo<Record<DevelopmentStatus, number>>(
    () => ({
      detected: stats.detected,
      decided: stats.decided,
      planned: stats.planned,
      in_training: stats.inTraining,
      completed: stats.completed,
      cancelled: 0,
    }),
    [stats]
  );

  const toggleGap = (key: string) =>
    setSelectedGaps((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  const addSelected = () => {
    const gaps = untrackedGaps.filter((g) => selectedGaps.includes(g.key));
    if (!gaps.length) return;
    addGaps.mutate(gaps, { onSuccess: () => setSelectedGaps([]) });
  };

  const advance = (item: DevelopmentItemRow) => {
    const next = NEXT_STATUS[item.status];
    if (!next) return;
    if (next === 'completed') {
      const raw = achieved[item.id];
      const level = Number(raw ?? item.target_level ?? 0);
      if (!Number.isFinite(level) || level <= 0) return;
      completeItem.mutate({ item, achievedLevel: level });
      return;
    }
    updateItem.mutate({ id: item.id, patch: { status: next } });
  };

  return (
    <div className="space-y-6">
      <Seo
        title={fr ? 'Chaîne de valeur formation — Qimatak' : 'Training value chain — Qimatak'}
        description={
          fr
            ? 'Du besoin détecté à la compétence acquise : une seule colonne vertébrale reliant diagnostic, plan, formation interne et carrière.'
            : 'From detected need to acquired skill: one spine linking diagnosis, plan, internal training and career.'
        }
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          {fr ? 'Chaîne de valeur' : 'Value chain'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
          {fr
            ? 'Chaque écart de compétence suit un seul fil : détection, décision (montée en compétence ou reconversion), inscription au plan, formation interne, puis mise à jour du niveau de la personne.'
            : 'Every skill gap follows a single thread: detection, decision (upskilling or reskilling), plan entry, internal training, then the person’s level is updated.'}
        </p>
      </div>

      {/* Funnel */}
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {DEVELOPMENT_STAGES.map((stage, index) => {
          const Icon = STAGE_ICONS[stage];
          return (
            <motion.div
              key={stage}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="h-full">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    {index < DEVELOPMENT_STAGES.length - 1 && (
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                    )}
                  </div>
                  <p className="text-2xl font-semibold mt-3">
                    {loading ? <Skeleton className="h-7 w-10" /> : stageCounts[stage]}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {STAGE_LABELS[fr ? 'fr' : 'en'][stage]}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Levers */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{fr ? 'Montées en compétence' : 'Upskilling'}</p>
            <p className="text-xl font-semibold mt-1">{stats.upskilling}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{fr ? 'Reconversions' : 'Reskilling'}</p>
            <p className="text-xl font-semibold mt-1">{stats.reskilling}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{fr ? 'Personnes couvertes' : 'People covered'}</p>
            <p className="text-xl font-semibold mt-1">{stats.peopleCovered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">{fr ? 'Niveaux gagnés' : 'Levels gained'}</p>
            <p className="text-xl font-semibold mt-1">{stats.levelsGained}</p>
          </CardContent>
        </Card>
      </div>

      {/* Untracked gaps */}
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-base">
              {fr ? 'Écarts détectés non pris en charge' : 'Detected gaps not yet handled'}
            </CardTitle>
            <CardDescription>
              {fr
                ? 'Écarts issus de l’évaluation des compétences qui n’ont encore aucun levier décidé.'
                : 'Gaps from the skills assessment with no lever decided yet.'}
            </CardDescription>
          </div>
          {canEdit && selectedGaps.length > 0 && (
            <Button size="sm" onClick={addSelected} disabled={addGaps.isPending}>
              {addGaps.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              <span className="ml-2">
                {fr ? `Prendre en charge (${selectedGaps.length})` : `Take on (${selectedGaps.length})`}
              </span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : untrackedGaps.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              title={fr ? 'Aucun écart en attente' : 'No pending gap'}
              description={
                fr
                  ? 'Renseignez les niveaux actuels et cibles dans Compétences pour alimenter la chaîne.'
                  : 'Fill in current and target levels in Capabilities to feed the chain.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" />
                  <TableHead>{fr ? 'Personne' : 'Person'}</TableHead>
                  <TableHead>{fr ? 'Compétence' : 'Skill'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Actuel' : 'Current'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Cible' : 'Target'}</TableHead>
                  <TableHead className="text-right">{fr ? 'Écart' : 'Gap'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {untrackedGaps.slice(0, 25).map((gap) => (
                  <TableRow key={gap.key}>
                    <TableCell>
                      <Checkbox
                        checked={selectedGaps.includes(gap.key)}
                        onCheckedChange={() => toggleGap(gap.key)}
                        disabled={!canEdit}
                        aria-label={fr ? 'Sélectionner l’écart' : 'Select gap'}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{gap.employee_name}</TableCell>
                    <TableCell>{gap.skill_name}</TableCell>
                    <TableCell className="text-right">{gap.current_level}</TableCell>
                    <TableCell className="text-right">{gap.target_level}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={gap.delta >= 2 ? 'destructive' : 'secondary'}>+{gap.delta}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Tracked items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {fr ? 'Plan de développement suivi' : 'Tracked development plan'}
          </CardTitle>
          <CardDescription>
            {fr
              ? 'Faites avancer chaque ligne d’étape en étape. À la clôture, le niveau atteint est écrit sur la fiche de la personne.'
              : 'Move each line stage by stage. On completion, the achieved level is written onto the person’s record.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-24 w-full" />
          ) : items.length === 0 ? (
            <EmptyState
              icon={TrendingUp}
              title={fr ? 'Chaîne vide' : 'Empty chain'}
              description={
                fr
                  ? 'Prenez en charge un écart ci-dessus, ou partez d’un diagnostic de cause racine.'
                  : 'Take on a gap above, or start from a root-cause diagnostic.'
              }
              actionLabel={fr ? 'Ouvrir un diagnostic' : 'Open a diagnostic'}
              onAction={() => navigate('/workflow/assess/root-cause')}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{fr ? 'Personne' : 'Person'}</TableHead>
                    <TableHead>{fr ? 'Compétence' : 'Skill'}</TableHead>
                    <TableHead>{fr ? 'Levier' : 'Lever'}</TableHead>
                    <TableHead>{fr ? 'Plan' : 'Plan'}</TableHead>
                    <TableHead>{fr ? 'Étape' : 'Stage'}</TableHead>
                    <TableHead className="text-right">{fr ? 'Action' : 'Action'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const next = NEXT_STATUS[item.status];
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.employee_name}
                          {item.department && (
                            <span className="block text-xs text-muted-foreground">{item.department}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {item.skill_name}
                          <span className="block text-xs text-muted-foreground">
                            {item.current_level ?? '—'} → {item.target_level ?? '—'}
                            {item.achieved_level != null && ` (${fr ? 'atteint' : 'reached'} ${item.achieved_level})`}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.lever}
                            disabled={!canEdit}
                            onValueChange={(value) =>
                              updateItem.mutate({ id: item.id, patch: { lever: value as DevelopmentLever } })
                            }
                          >
                            <SelectTrigger className="w-[190px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(['upskilling', 'reskilling', 'no_training'] as DevelopmentLever[]).map((lever) => (
                                <SelectItem key={lever} value={lever}>
                                  {LEVER_LABELS[fr ? 'fr' : 'en'][lever]}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={item.training_plan_id ?? 'none'}
                            disabled={!canEdit || plans.length === 0}
                            onValueChange={(value) =>
                              updateItem.mutate({
                                id: item.id,
                                patch: { training_plan_id: value === 'none' ? null : value },
                              })
                            }
                          >
                            <SelectTrigger className="w-[180px]">
                              <SelectValue placeholder={fr ? 'Aucun' : 'None'} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{fr ? 'Aucun' : 'None'}</SelectItem>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id}>
                                  {plan.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                            {STAGE_LABELS[fr ? 'fr' : 'en'][item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {canEdit && next === 'completed' && (
                              <Input
                                type="number"
                                min={1}
                                className="w-16"
                                placeholder={String(item.target_level ?? '')}
                                value={achieved[item.id] ?? ''}
                                onChange={(e) =>
                                  setAchieved((prev) => ({ ...prev, [item.id]: e.target.value }))
                                }
                                aria-label={fr ? 'Niveau atteint' : 'Achieved level'}
                              />
                            )}
                            {canEdit && next && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => advance(item)}
                                disabled={updateItem.isPending || completeItem.isPending}
                              >
                                {next === 'completed' ? (
                                  <Check className="h-4 w-4" />
                                ) : (
                                  <ArrowRight className="h-4 w-4" />
                                )}
                                <span className="ml-2 hidden sm:inline">
                                  {STAGE_LABELS[fr ? 'fr' : 'en'][next]}
                                </span>
                              </Button>
                            )}
                            {canEdit && (
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => deleteItem.mutate(item.id)}
                                aria-label={fr ? 'Supprimer' : 'Delete'}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
