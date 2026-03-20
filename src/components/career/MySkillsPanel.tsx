import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { type AggregatedSkill } from '@/hooks/useCareerProfile';
import { AlertTriangle, Brain, ClipboardCheck } from 'lucide-react';

interface Props {
  skills: AggregatedSkill[];
}

export const MySkillsPanel = ({ skills }: Props) => {
  const { language } = useLanguage();

  if (skills.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'fr' ? 'Mes compétences' : 'My Skills'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === 'fr'
              ? 'Aucune compétence détectée. Complétez votre déclaration ou synchronisez depuis votre poste.'
              : 'No skills detected yet. Complete your declaration or sync from your job title.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const grouped = skills.reduce<Record<string, AggregatedSkill[]>>((acc, s) => {
    const cat = s.categoryName;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {language === 'fr' ? 'Mes compétences' : 'My Skills'}
          <Badge variant="secondary" className="ml-2">{skills.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {Object.entries(grouped).map(([category, catSkills]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-2">{category}</h4>
            <div className="space-y-2">
              {catSkills.map((skill) => (
                <div key={skill.skillId} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{skill.skillName}</span>
                      {skill.source === 'assessed' ? (
                        <Badge variant="outline" className="text-[10px] gap-1 shrink-0">
                          <ClipboardCheck className="h-3 w-3" />
                          {language === 'fr' ? 'Évalué' : 'Assessed'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] gap-1 shrink-0">
                          <Brain className="h-3 w-3" />
                          {language === 'fr' ? 'Inféré' : 'Inferred'}
                        </Badge>
                      )}
                      {skill.isStale && (
                        <Badge variant="destructive" className="text-[10px] gap-1 shrink-0">
                          <AlertTriangle className="h-3 w-3" />
                          {language === 'fr' ? 'À rafraîchir' : 'Needs refresh'}
                        </Badge>
                      )}
                    </div>
                    <Progress
                      value={(skill.currentLevel / 5) * 100}
                      className="h-1.5 mt-1"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                    {skill.currentLevel}/5
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
