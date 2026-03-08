import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { User } from 'lucide-react';

interface Position {
  id: string;
  title: string;
  level: string;
  status: string;
  current_holder_name: string | null;
  match_score: number | null;
  upskill_potential: boolean;
  reskill_candidate: boolean;
  skills_required: any;
  skills_current: any;
}

interface NineBoxGridProps {
  positions: Position[];
}

// 9-box grid: X = Performance (match_score), Y = Potential (derived from upskill/reskill + skills gap)
const getPerformanceBucket = (pos: Position): number => {
  const score = pos.match_score ?? 50;
  if (score >= 70) return 2; // High
  if (score >= 40) return 1; // Medium
  return 0; // Low
};

const getPotentialBucket = (pos: Position): number => {
  if (pos.upskill_potential && (pos.match_score ?? 0) >= 50) return 2; // High
  if (pos.upskill_potential || (!pos.reskill_candidate && (pos.match_score ?? 0) >= 30)) return 1; // Medium
  return 0; // Low
};

const boxLabels = {
  fr: [
    ['Risque', 'Contributeur fiable', 'Professionnel clé'],
    ['Enigme', 'Contributeur essentiel', 'Forte performance'],
    ['Mauvaise embauche', 'Performant moyen', 'Talent brut'],
  ],
  en: [
    ['Risk', 'Consistent Performer', 'Key Player'],
    ['Enigma', 'Core Contributor', 'High Performer'],
    ['Wrong Fit', 'Average Performer', 'Raw Talent'],
  ],
};

const boxColors = [
  ['bg-red-100 dark:bg-red-950/30 border-red-300', 'bg-amber-100 dark:bg-amber-950/30 border-amber-300', 'bg-green-100 dark:bg-green-950/30 border-green-300'],
  ['bg-amber-100 dark:bg-amber-950/30 border-amber-300', 'bg-blue-100 dark:bg-blue-950/30 border-blue-300', 'bg-green-100 dark:bg-green-950/30 border-green-300'],
  ['bg-red-100 dark:bg-red-950/30 border-red-300', 'bg-amber-100 dark:bg-amber-950/30 border-amber-300', 'bg-amber-100 dark:bg-amber-950/30 border-amber-300'],
];

const boxActionColors = [
  ['text-red-700 dark:text-red-400', 'text-amber-700 dark:text-amber-400', 'text-green-700 dark:text-green-400'],
  ['text-amber-700 dark:text-amber-400', 'text-blue-700 dark:text-blue-400', 'text-green-700 dark:text-green-400'],
  ['text-red-700 dark:text-red-400', 'text-amber-700 dark:text-amber-400', 'text-amber-700 dark:text-amber-400'],
];

const boxActions = {
  fr: [
    ['Plan de sortie / Réaffectation', 'Développer le potentiel', 'Retenir & Récompenser'],
    ['Observer & Évaluer', 'Former & Accompagner', 'Promouvoir bientôt'],
    ['Action immédiate requise', 'Plan d\'amélioration', 'Former intensivement'],
  ],
  en: [
    ['Exit plan / Reassign', 'Develop potential', 'Retain & Reward'],
    ['Observe & Evaluate', 'Train & Coach', 'Promote soon'],
    ['Immediate action needed', 'Improvement plan', 'Intensive training'],
  ],
};

export const NineBoxGrid = ({ positions }: NineBoxGridProps) => {
  const { language } = useLanguage();
  const lang = language === 'fr' ? 'fr' : 'en';

  // Classify positions into 9 boxes
  const grid: Position[][][] = Array.from({ length: 3 }, () =>
    Array.from({ length: 3 }, () => [] as Position[])
  );

  positions.forEach(pos => {
    if (!pos.current_holder_name) return; // Skip vacant
    const perf = getPerformanceBucket(pos);
    const pot = getPotentialBucket(pos);
    // grid[row][col] where row=0 is top (high potential), col=0 is low performance
    const row = 2 - pot; // Invert: high potential = top row
    grid[row][perf].push(pos);
  });

  const totalPlaced = positions.filter(p => p.current_holder_name).length;

  const perfLabels = lang === 'fr' 
    ? ['Faible', 'Moyenne', 'Élevée'] 
    : ['Low', 'Medium', 'High'];
  const potLabels = lang === 'fr' 
    ? ['Élevé', 'Moyen', 'Faible'] 
    : ['High', 'Medium', 'Low'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-5 w-5 rounded bg-gradient-to-br from-red-400 via-amber-400 to-green-400" />
          {lang === 'fr' ? 'Matrice 9 Boxes — Talent' : '9-Box Talent Grid'}
        </CardTitle>
        <CardDescription>
          {lang === 'fr' 
            ? `${totalPlaced} employé(s) classé(s) par performance et potentiel` 
            : `${totalPlaced} employee(s) classified by performance and potential`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalPlaced === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {lang === 'fr' 
              ? 'Ajoutez des postes avec des titulaires et des scores pour voir la matrice' 
              : 'Add positions with holders and scores to see the grid'}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Y-axis label */}
            <div className="flex items-stretch gap-2">
              <div className="flex flex-col justify-between w-16 shrink-0 text-xs font-medium text-muted-foreground pr-1">
                {potLabels.map((label, i) => (
                  <div key={i} className="flex-1 flex items-center justify-end">
                    {label}
                  </div>
                ))}
                <div className="h-6" />
              </div>

              <div className="flex-1 space-y-2">
                <TooltipProvider>
                  {grid.map((row, rowIdx) => (
                    <div key={rowIdx} className="grid grid-cols-3 gap-2">
                      {row.map((cell, colIdx) => (
                        <div
                          key={colIdx}
                          className={`rounded-lg border-2 p-2 min-h-[100px] transition-all ${boxColors[rowIdx][colIdx]}`}
                        >
                          <div className="text-[10px] font-semibold mb-1 opacity-70">
                            {boxLabels[lang][rowIdx][colIdx]}
                          </div>
                          <div className={`text-[9px] mb-2 ${boxActionColors[rowIdx][colIdx]}`}>
                            {boxActions[lang][rowIdx][colIdx]}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {cell.map(pos => (
                              <Tooltip key={pos.id}>
                                <TooltipTrigger asChild>
                                  <div className="flex items-center gap-1 bg-background/80 rounded px-1.5 py-0.5 text-[10px] font-medium cursor-default shadow-sm">
                                    <User className="h-3 w-3 text-muted-foreground" />
                                    <span className="truncate max-w-[80px]">{pos.current_holder_name}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="text-xs">
                                  <p className="font-semibold">{pos.current_holder_name}</p>
                                  <p className="text-muted-foreground">{pos.title}</p>
                                  {pos.match_score != null && (
                                    <p>Score: {Math.round(pos.match_score)}%</p>
                                  )}
                                  <div className="flex gap-1 mt-1">
                                    {pos.upskill_potential && <Badge variant="outline" className="text-[9px]">Upskill</Badge>}
                                    {pos.reskill_candidate && <Badge variant="destructive" className="text-[9px]">Reskill</Badge>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            ))}
                            {cell.length === 0 && (
                              <span className="text-[10px] text-muted-foreground italic">—</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </TooltipProvider>

                {/* X-axis labels */}
                <div className="grid grid-cols-3 gap-2">
                  {perfLabels.map((label, i) => (
                    <div key={i} className="text-center text-xs font-medium text-muted-foreground">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Axis titles */}
            <div className="flex justify-between text-[10px] text-muted-foreground mt-2 px-16">
              <span>← {lang === 'fr' ? 'POTENTIEL (axe Y)' : 'POTENTIAL (Y-axis)'}</span>
              <span>{lang === 'fr' ? 'PERFORMANCE (axe X)' : 'PERFORMANCE (X-axis)'} →</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
