import { useLanguage } from '@/contexts/LanguageContext';
import { useAICareerCoach, type AICareerAnalysis } from '@/hooks/useAICareerCoach';
import type { AggregatedSkill, CareerMatch } from '@/hooks/useCareerProfile';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sparkles, Target, TrendingUp, BookOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  skills: AggregatedSkill[];
  careerMatches: CareerMatch[];
  employeeName: string;
  position: string;
}

const priorityColors: Record<string, string> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
};

export function AICareerCoachPanel({ skills, careerMatches, employeeName, position }: Props) {
  const { language } = useLanguage();
  const { analyze, isAnalyzing, analysis } = useAICareerCoach();

  const topMatch = careerMatches.length > 0 ? careerMatches[0] : null;

  const handleAnalyze = () => {
    analyze({ skills, topMatch, employeeName, position });
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.03] to-transparent">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {language === 'fr' ? 'Coach IA Carrière' : 'AI Career Coach'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {language === 'fr'
                ? 'Obtenez une analyse IA personnalisée de vos compétences, lacunes et un plan de développement.'
                : 'Get a personalized AI analysis of your skills, gaps, and a development plan.'}
            </p>
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || skills.length === 0}
              className="w-full"
              size="sm"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {language === 'fr' ? 'Analyse en cours...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  {language === 'fr' ? 'Lancer l\'analyse IA' : 'Run AI Analysis'}
                </>
              )}
            </Button>
            {skills.length === 0 && (
              <p className="text-xs text-muted-foreground italic">
                {language === 'fr'
                  ? 'Ajoutez des compétences pour activer l\'analyse.'
                  : 'Add skills to enable AI analysis.'}
              </p>
            )}
          </div>
        )}

        <AnimatePresence>
          {analysis && <AnalysisResults analysis={analysis} />}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function AnalysisResults({ analysis }: { analysis: AICareerAnalysis }) {
  const { language } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-5"
    >
      {/* Overall Match */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Target className="h-3.5 w-3.5 text-primary" />
            {language === 'fr' ? 'Adéquation globale' : 'Overall Match'}
          </span>
          <span className="text-sm font-semibold tabular-nums">{analysis.overallMatch}%</span>
        </div>
        <Progress value={analysis.overallMatch} className="h-2" />
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground leading-relaxed">{analysis.summary}</p>

      {/* Skill Gaps */}
      {analysis.gaps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <TrendingUp className="h-3 w-3" />
            {language === 'fr' ? 'Lacunes identifiées' : 'Skill Gaps'}
          </h4>
          <div className="space-y-2">
            {analysis.gaps.slice(0, 5).map((gap, i) => (
              <motion.div
                key={gap.skill}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + i * 0.08, duration: 0.35 }}
                className="flex items-start justify-between gap-2 p-2 rounded-lg border bg-muted/30"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{gap.skill}</p>
                  <p className="text-xs text-muted-foreground truncate">{gap.recommendation}</p>
                </div>
                <Badge className={`shrink-0 text-[10px] ${priorityColors[gap.priority] || ''}`}>
                  {gap.priority}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Training Plan */}
      {analysis.trainingPlan.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <BookOpen className="h-3 w-3" />
            {language === 'fr' ? 'Plan de formation recommandé' : 'Recommended Training'}
          </h4>
          <div className="space-y-1.5">
            {analysis.trainingPlan.slice(0, 4).map((item, i) => (
              <motion.div
                key={item.skill}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                className="flex items-center justify-between gap-2 p-2 rounded-lg border bg-card"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.skill} · {item.duration}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {item.priority}
                </Badge>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
