import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { type CareerMatch } from '@/hooks/useCareerProfile';
import { ArrowRight, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  matches: CareerMatch[];
}

export const CareerPathCard = ({ matches }: Props) => {
  const { language } = useLanguage();

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{language === 'fr' ? 'Parcours de carrière suggérés' : 'Suggested Career Paths'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {language === 'fr'
              ? 'Ajoutez plus de compétences pour voir les postes compatibles.'
              : 'Add more skills to see matching positions.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (score >= 50) return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowRight className="h-5 w-5 text-primary" />
          {language === 'fr' ? 'Parcours de carrière suggérés' : 'Suggested Career Paths'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {matches.slice(0, 6).map((match) => (
          <div key={match.jobId} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="font-medium text-sm">{match.title}</h4>
                <p className="text-xs text-muted-foreground">
                  {match.department && `${match.department} · `}{match.level}
                </p>
              </div>
              <Badge className={`${getScoreColor(match.matchScore)} shrink-0 tabular-nums`}>
                {match.matchScore}%
              </Badge>
            </div>

            {match.matchedSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {match.matchedSkills.slice(0, 4).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] gap-1 text-emerald-700">
                    <CheckCircle2 className="h-2.5 w-2.5" /> {s}
                  </Badge>
                ))}
              </div>
            )}

            {match.missingSkills.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {match.missingSkills.slice(0, 3).map((s) => (
                  <Badge key={s} variant="outline" className="text-[10px] gap-1 text-muted-foreground">
                    <XCircle className="h-2.5 w-2.5" /> {s}
                  </Badge>
                ))}
                {match.missingSkills.length > 3 && (
                  <span className="text-[10px] text-muted-foreground">+{match.missingSkills.length - 3} {language === 'fr' ? 'de plus' : 'more'}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
