import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  linkObjectives,
  objectiveCoverage,
  suggestedDeliveryFromObjectives,
  suggestedSkillsFromObjectives,
} from '@/lib/objectiveAlignment';

interface Props {
  objectives: string[];
  targetSkills: string[];
  deliveryMethods: string[];
  deliveryLabels: Record<string, string>;
  onAddSkills: (skills: string[]) => void;
  onAddDeliveryMethods: (methods: string[]) => void;
}

export function ObjectiveAlignmentCard({
  objectives,
  targetSkills,
  deliveryMethods,
  deliveryLabels,
  onAddSkills,
  onAddDeliveryMethods,
}: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';

  if (objectives.length === 0) return null;

  const links = linkObjectives(objectives, fr ? 'fr' : 'en');
  const coverage = objectiveCoverage(objectives, targetSkills);
  const missingSkills = suggestedSkillsFromObjectives(objectives, targetSkills);
  const missingDelivery = suggestedDeliveryFromObjectives(objectives, deliveryMethods);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4" />
          {fr ? 'Objectifs → choix de formation' : 'Objectives → training choices'}
        </CardTitle>
        <CardDescription>
          {fr
            ? 'Chaque objectif est relié aux compétences, modalités et indicateurs à retenir pour affiner le plan.'
            : 'Each objective is linked to the skills, delivery modes and indicators to refine the plan.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">
              {fr ? 'Objectifs couverts par les compétences retenues' : 'Objectives covered by selected skills'}
            </span>
            <span className="font-semibold">
              {coverage.covered.length}/{links.length}
            </span>
          </div>
          <Progress value={coverage.ratio} className="h-2" />
        </div>

        <div className="space-y-3">
          {links.map((link, idx) => {
            const selected = new Set(targetSkills.map((s) => s.toLowerCase()));
            return (
              <div key={idx} className="rounded-lg border bg-background/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{link.objective}</span>
                  <Badge variant={link.matched ? 'secondary' : 'outline'}>{link.themeLabel}</Badge>
                </div>

                {link.skills.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {link.skills.map((skill) => {
                      const isSelected = selected.has(skill.toLowerCase());
                      return (
                        <Button
                          key={skill}
                          type="button"
                          size="sm"
                          variant={isSelected ? 'secondary' : 'outline'}
                          className="h-7 text-xs"
                          onClick={() => !isSelected && onAddSkills([skill])}
                        >
                          {!isSelected && <Plus className="h-3 w-3 mr-1" />}
                          {skill}
                        </Button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-2">
                    {fr
                      ? 'Objectif trop général : précisez-le pour obtenir des compétences cibles.'
                      : 'Objective too generic: refine it to get target skills.'}
                  </p>
                )}

                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                  {link.deliveryMethods.length > 0 && (
                    <span>
                      {fr ? 'Modalités conseillées : ' : 'Suggested delivery: '}
                      {link.deliveryMethods.map((m) => deliveryLabels[m] ?? m).join(', ')}
                    </span>
                  )}
                  <span>
                    {fr ? 'Indicateur : ' : 'Indicator: '}
                    {link.measure}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {(missingSkills.length > 0 || missingDelivery.length > 0) && (
          <div className="flex flex-wrap gap-2 pt-1">
            {missingSkills.length > 0 && (
              <Button type="button" size="sm" onClick={() => onAddSkills(missingSkills)}>
                <Sparkles className="h-4 w-4 mr-1" />
                {fr
                  ? `Ajouter les ${missingSkills.length} compétences alignées`
                  : `Add the ${missingSkills.length} aligned skills`}
              </Button>
            )}
            {missingDelivery.length > 0 && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => onAddDeliveryMethods(missingDelivery)}
              >
                {fr ? 'Appliquer les modalités conseillées' : 'Apply suggested delivery modes'}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ObjectiveAlignmentCard;
