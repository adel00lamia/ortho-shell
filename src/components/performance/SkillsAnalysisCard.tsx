import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface SkillsAnalysis {
  overallMatch: number;
  matchedSkills: { skill: string; level: string; matchScore: number }[];
  gaps: { skill: string; requiredLevel: string; currentLevel: string; priority: string; recommendation: string }[];
  trainingPlan: { skill: string; action: string; duration: string; priority: string }[];
  summary: string;
}

interface SkillsAnalysisCardProps {
  analysis: SkillsAnalysis | null;
  onAnalysisUpdate: (analysis: SkillsAnalysis) => void;
  resumeSummary: any;
  jobCompetencies: any[];
  competencyScores: any[];
  employeeName: string;
  jobTitle: string;
  language?: string;
}

export default function SkillsAnalysisCard({
  analysis,
  onAnalysisUpdate,
  resumeSummary,
  jobCompetencies,
  competencyScores,
  employeeName,
  jobTitle,
  language = "en",
}: SkillsAnalysisCardProps) {
  const { t } = useLanguage();
  const s = t.performance.skills;
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!resumeSummary?.experience && (!resumeSummary?.skills || resumeSummary.skills.length === 0)) {
      toast.error(s.noResume);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-skills-analysis", {
        body: {
          resumeSummary,
          jobCompetencies,
          competencyScores,
          employeeName,
          jobTitle,
          language,
        },
      });

      if (error) throw error;
      if (data?.analysis) {
        onAnalysisUpdate(data.analysis);
        toast.success(s.analysisSuccess);
      }
    } catch (error: any) {
      console.error("Skills analysis error:", error);
      toast.error(error.message || s.analysisError);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive text-destructive-foreground";
      case "medium": return "bg-yellow-500 text-white";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            {s.title}
          </CardTitle>
          <Button
            type="button"
            onClick={runAnalysis}
            disabled={loading}
            variant="outline"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {analysis ? s.rerunAnalysis : s.runAnalysis}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {!analysis ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            {s.noAnalysis}
          </p>
        ) : (
          <div className="space-y-6">
            <div className="p-4 rounded-lg bg-gradient-to-r from-primary/5 to-primary/10">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{s.overallMatch}</span>
                <span className="text-2xl font-bold">{analysis.overallMatch}%</span>
              </div>
              <Progress value={analysis.overallMatch} className="h-3" />
              <p className="text-sm text-muted-foreground mt-2">{analysis.summary}</p>
            </div>

            {analysis.matchedSkills?.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {s.matchedSkills}
                </h4>
                <div className="grid gap-2">
                  {analysis.matchedSkills.map((ms, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded bg-green-50 dark:bg-green-900/20 border">
                      <span className="text-sm font-medium">{ms.skill}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{ms.level}</Badge>
                        <span className="text-sm text-muted-foreground">{ms.matchScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.gaps?.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  {s.skillGaps}
                </h4>
                <div className="grid gap-2">
                  {analysis.gaps.map((gap, idx) => (
                    <div key={idx} className="p-3 rounded border bg-yellow-50/50 dark:bg-yellow-900/10">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{gap.skill}</span>
                        <Badge className={getPriorityColor(gap.priority)}>{gap.priority}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-1">
                        {s.current}: {gap.currentLevel} → {s.required}: {gap.requiredLevel}
                      </div>
                      <p className="text-sm">{gap.recommendation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.trainingPlan?.length > 0 && (
              <div>
                <h4 className="font-medium flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-primary" />
                  {s.trainingPlan}
                </h4>
                <div className="grid gap-2">
                  {analysis.trainingPlan.map((item, idx) => (
                    <div key={idx} className="p-3 rounded border bg-primary/5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.skill}</span>
                        <div className="flex gap-2">
                          <Badge variant="outline">{item.duration}</Badge>
                          <Badge className={getPriorityColor(item.priority)}>{item.priority}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
