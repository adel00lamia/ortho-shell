import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeCompetencyScores, type NormalizedCompetencyScore } from "@/lib/normalizeCompetencyScores";

interface CompetencyScoreCardProps {
  competencies: NormalizedCompetencyScore[] | Record<string, number> | unknown;
  onScoreUpdate: (index: number, score: number) => void;
  readOnly?: boolean;
}

const scoreColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500'];

export default function CompetencyScoreCard({ competencies, onScoreUpdate, readOnly = false }: CompetencyScoreCardProps) {
  const { t } = useLanguage();
  const r = t.performance.form.ratings;

  const scoreLabels = [r.needsImprovement, r.below, r.meets, r.exceeds, r.exceptional];

  if (competencies.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center">
          {t.performance.form.selectJobDescription}
        </p>
      </Card>
    );
  }

  const averageScore = competencies.reduce((sum, c) => sum + c.score, 0) / competencies.length;

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">{t.performance.form.overallRating}</span>
          <span className="text-2xl font-bold">{averageScore.toFixed(1)}/5</span>
        </div>
        <Progress value={(averageScore / 5) * 100} className="h-2" />
        <p className="text-xs text-muted-foreground mt-2">{scoreLabels[Math.round(averageScore) - 1]}</p>
      </Card>

      <div className="grid gap-3">
        {competencies.map((comp, idx) => (
          <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1">
                <div className="font-medium">{comp.name}</div>
                <div className="text-xs text-muted-foreground">{comp.category}</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className={`h-2 rounded-full ${scoreColors[comp.score - 1]} transition-all`} 
                       style={{ width: `${(comp.score / 5) * 100}%` }} />
                  <span className="text-xs text-muted-foreground">{comp.score}/5</span>
                </div>
              </div>
              {!readOnly && (
                <Select 
                  value={comp.score.toString()} 
                  onValueChange={(value) => onScoreUpdate(idx, parseFloat(value))}
                >
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(score => (
                      <SelectItem key={score} value={score.toString()}>
                        {score} - {scoreLabels[score - 1]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
