import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Target, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";

interface SkillsOverviewProps {
  evaluations: any[];
}

export default function SkillsOverview({ evaluations }: SkillsOverviewProps) {
  const evalsWithAnalysis = evaluations.filter(
    (e) => e.skills_analysis && typeof e.skills_analysis === "object" && e.skills_analysis.overallMatch != null
  );

  if (evalsWithAnalysis.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Aucune analyse de compétences disponible. Lancez une analyse IA depuis une évaluation pour voir les résultats ici.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Average match score
  const avgMatch =
    evalsWithAnalysis.reduce((sum, e) => sum + (e.skills_analysis.overallMatch || 0), 0) /
    evalsWithAnalysis.length;

  // Match distribution data
  const matchBuckets = [
    { range: "0-25%", min: 0, max: 25, count: 0 },
    { range: "26-50%", min: 26, max: 50, count: 0 },
    { range: "51-75%", min: 51, max: 75, count: 0 },
    { range: "76-100%", min: 76, max: 100, count: 0 },
  ];
  evalsWithAnalysis.forEach((e) => {
    const m = e.skills_analysis.overallMatch || 0;
    const bucket = matchBuckets.find((b) => m >= b.min && m <= b.max);
    if (bucket) bucket.count++;
  });

  // Aggregate gaps by priority
  const gapsByPriority: Record<string, number> = { high: 0, medium: 0, low: 0 };
  const allGaps: Record<string, { count: number; priorities: string[] }> = {};
  const allTraining: Record<string, number> = {};

  evalsWithAnalysis.forEach((e) => {
    const sa = e.skills_analysis;
    if (Array.isArray(sa.gaps)) {
      sa.gaps.forEach((g: any) => {
        gapsByPriority[g.priority] = (gapsByPriority[g.priority] || 0) + 1;
        if (!allGaps[g.skill]) allGaps[g.skill] = { count: 0, priorities: [] };
        allGaps[g.skill].count++;
        allGaps[g.skill].priorities.push(g.priority);
      });
    }
    if (Array.isArray(sa.trainingPlan)) {
      sa.trainingPlan.forEach((t: any) => {
        allTraining[t.skill] = (allTraining[t.skill] || 0) + 1;
      });
    }
  });

  const topGaps = Object.entries(allGaps)
    .sort(([, a], [, b]) => b.count - a.count)
    .slice(0, 8);

  const topTraining = Object.entries(allTraining)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6);

  // Matched skills radar (top skills across employees)
  const matchedSkillsAgg: Record<string, { total: number; count: number }> = {};
  evalsWithAnalysis.forEach((e) => {
    if (Array.isArray(e.skills_analysis.matchedSkills)) {
      e.skills_analysis.matchedSkills.forEach((ms: any) => {
        if (!matchedSkillsAgg[ms.skill]) matchedSkillsAgg[ms.skill] = { total: 0, count: 0 };
        matchedSkillsAgg[ms.skill].total += ms.matchScore || 0;
        matchedSkillsAgg[ms.skill].count++;
      });
    }
  });

  const radarData = Object.entries(matchedSkillsAgg)
    .map(([skill, d]) => ({ skill, score: Math.round(d.total / d.count) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  // Per-employee summary
  const employeeSummaries = evalsWithAnalysis.map((e) => ({
    name: e.employee_name,
    department: e.department || "N/A",
    match: e.skills_analysis.overallMatch || 0,
    gapsCount: Array.isArray(e.skills_analysis.gaps) ? e.skills_analysis.gaps.length : 0,
    highPriorityGaps: Array.isArray(e.skills_analysis.gaps)
      ? e.skills_analysis.gaps.filter((g: any) => g.priority === "high").length
      : 0,
  }));

  const getPriorityColor = (p: string) => {
    if (p === "high") return "text-destructive";
    if (p === "medium") return "text-yellow-600 dark:text-yellow-400";
    return "text-muted-foreground";
  };

  const getMatchColor = (m: number) => {
    if (m >= 75) return "text-green-600 dark:text-green-400";
    if (m >= 50) return "text-yellow-600 dark:text-yellow-400";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{Math.round(avgMatch)}%</p>
                <p className="text-xs text-muted-foreground">Correspondance moyenne</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{evalsWithAnalysis.length}</p>
                <p className="text-xs text-muted-foreground">Analyses réalisées</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{gapsByPriority.high || 0}</p>
                <p className="text-xs text-muted-foreground">Lacunes prioritaires</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{Object.keys(allTraining).length}</p>
                <p className="text-xs text-muted-foreground">Formations recommandées</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Match Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution des correspondances</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={matchBuckets}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skills Radar */}
        {radarData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Compétences les plus fortes</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Score moyen" dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.5} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Top Skill Gaps */}
        <Card>
          <CardHeader>
            <CardTitle>Lacunes les plus fréquentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topGaps.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">Aucune lacune identifiée</p>
              ) : (
                topGaps.map(([skill, data], idx) => {
                  const highCount = data.priorities.filter((p) => p === "high").length;
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex-1">
                        <span className="text-sm font-medium">{skill}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {highCount > 0 && (
                          <Badge variant="destructive" className="text-xs">{highCount} urgent</Badge>
                        )}
                        <Badge variant="secondary">{data.count} employés</Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Training Needs */}
        <Card>
          <CardHeader>
            <CardTitle>Formations les plus recommandées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topTraining.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center">Aucune formation recommandée</p>
              ) : (
                topTraining.map(([skill, count], idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">{skill}</span>
                    <Badge variant="outline">{count} employés</Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Per-Employee Table */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé par employé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeeSummaries
              .sort((a, b) => a.match - b.match)
              .map((emp, idx) => (
                <div key={idx} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{emp.name}</div>
                    <div className="text-xs text-muted-foreground">{emp.department}</div>
                  </div>
                  <div className="w-32">
                    <Progress value={emp.match} className="h-2" />
                  </div>
                  <span className={`text-sm font-bold w-12 text-right ${getMatchColor(emp.match)}`}>
                    {emp.match}%
                  </span>
                  <div className="flex gap-1">
                    {emp.highPriorityGaps > 0 && (
                      <Badge variant="destructive" className="text-xs">{emp.highPriorityGaps} urgent</Badge>
                    )}
                    {emp.gapsCount > 0 && (
                      <Badge variant="secondary" className="text-xs">{emp.gapsCount} lacunes</Badge>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
