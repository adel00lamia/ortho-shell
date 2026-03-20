import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Sparkles, BarChart3, Loader2, Target, BookOpen, Users, ArrowUp, ArrowDown, Minus, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAIPerformanceReview, type AutoEvaluateResult, type SmartRecommendationsResult, type PeerBenchmarkResult } from '@/hooks/useAIPerformanceReview';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';

interface AIPerformancePanelProps {
  evaluation: any;
  allEvaluations: any[];
  onApplyAutoEval?: (result: AutoEvaluateResult) => void;
}

const typeIcons: Record<string, typeof BookOpen> = {
  course: BookOpen,
  mentoring: Users,
  project: Target,
  certification: CheckCircle,
  workshop: Brain,
};

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
};

const standingIcons = { ahead: ArrowUp, on_par: Minus, behind: ArrowDown };
const standingColors = {
  ahead: 'text-emerald-600',
  on_par: 'text-muted-foreground',
  behind: 'text-red-500',
};

export default function AIPerformancePanel({ evaluation, allEvaluations, onApplyAutoEval }: AIPerformancePanelProps) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { autoEvaluate, getSmartRecommendations, getPeerBenchmark, loading } = useAIPerformanceReview();

  const [autoEvalResult, setAutoEvalResult] = useState<AutoEvaluateResult | null>(null);
  const [recommendations, setRecommendations] = useState<SmartRecommendationsResult | null>(null);
  const [benchmark, setBenchmark] = useState<PeerBenchmarkResult | null>(null);

  const evalParams = {
    employeeName: evaluation.employee_name,
    department: evaluation.department,
    jobTitle: evaluation.job_title || evaluation.department,
    competencyScores: evaluation.competency_scores as any[],
    strengths: evaluation.strengths,
    areasForImprovement: evaluation.areas_for_improvement,
    resumeSummary: evaluation.resume_summary,
  };

  const handleAutoEvaluate = async () => {
    try {
      const result = await autoEvaluate(evalParams);
      if (result) {
        setAutoEvalResult(result);
        toast.success(fr ? 'Auto-évaluation générée' : 'Auto-evaluation generated');
      }
    } catch {
      toast.error(fr ? 'Erreur lors de l\'auto-évaluation' : 'Auto-evaluation failed');
    }
  };

  const handleRecommendations = async () => {
    try {
      const result = await getSmartRecommendations(evalParams);
      if (result) {
        setRecommendations(result);
        toast.success(fr ? 'Recommandations générées' : 'Recommendations generated');
      }
    } catch {
      toast.error(fr ? 'Erreur lors de la génération' : 'Failed to generate recommendations');
    }
  };

  const handleBenchmark = async () => {
    try {
      const result = await getPeerBenchmark({ ...evalParams, allEvaluations });
      if (result) {
        setBenchmark(result);
        toast.success(fr ? 'Benchmark généré' : 'Benchmark generated');
      }
    } catch {
      toast.error(fr ? 'Erreur lors du benchmark' : 'Benchmark failed');
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          {fr ? 'Intelligence IA Performance' : 'AI Performance Intelligence'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="auto-eval" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto-eval" className="text-xs">
              <Sparkles className="w-3 h-3 mr-1" />
              {fr ? 'Auto-Éval' : 'Auto-Eval'}
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs">
              <Target className="w-3 h-3 mr-1" />
              {fr ? 'Formations' : 'Training'}
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="text-xs">
              <BarChart3 className="w-3 h-3 mr-1" />
              Benchmark
            </TabsTrigger>
          </TabsList>

          {/* Auto-Evaluate Tab */}
          <TabsContent value="auto-eval" className="space-y-4">
            {!autoEvalResult ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {fr
                    ? "L'IA pré-remplit les notes et compétences à partir du CV et de la fiche de poste."
                    : 'AI pre-fills ratings & competency scores from resume + job description.'}
                </p>
                <Button onClick={handleAutoEvaluate} disabled={loading === 'auto_evaluate'}>
                  {loading === 'auto_evaluate' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {fr ? 'Lancer l\'auto-évaluation' : 'Run Auto-Evaluate'}
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-3xl font-bold">{autoEvalResult.suggestedRating.toFixed(1)}</span>
                      <span className="text-muted-foreground">/5</span>
                    </div>
                    <Badge variant="outline">{fr ? 'Confiance' : 'Confidence'}: {autoEvalResult.confidence}%</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{autoEvalResult.summary}</p>

                  {autoEvalResult.competencyScores.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{fr ? 'Scores suggérés' : 'Suggested Scores'}</h4>
                      {autoEvalResult.competencyScores.map((c, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                          <span>{c.name}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={(c.score / 5) * 100} className="w-16 h-2" />
                            <span className="font-medium w-6 text-right">{c.score}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {onApplyAutoEval && (
                    <Button onClick={() => onApplyAutoEval(autoEvalResult)} className="w-full" variant="outline">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {fr ? 'Appliquer à l\'évaluation' : 'Apply to Evaluation'}
                    </Button>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Smart Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-4">
            {!recommendations ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {fr
                    ? "L'IA suggère des formations personnalisées basées sur les lacunes identifiées."
                    : 'AI suggests personalized training based on identified gaps.'}
                </p>
                <Button onClick={handleRecommendations} disabled={loading === 'smart_recommendations'}>
                  {loading === 'smart_recommendations' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Target className="w-4 h-4 mr-2" />}
                  {fr ? 'Générer les recommandations' : 'Generate Recommendations'}
                </Button>
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <p className="text-sm text-muted-foreground">{recommendations.developmentPath}</p>
                  <Badge variant="outline">{fr ? 'Durée estimée' : 'Est. time'}: {recommendations.estimatedTimeToTarget}</Badge>

                  <div className="space-y-3">
                    {recommendations.recommendations.map((rec, i) => {
                      const Icon = typeIcons[rec.type] || BookOpen;
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-primary shrink-0" />
                              <span className="font-medium text-sm">{rec.title}</span>
                            </div>
                            <Badge className={`text-xs ${priorityColors[rec.priority]}`}>{rec.priority}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {rec.skillsTargeted.map((s, j) => (
                              <Badge key={j} variant="secondary" className="text-xs">{s}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>⏱ {rec.duration}</span>
                            <span>📈 {rec.expectedImpact}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </TabsContent>

          {/* Peer Benchmark Tab */}
          <TabsContent value="benchmark" className="space-y-4">
            {!benchmark ? (
              <div className="text-center py-6">
                <p className="text-sm text-muted-foreground mb-4">
                  {fr
                    ? "Comparez les compétences de l'employé aux moyennes du département et de l'entreprise."
                    : "Compare employee's competencies against department and company averages."}
                </p>
                <Button
                  onClick={handleBenchmark}
                  disabled={loading === 'peer_benchmark' || allEvaluations.length < 2}
                >
                  {loading === 'peer_benchmark' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BarChart3 className="w-4 h-4 mr-2" />}
                  {fr ? 'Lancer le benchmark' : 'Run Benchmark'}
                </Button>
                {allEvaluations.length < 2 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {fr ? 'Minimum 2 évaluations requises' : 'Minimum 2 evaluations required'}
                  </p>
                )}
              </div>
            ) : (
              <AnimatePresence>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold">{benchmark.percentileRank}<span className="text-lg text-muted-foreground">%</span></div>
                      <div className="text-xs text-muted-foreground">{fr ? 'Percentile' : 'Percentile'}</div>
                    </div>
                    <Badge variant={benchmark.overallComparison === 'above_average' ? 'default' : benchmark.overallComparison === 'average' ? 'secondary' : 'destructive'}>
                      {benchmark.overallComparison === 'above_average' ? (fr ? 'Au-dessus de la moyenne' : 'Above Average') :
                       benchmark.overallComparison === 'average' ? (fr ? 'Dans la moyenne' : 'Average') :
                       (fr ? 'En dessous de la moyenne' : 'Below Average')}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">{benchmark.summary}</p>

                  {benchmark.strengthsVsPeers.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">{fr ? 'Comparaison par compétence' : 'Skill Comparison'}</h4>
                      {benchmark.strengthsVsPeers.map((s, i) => {
                        const StandingIcon = standingIcons[s.standing];
                        return (
                          <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                            <span>{s.skill}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{s.employeeLevel} vs {s.peerAverage}</span>
                              <StandingIcon className={`w-4 h-4 ${standingColors[s.standing]}`} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {benchmark.insights.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="text-sm font-medium">{fr ? 'Insights' : 'Insights'}</h4>
                      {benchmark.insights.map((insight, i) => (
                        <p key={i} className="text-xs text-muted-foreground pl-3 border-l-2 border-primary/30">{insight}</p>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
