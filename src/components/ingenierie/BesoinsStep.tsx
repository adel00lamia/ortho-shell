import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Plus, X, Users, Building2, Target, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IngenierieDossier } from '@/hooks/useIngenierie';
import { useNeedsSuggestions } from '@/hooks/useIngenieriePreFill';

interface Need {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  targetGroup?: string;
  expectedOutcome?: string;
}

interface Props {
  dossier: IngenierieDossier;
  onSave: (data: Partial<IngenierieDossier>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

function NeedCard({ need, onUpdate, onDelete, fr }: { need: Need; onUpdate: (n: Need) => void; onDelete: () => void; fr: boolean }) {
  const PRIORITY_COLORS = { high: 'bg-red-100 text-red-700', medium: 'bg-yellow-100 text-yellow-700', low: 'bg-green-100 text-green-700' };
  return (
    <Card className="border border-gray-200">
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Input
            value={need.title}
            onChange={(e) => onUpdate({ ...need, title: e.target.value })}
            placeholder={fr ? 'Intitulé du besoin...' : 'Need title...'}
            className="font-medium"
          />
          <Button type="button" size="icon" variant="ghost" onClick={onDelete} className="shrink-0">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          rows={2}
          value={need.description}
          onChange={(e) => onUpdate({ ...need, description: e.target.value })}
          placeholder={fr ? 'Description du besoin...' : 'Need description...'}
          className="text-sm resize-none"
        />
        <div className="grid grid-cols-2 gap-2">
          <Select value={need.priority} onValueChange={(v: any) => onUpdate({ ...need, priority: v })}>
            <SelectTrigger className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">{fr ? 'Priorité haute' : 'High priority'}</SelectItem>
              <SelectItem value="medium">{fr ? 'Priorité moyenne' : 'Medium priority'}</SelectItem>
              <SelectItem value="low">{fr ? 'Priorité basse' : 'Low priority'}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            value={need.targetGroup ?? ''}
            onChange={(e) => onUpdate({ ...need, targetGroup: e.target.value })}
            placeholder={fr ? 'Population cible...' : 'Target group...'}
            className="text-xs h-8"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function NeedsList({ needs, onUpdate, fr, tabKey }: {
  needs: Need[];
  onUpdate: (needs: Need[]) => void;
  fr: boolean;
  tabKey: string;
}) {
  const addNeed = () => {
    onUpdate([...needs, { id: crypto.randomUUID(), title: '', description: '', priority: 'medium' }]);
  };
  const updateNeed = (id: string, updated: Need) => onUpdate(needs.map((n) => n.id === id ? updated : n));
  const deleteNeed = (id: string) => onUpdate(needs.filter((n) => n.id !== id));

  return (
    <div className="space-y-3">
      {needs.map((need) => (
        <NeedCard key={need.id} need={need} onUpdate={(u) => updateNeed(need.id, u)} onDelete={() => deleteNeed(need.id)} fr={fr} />
      ))}
      {needs.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {fr ? 'Aucun besoin identifié. Cliquez sur Ajouter.' : 'No needs identified. Click Add.'}
        </div>
      )}
      <Button type="button" variant="outline" onClick={addNeed} className="w-full text-sm">
        <Plus className="h-4 w-4 mr-2" />
        {fr ? 'Ajouter un besoin' : 'Add a need'}
      </Button>
    </div>
  );
}

function parseNeeds(raw: any): Need[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((n: any) => ({
    id: n.id || crypto.randomUUID(),
    title: n.title || '',
    description: n.description || '',
    priority: n.priority || 'medium',
    targetGroup: n.targetGroup,
    expectedOutcome: n.expectedOutcome,
  }));
}

export function BesoinsStep({ dossier, onSave, onNext, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [individual, setIndividual] = useState<Need[]>(() => parseNeeds(dossier.needs_individual));
  const [collective, setCollective] = useState<Need[]>(() => parseNeeds(dossier.needs_collective));
  const [strategic, setStrategic] = useState<Need[]>(() => parseNeeds(dossier.needs_strategic));
  const { data: suggestions, isLoading: suggestionsLoading } = useNeedsSuggestions();

  const importSuggestions = () => {
    if (!suggestions) return;
    if (individual.length === 0 && suggestions.individualNeeds.length > 0) setIndividual(suggestions.individualNeeds);
    if (collective.length === 0 && suggestions.collectiveNeeds.length > 0) setCollective(suggestions.collectiveNeeds);
    if (strategic.length === 0 && suggestions.strategicNeeds.length > 0) setStrategic(suggestions.strategicNeeds);
  };

  const totalSuggestions = (suggestions?.individualNeeds.length ?? 0)
    + (suggestions?.collectiveNeeds.length ?? 0)
    + (suggestions?.strategicNeeds.length ?? 0);

  const handleNext = async () => {
    await onSave({ needs_individual: individual, needs_collective: collective, needs_strategic: strategic });
    onNext();
  };

  const totalNeeds = individual.length + collective.length + strategic.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Badge variant="outline" className="text-xs">{totalNeeds} {fr ? 'besoins identifiés' : 'needs identified'}</Badge>
        {totalSuggestions > 0 && (
          <Button size="sm" variant="outline" className="text-xs gap-1 border-blue-300 text-blue-700 hover:bg-blue-50" onClick={importSuggestions} disabled={suggestionsLoading}>
            <Sparkles className="h-3.5 w-3.5" />
            {fr ? `Importer ${totalSuggestions} suggestions` : `Import ${totalSuggestions} suggestions`}
          </Button>
        )}
      </div>

      <Tabs defaultValue="collective">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="individual" className="text-xs">
            <Users className="h-3.5 w-3.5 mr-1.5" />
            {fr ? 'Individuels' : 'Individual'}
            {individual.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 h-4">{individual.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="collective" className="text-xs">
            <Building2 className="h-3.5 w-3.5 mr-1.5" />
            {fr ? 'Collectifs' : 'Collective'}
            {collective.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 h-4">{collective.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="strategic" className="text-xs">
            <Target className="h-3.5 w-3.5 mr-1.5" />
            {fr ? 'Stratégiques' : 'Strategic'}
            {strategic.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1 h-4">{strategic.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            {fr ? 'Besoins identifiés lors des entretiens individuels avec les employés.' : 'Needs identified during individual employee interviews.'}
          </p>
          <NeedsList needs={individual} onUpdate={setIndividual} fr={fr} tabKey="individual" />
        </TabsContent>

        <TabsContent value="collective" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            {fr ? 'Besoins partagés par un groupe ou un département.' : 'Needs shared by a group or department.'}
          </p>
          <NeedsList needs={collective} onUpdate={setCollective} fr={fr} tabKey="collective" />
        </TabsContent>

        <TabsContent value="strategic" className="mt-4">
          <p className="text-xs text-muted-foreground mb-3">
            {fr ? 'Besoins découlant des orientations stratégiques de l\'entreprise.' : 'Needs stemming from the company\'s strategic direction.'}
          </p>
          <NeedsList needs={strategic} onUpdate={setStrategic} fr={fr} tabKey="strategic" />
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Button onClick={handleNext}>{fr ? 'Enregistrer & Suivant' : 'Save & Next'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  );
}
