import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEmployeeProfiles, type WorkforceProfile, type EmployeeProfile, type DepartmentRollup } from '@/hooks/useEmployeeProfiles';
import { Loader2, Users, Building2, AlertTriangle, TrendingUp, Brain, ChevronDown, ChevronUp, Sparkles, Target, GraduationCap, FileText, Briefcase, Network } from 'lucide-react';

const levelColors: Record<string, string> = {
  junior: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  mid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  senior: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  lead: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  expert: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const urgencyColors: Record<string, string> = {
  immediate: 'destructive',
  'short-term': 'default',
  'medium-term': 'secondary',
  'long-term': 'outline',
};

const readinessColors: Record<string, string> = {
  ready: 'text-green-600 dark:text-green-400',
  'needs-development': 'text-yellow-600 dark:text-yellow-400',
  'critical-gaps': 'text-red-600 dark:text-red-400',
};

const priorityColors: Record<string, string> = {
  critical: 'destructive',
  high: 'default',
  medium: 'secondary',
  low: 'outline',
};

function EmployeeCard({ emp, language }: { emp: EmployeeProfile; language: string }) {
  const [expanded, setExpanded] = useState(false);
  const fr = language === 'fr';

  return (
    <Card className="border-l-4" style={{ borderLeftColor: emp.overallMatchScore >= 75 ? '#22c55e' : emp.overallMatchScore >= 50 ? '#eab308' : '#ef4444' }}>
      <CardHeader className="pb-3 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle className="text-base">{emp.employeeName}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge className={levelColors[emp.detectedLevel] || 'bg-muted text-muted-foreground'} variant="secondary">
                  {emp.detectedLevel}
                </Badge>
                <Badge variant={urgencyColors[emp.trainingUrgency] as any || 'secondary'}>
                  {emp.trainingUrgency}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-2xl font-bold">{emp.overallMatchScore}%</div>
              <div className="text-xs text-muted-foreground">{fr ? 'Correspondance' : 'Match'}</div>
            </div>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
        <Progress value={emp.overallMatchScore} className="h-2 mt-2" />
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4 pt-0">
          {emp.strengths?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                {fr ? 'Points forts' : 'Strengths'}
              </h4>
              <div className="flex flex-wrap gap-1">
                {emp.strengths.map((s, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                ))}
              </div>
            </div>
          )}

          {emp.skillLevels?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <Brain className="h-3.5 w-3.5 text-primary" />
                {fr ? 'Niveaux de compétences détectés' : 'Detected Skill Levels'}
              </h4>
              <div className="space-y-2">
                {emp.skillLevels.slice(0, 8).map((sl, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-32 truncate font-medium">{sl.skill}</span>
                    <div className="flex-1 flex items-center gap-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => (
                          <div
                            key={n}
                            className={`w-4 h-4 rounded-sm border ${
                              n <= sl.currentLevel
                                ? 'bg-primary border-primary'
                                : n <= sl.requiredLevel
                                ? 'bg-destructive/20 border-destructive/40'
                                : 'bg-muted border-border'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground ml-1">
                        {sl.currentLevel}/{sl.requiredLevel}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] px-1">
                      {sl.source}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {emp.gaps?.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />
                {fr ? 'Écarts et formations recommandées' : 'Gaps & Recommended Training'}
              </h4>
              <div className="space-y-2">
                {emp.gaps.map((g, i) => (
                  <div key={i} className="p-2 rounded-md bg-muted/50 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{g.skill}</span>
                      <Badge variant={priorityColors[g.priority] as any || 'secondary'} className="text-[10px]">
                        {g.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{g.suggestedTraining}</p>
                    {g.estimatedDuration && (
                      <span className="text-[10px] text-muted-foreground">{g.estimatedDuration}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

function DepartmentCard({ dept, language }: { dept: DepartmentRollup; language: string }) {
  const fr = language === 'fr';

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              {dept.department}
            </CardTitle>
            <CardDescription>{dept.employeeCount} {fr ? 'employés' : 'employees'}</CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">{dept.avgMatchScore}%</div>
            <span className={`text-xs font-medium ${readinessColors[dept.overallReadiness] || ''}`}>
              {dept.overallReadiness === 'ready' ? (fr ? '✅ Prêt' : '✅ Ready') :
               dept.overallReadiness === 'needs-development' ? (fr ? '⚠️ Développement nécessaire' : '⚠️ Needs Development') :
               (fr ? '🚨 Écarts critiques' : '🚨 Critical Gaps')}
            </span>
          </div>
        </div>
        <Progress value={dept.avgMatchScore} className="h-2 mt-2" />
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {dept.criticalGaps?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-destructive mb-1">{fr ? 'Écarts critiques' : 'Critical Gaps'}</h4>
            <div className="flex flex-wrap gap-1">
              {dept.criticalGaps.map((g, i) => (
                <Badge key={i} variant="destructive" className="text-[10px]">{g}</Badge>
              ))}
            </div>
          </div>
        )}
        {dept.topTrainingNeeds?.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold mb-1">{fr ? 'Besoins prioritaires' : 'Top Training Needs'}</h4>
            {dept.topTrainingNeeds.slice(0, 3).map((n, i) => (
              <div key={i} className="flex items-center justify-between text-xs py-1 border-b last:border-0">
                <span>{n.skill}</span>
                <span className="text-muted-foreground">{n.affectedEmployees} {fr ? 'emp.' : 'emp.'} · gap {n.avgGap.toFixed(1)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function EmployeeSkillProfiler() {
  const { language } = useLanguage();
  const { profile, loading, runProfiling, dataStats, loadDataStats } = useEmployeeProfiles();
  const fr = language === 'fr';

  useEffect(() => {
    loadDataStats();
  }, []);

  const dataSourceItems = dataStats ? [
    { icon: <Users className="h-4 w-4 text-primary" />, label: fr ? 'Employés' : 'Employees', count: dataStats.employees, ok: dataStats.employees > 0 },
    { icon: <Briefcase className="h-4 w-4 text-primary" />, label: fr ? 'Fiches de poste' : 'Job Descriptions', count: dataStats.jobDescriptions, ok: dataStats.jobDescriptions > 0 },
    { icon: <FileText className="h-4 w-4 text-primary" />, label: fr ? 'Évaluations' : 'Evaluations', count: dataStats.evaluations, ok: dataStats.evaluations > 0 },
    { icon: <Building2 className="h-4 w-4 text-primary" />, label: fr ? 'Départements' : 'Departments', count: dataStats.departments, ok: dataStats.departments > 0 },
    { icon: <Network className="h-4 w-4 text-primary" />, label: fr ? 'Postes (organigramme)' : 'Positions (Org Chart)', count: dataStats.positions, ok: dataStats.positions > 0 },
  ] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {fr ? 'Profilage IA des Employés' : 'AI Employee Profiling'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Analyse automatique des niveaux de compétences basée sur le profil entreprise : employés, organigramme, CV, évaluations et fiches de poste.'
                  : 'Automatic skill level detection from company profile data: employees, org chart, CVs, evaluations & job descriptions.'}
              </CardDescription>
            </div>
            <Button onClick={runProfiling} disabled={loading || (dataStats?.employees === 0)} size="lg">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {fr ? 'Analyse en cours...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  {fr ? 'Lancer le profilage' : 'Run Profiling'}
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        {/* Data sources summary */}
        {dataSourceItems && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {dataSourceItems.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 p-3 rounded-lg border ${
                    item.ok ? 'bg-primary/5 border-primary/20' : 'bg-muted/50 border-border'
                  }`}
                >
                  {item.icon}
                  <div>
                    <div className="text-lg font-bold">{item.count}</div>
                    <div className="text-[11px] text-muted-foreground leading-tight">{item.label}</div>
                  </div>
                </div>
              ))}
            </div>
            {dataStats.employees === 0 && (
              <p className="text-sm text-destructive mt-3">
                {fr
                  ? '⚠️ Aucun employé trouvé. Ajoutez des employés dans le Profil Entreprise avant de lancer le profilage.'
                  : '⚠️ No employees found. Add employees in Company Profile before running profiling.'}
              </p>
            )}
          </CardContent>
        )}
      </Card>

      {!profile && !loading && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {fr ? 'Prêt à analyser votre équipe' : 'Ready to Analyze Your Team'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {fr
                ? 'L\'IA analysera les données du profil entreprise (employés, organigramme, CV, ancienneté, évaluations, certifications) pour détecter les niveaux de compétence et identifier les écarts par rapport aux fiches de poste.'
                : 'AI will analyze company profile data (employees, org chart, CVs, tenure, evaluations, certifications) to detect skill levels and identify gaps against job descriptions.'}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs text-muted-foreground">
              {[
                { icon: <Target className="h-4 w-4" />, label: fr ? 'CV / Résumé' : 'CV / Resume' },
                { icon: <TrendingUp className="h-4 w-4" />, label: fr ? 'Ancienneté' : 'Experience' },
                { icon: <Users className="h-4 w-4" />, label: fr ? 'Évaluations' : 'Evaluations' },
                { icon: <GraduationCap className="h-4 w-4" />, label: fr ? 'Certifications' : 'Certifications' },
                { icon: <Network className="h-4 w-4" />, label: fr ? 'Organigramme' : 'Org Chart' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1 p-2 rounded-md bg-muted/50">
                  {item.icon}
                  {item.label}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {profile && (
        <Tabs defaultValue="departments" className="space-y-4">
          <TabsList>
            <TabsTrigger value="departments" className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {fr ? 'Par département' : 'By Department'}
            </TabsTrigger>
            <TabsTrigger value="employees" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {fr ? 'Par employé' : 'By Employee'}
            </TabsTrigger>
            <TabsTrigger value="priorities" className="flex items-center gap-1">
              <Target className="h-3.5 w-3.5" />
              {fr ? 'Priorités' : 'Priorities'}
            </TabsTrigger>
          </TabsList>

          {profile.summary && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-4">
                <p className="text-sm">{profile.summary}</p>
              </CardContent>
            </Card>
          )}

          <TabsContent value="departments" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.departmentRollup?.map((dept, i) => (
                <DepartmentCard key={i} dept={dept} language={language} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-3">
            {profile.employeeProfiles?.map((emp, i) => (
              <EmployeeCard key={i} emp={emp} language={language} />
            ))}
          </TabsContent>

          <TabsContent value="priorities" className="space-y-4">
            {profile.companyWidePriorities?.map((p, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{p.priority}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {p.impactedDepartments?.map((d, j) => (
                      <Badge key={j} variant="outline">{d}</Badge>
                    ))}
                    {p.estimatedInvestment && (
                      <Badge variant="secondary">{p.estimatedInvestment}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
