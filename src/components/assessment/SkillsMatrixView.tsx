import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { BarChart3, AlertTriangle, TrendingUp, Users } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  level: string;
  status: string;
  current_holder_name: string | null;
  department_id: string | null;
  is_critical: boolean;
  match_score: number | null;
  upskill_potential: boolean;
  reskill_candidate: boolean;
  skills_required: any;
  skills_current: any;
}

interface SkillsMatrixViewProps {
  positions: Position[];
  evaluations: any[];
  jobDescriptions: any[];
}

export const SkillsMatrixView = ({ positions, evaluations, jobDescriptions }: SkillsMatrixViewProps) => {
  const { language } = useLanguage();

  // Aggregate skills from all sources
  const allRequiredSkills = new Map<string, { count: number; avgLevel: number }>();
  const allCurrentSkills = new Map<string, { count: number; avgLevel: number }>();

  // From positions
  positions.forEach(pos => {
    const required = Array.isArray(pos.skills_required) ? pos.skills_required : [];
    const current = Array.isArray(pos.skills_current) ? pos.skills_current : [];
    required.forEach((s: any) => {
      const name = typeof s === 'string' ? s : s?.name;
      if (!name) return;
      const existing = allRequiredSkills.get(name) || { count: 0, avgLevel: 0 };
      existing.count += 1;
      existing.avgLevel = (existing.avgLevel * (existing.count - 1) + (s?.level || 3)) / existing.count;
      allRequiredSkills.set(name, existing);
    });
    current.forEach((s: any) => {
      const name = typeof s === 'string' ? s : s?.name;
      if (!name) return;
      const existing = allCurrentSkills.get(name) || { count: 0, avgLevel: 0 };
      existing.count += 1;
      existing.avgLevel = (existing.avgLevel * (existing.count - 1) + (s?.level || 2)) / existing.count;
      allCurrentSkills.set(name, existing);
    });
  });

  // From job descriptions
  jobDescriptions.forEach(jd => {
    const competencies = Array.isArray(jd.competencies) ? jd.competencies : [];
    competencies.forEach((c: any) => {
      const name = c?.name || c;
      if (!name || typeof name !== 'string') return;
      const existing = allRequiredSkills.get(name) || { count: 0, avgLevel: 0 };
      existing.count += 1;
      existing.avgLevel = (existing.avgLevel * (existing.count - 1) + (c?.level || 3)) / existing.count;
      allRequiredSkills.set(name, existing);
    });
  });

  // Build gap analysis
  const gaps = Array.from(allRequiredSkills.entries()).map(([skill, required]) => {
    const current = allCurrentSkills.get(skill);
    const currentLevel = current?.avgLevel || 0;
    const gap = Math.max(0, required.avgLevel - currentLevel);
    const coverage = required.avgLevel > 0 ? Math.round((currentLevel / required.avgLevel) * 100) : 0;
    return { skill, required: required.avgLevel, current: currentLevel, gap, coverage, positions: required.count };
  }).sort((a, b) => b.gap - a.gap);

  const criticalGaps = gaps.filter(g => g.coverage < 50);
  const moderateGaps = gaps.filter(g => g.coverage >= 50 && g.coverage < 75);
  const coveredSkills = gaps.filter(g => g.coverage >= 75);
  const overallCoverage = gaps.length > 0 ? Math.round(gaps.reduce((sum, g) => sum + g.coverage, 0) / gaps.length) : 0;

  const upskillCandidates = positions.filter(p => p.upskill_potential || (p.match_score != null && p.match_score >= 50 && p.match_score < 80));
  const reskillCandidates = positions.filter(p => p.reskill_candidate || (p.match_score != null && p.match_score < 50));

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Couverture globale' : 'Overall Coverage'}</span>
          </div>
          <div className="text-2xl font-bold">{overallCoverage}%</div>
          <Progress value={overallCoverage} className="mt-1" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Gaps critiques' : 'Critical Gaps'}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalGaps.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{language === 'fr' ? 'Upskilling' : 'Upskilling'}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{upskillCandidates.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">Reskilling</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{reskillCandidates.length}</div>
        </Card>
      </div>

      {/* Skills Heatmap */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'fr' ? 'Matrice des compétences' : 'Skills Matrix'}</CardTitle>
          <CardDescription>
            {language === 'fr' ? 'Écarts entre compétences requises et actuelles' : 'Gaps between required and current competencies'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {gaps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'fr' ? 'Ajoutez des postes avec des compétences pour voir la matrice' : 'Add positions with skills to see the matrix'}
            </div>
          ) : (
            <div className="space-y-3">
              {criticalGaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-4 w-4" />
                    {language === 'fr' ? 'Gaps critiques (< 50% couverture)' : 'Critical Gaps (< 50% coverage)'}
                  </h4>
                  {criticalGaps.map(g => (
                    <SkillBar key={g.skill} {...g} language={language} severity="critical" />
                  ))}
                </div>
              )}
              {moderateGaps.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-amber-600 mb-2">
                    {language === 'fr' ? 'Gaps modérés (50-75%)' : 'Moderate Gaps (50-75%)'}
                  </h4>
                  {moderateGaps.map(g => (
                    <SkillBar key={g.skill} {...g} language={language} severity="moderate" />
                  ))}
                </div>
              )}
              {coveredSkills.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-green-600 mb-2">
                    {language === 'fr' ? 'Compétences couvertes (≥ 75%)' : 'Covered Skills (≥ 75%)'}
                  </h4>
                  {coveredSkills.slice(0, 5).map(g => (
                    <SkillBar key={g.skill} {...g} language={language} severity="good" />
                  ))}
                  {coveredSkills.length > 5 && (
                    <p className="text-xs text-muted-foreground">+{coveredSkills.length - 5} {language === 'fr' ? 'autres' : 'more'}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upskill / Reskill candidates */}
      {(upskillCandidates.length > 0 || reskillCandidates.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {upskillCandidates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  {language === 'fr' ? 'Candidats Upskilling' : 'Upskilling Candidates'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {upskillCandidates.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-950/20">
                    <div>
                      <span className="text-sm font-medium">{p.current_holder_name || p.title}</span>
                      <p className="text-xs text-muted-foreground">{p.title}</p>
                    </div>
                    {p.match_score != null && <Badge variant="outline">{Math.round(p.match_score)}%</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {reskillCandidates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-amber-500" />
                  {language === 'fr' ? 'Candidats Reskilling' : 'Reskilling Candidates'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {reskillCandidates.map(p => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                    <div>
                      <span className="text-sm font-medium">{p.current_holder_name || p.title}</span>
                      <p className="text-xs text-muted-foreground">{p.title}</p>
                    </div>
                    {p.match_score != null && <Badge variant="destructive">{Math.round(p.match_score)}%</Badge>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

const SkillBar = ({ skill, coverage, positions, severity, language }: {
  skill: string; coverage: number; positions: number; severity: string; language: string;
}) => (
  <div className="flex items-center gap-3 mb-2">
    <span className="text-sm w-40 truncate">{skill}</span>
    <div className="flex-1">
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            severity === 'critical' ? 'bg-red-500' : severity === 'moderate' ? 'bg-amber-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(100, coverage)}%` }}
        />
      </div>
    </div>
    <span className="text-xs font-medium w-12 text-right">{coverage}%</span>
    <Badge variant="outline" className="text-xs">{positions} {language === 'fr' ? 'postes' : 'pos.'}</Badge>
  </div>
);
