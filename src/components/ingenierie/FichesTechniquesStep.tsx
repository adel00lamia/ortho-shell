import { useState } from 'react';
import { useActionsFromTrainingPlans } from '@/hooks/useIngenieriePreFill';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Plus, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeActionReimbursement, computeCostPerHourPerPerson, formatDH } from '@/lib/ofpptFinancials';
import type { IngenierieAction } from '@/hooks/useIngenierie';

interface Props {
  dossierId: string;
  actions: IngenierieAction[];
  onAddAction: (a: Partial<IngenierieAction> & { title: string }) => Promise<void>;
  onUpdateAction: (a: Partial<IngenierieAction> & { id: string }) => Promise<void>;
  onDeleteAction: (id: string) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

function ActionCard({ action, onUpdate, onDelete, fr }: {
  action: IngenierieAction;
  onUpdate: (updates: Partial<IngenierieAction> & { id: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  fr: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  const costPerHPerson = computeCostPerHourPerPerson(
    action.cost_ht ?? 0,
    action.duration_hours ?? 0,
    action.participant_count ?? 0
  );
  const exceedsHourlyCap = costPerHPerson > 40 && costPerHPerson > 0;

  const reimbInfo = computeActionReimbursement(
    action.cost_ht ?? 0,
    action.duration_hours ?? 0,
    action.participant_count ?? 0,
    action.is_planned
  );

  const update = (field: string, value: any) => onUpdate({ id: action.id, [field]: value });

  return (
    <Card className={`border ${exceedsHourlyCap ? 'border-orange-300' : 'border-gray-200'}`}>
      <CardHeader className="pb-2 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className={`h-2 w-2 rounded-full shrink-0 ${action.is_planned ? 'bg-green-500' : 'bg-orange-500'}`} />
            <span className="font-medium text-sm truncate">{action.title || (fr ? 'Nouvelle action' : 'New action')}</span>
            {action.cost_ht && action.cost_ht > 0 && (
              <Badge variant="outline" className="text-xs shrink-0">{formatDH(reimbInfo.cappedAmount)}</Badge>
            )}
            {exceedsHourlyCap && <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button type="button" size="sm" variant="ghost" className="text-xs text-red-500 h-7 px-2"
              onClick={(e) => { e.stopPropagation(); onDelete(action.id); }}>
              {fr ? 'Suppr.' : 'Del.'}
            </Button>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <div>
              <Label className="text-xs">{fr ? 'Intitulé de l\'action *' : 'Action title *'}</Label>
              <Input value={action.title} onChange={(e) => update('title', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Population cible' : 'Target population'}</Label>
              <Input value={action.target_population ?? ''} onChange={(e) => update('target_population', e.target.value)} className="mt-1"
                placeholder={fr ? 'ex. Cadres commerciaux, 15 personnes' : 'e.g. Sales managers, 15 people'} />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Contenu / Programme' : 'Content / Program'}</Label>
              <Textarea rows={3} value={action.content_outline ?? ''} onChange={(e) => update('content_outline', e.target.value)}
                className="mt-1 text-sm resize-none" placeholder={fr ? 'Décrire le contenu pédagogique...' : 'Describe training content...'} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{fr ? 'Durée (jours)' : 'Duration (days)'}</Label>
              <Input type="number" min={0} value={action.duration_days ?? ''} onChange={(e) => update('duration_days', Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Durée (heures)' : 'Duration (hours)'}</Label>
              <Input type="number" min={0} value={action.duration_hours ?? ''} onChange={(e) => update('duration_hours', Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Nbre participants' : 'Participants'}</Label>
              <Input type="number" min={0} value={action.participant_count ?? ''} onChange={(e) => update('participant_count', Number(e.target.value))} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Coût HT (DH)' : 'Cost excl. tax (DH)'}</Label>
              <Input type="number" min={0} value={action.cost_ht ?? ''} onChange={(e) => update('cost_ht', Number(e.target.value))} className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label className="text-xs">{fr ? 'Date début' : 'Start date'}</Label>
              <Input type="date" value={action.planned_start_date ?? ''} onChange={(e) => update('planned_start_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Date fin' : 'End date'}</Label>
              <Input type="date" value={action.planned_end_date ?? ''} onChange={(e) => update('planned_end_date', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Prestataire' : 'Provider'}</Label>
              <Input value={action.provider_name ?? ''} onChange={(e) => update('provider_name', e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">{fr ? 'Lieu' : 'Location'}</Label>
              <Input value={action.location ?? ''} onChange={(e) => update('location', e.target.value)} className="mt-1"
                placeholder={fr ? 'Interne / Ville...' : 'Internal / City...'} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch checked={action.is_planned} onCheckedChange={(v) => update('is_planned', v)} id={`planned-${action.id}`} />
            <Label htmlFor={`planned-${action.id}`} className="cursor-pointer text-sm">
              {action.is_planned
                ? (fr ? 'Formation planifiée (70% remboursé — taux de référence)' : 'Planned training (70% reimbursed — reference rate)')
                : (fr ? 'Formation non planifiée (40% remboursé)' : 'Unplanned training (40% reimbursed)')}
            </Label>
          </div>

          {action.cost_ht && action.cost_ht > 0 && action.duration_hours && action.participant_count && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{fr ? 'Coût/h/pers.' : 'Cost/h/person'}</p>
                <p className={`font-semibold text-sm ${exceedsHourlyCap ? 'text-orange-600' : 'text-green-600'}`}>
                  {costPerHPerson.toFixed(2)} DH
                </p>
                {exceedsHourlyCap && <p className="text-[10px] text-orange-500">{fr ? '> plafond 40 DH' : '> 40 DH cap'}</p>}
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{fr ? 'Taux remboursement' : 'Reimb. rate'}</p>
                <p className="font-semibold text-sm">{(reimbInfo.rate * 100).toFixed(0)}%</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">{fr ? 'Remboursement OFPPT' : 'OFPPT reimb.'}</p>
                <p className="font-semibold text-sm text-blue-700">{formatDH(reimbInfo.cappedAmount)}</p>
              </div>
            </div>
          )}

          {exceedsHourlyCap && (
            <Alert className="border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-xs text-orange-700">
                {fr
                  ? `Hypothèse de référence (non vérifiée) : le coût dépasse le plafond horaire paramétré, le remboursement serait plafonné à ${formatDH(reimbInfo.ofpptHourlyCapAmount ?? 0)}. L'éligibilité et les plafonds dépendent du cadre officiel applicable à la date du dossier.`
                  : `Reference assumption (unverified): cost exceeds the configured hourly ceiling, so reimbursement would be capped at ${formatDH(reimbInfo.ofpptHourlyCapAmount ?? 0)}. Eligibility and ceilings depend on the official framework applicable at the dossier date.`}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export function FichesTechniquesStep({ actions, onAddAction, onUpdateAction, onDeleteAction, onNext, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { data: planSuggestions, isLoading: plansLoading } = useActionsFromTrainingPlans();

  const handleAdd = async () => {
    await onAddAction({ title: fr ? 'Nouvelle action de formation' : 'New training action' });
  };

  const handleImportFromPlans = async () => {
    if (!planSuggestions?.length) return;
    for (const suggestion of planSuggestions) {
      await onAddAction({ ...suggestion, title: suggestion.title });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{actions.length} {fr ? 'actions' : 'actions'}</Badge>
          {actions.length > 0 && actions.every(a => a.cost_ht && a.duration_hours && a.participant_count) && (
            <Badge className="bg-green-100 text-green-700 text-xs">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {fr ? 'Complet' : 'Complete'}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {planSuggestions && planSuggestions.length > 0 && (
            <Button onClick={handleImportFromPlans} size="sm" variant="outline" disabled={plansLoading} className="text-xs border-blue-300 text-blue-700 hover:bg-blue-50">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {fr ? `Importer ${planSuggestions.length} plan(s)` : `Import ${planSuggestions.length} plan(s)`}
            </Button>
          )}
          <Button onClick={handleAdd} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            {fr ? 'Ajouter une action' : 'Add action'}
          </Button>
        </div>
      </div>

      {actions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">{fr ? 'Aucune action de formation. Cliquez sur Ajouter.' : 'No training actions. Click Add.'}</p>
        </div>
      )}

      {actions.map((action) => (
        <ActionCard key={action.id} action={action} onUpdate={onUpdateAction} onDelete={onDeleteAction} fr={fr} />
      ))}

      <div className="flex justify-between pt-2">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Button onClick={onNext} disabled={actions.length === 0}>
          {fr ? 'Suivant' : 'Next'}<ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
