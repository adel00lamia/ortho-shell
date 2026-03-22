import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";
import { normalizeCompetencyScores, type NormalizedCompetencyScore } from "@/lib/normalizeCompetencyScores";

interface PerformanceAnalyticsProps {
  evaluations: any[];
}

export default function PerformanceAnalytics({ evaluations }: PerformanceAnalyticsProps) {
  const { t } = useLanguage();
  const a = t.performance.analytics;

  if (evaluations.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">{a.noData}</p>
        </CardContent>
      </Card>
    );
  }

  const ratingDistribution = evaluations.reduce((acc: any, evaluation: any) => {
    const rating = Math.round(evaluation.overall_rating);
    acc[rating] = (acc[rating] || 0) + 1;
    return acc;
  }, {});

  const ratingData = [1, 2, 3, 4, 5].map(rating => ({
    rating: `${rating} ★`,
    count: ratingDistribution[rating] || 0
  }));

  const competencyAverages = evaluations.reduce((acc: any, evaluation: any) => {
    const scores = normalizeCompetencyScores(evaluation.competency_scores);
    scores.forEach((comp: NormalizedCompetencyScore) => {
      if (!acc[comp.name]) {
        acc[comp.name] = { total: 0, count: 0, category: comp.category };
      }
      acc[comp.name].total += comp.score;
      acc[comp.name].count += 1;
    });
    return acc;
  }, {});

  const competencyData = Object.entries(competencyAverages).map(([name, data]: [string, any]) => ({
    competency: name,
    average: (data.total / data.count).toFixed(1),
    fullMark: 5
  }));

  const topPerformers = [...evaluations]
    .sort((a, b) => b.overall_rating - a.overall_rating)
    .slice(0, 5);

  const improvementAreas = evaluations.reduce((acc: any, evaluation: any) => {
    if (evaluation.areas_for_improvement && Array.isArray(evaluation.areas_for_improvement)) {
      evaluation.areas_for_improvement.forEach((area: string) => {
        acc[area] = (acc[area] || 0) + 1;
      });
    }
    return acc;
  }, {});

  const topImprovementAreas = Object.entries(improvementAreas)
    .sort(([, a]: any, [, b]: any) => b - a)
    .slice(0, 5);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{a.ratingDistribution}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{a.competencyAverages}</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <RadarChart data={competencyData.slice(0, 6)}>
              <PolarGrid />
              <PolarAngleAxis dataKey="competency" />
              <PolarRadiusAxis angle={90} domain={[0, 5]} />
              <Radar name={a.averageScore} dataKey="average" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{a.topPerformers}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((evaluation, idx) => (
              <div key={evaluation.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {idx + 1}
                  </Badge>
                  <div>
                    <div className="font-medium">{evaluation.employee_name}</div>
                    <div className="text-xs text-muted-foreground">{evaluation.department || 'N/A'}</div>
                  </div>
                </div>
                <Badge className="bg-green-500">{evaluation.overall_rating.toFixed(1)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{a.commonImprovementAreas}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topImprovementAreas.map(([area, count]: any, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1 text-sm">{area}</div>
                <Badge variant="secondary">{count} {t.performance.overview.employees}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
