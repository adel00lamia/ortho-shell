import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useSkillCategories, useSkills, useEmployeeSkills } from '@/hooks/useSkillsTaxonomy';
import { supabase } from '@/integrations/supabase/client';
import {
  Users, TrendingUp, BookOpen, Target, AlertTriangle, CheckCircle2,
  BarChart3, GraduationCap, Loader2, User, Clock
} from 'lucide-react';

export default function ManagerDashboard() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { companyId } = useCompanyId();
  const [selectedDept, setSelectedDept] = useState<string>('all');

  // Fetch departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departments', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId!)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch training plans
  const { data: plans = [] } = useQuery({
    queryKey: ['manager-plans', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('company_id', companyId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Fetch modules
  const { data: modules = [] } = useQuery({
    queryKey: ['manager-modules', companyId],
    queryFn: async () => {
      const planIds = plans.map(p => p.id);
      if (planIds.length === 0) return [];
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .in('training_plan_id', planIds);
      if (error) throw error;
      return data || [];
    },
    enabled: plans.length > 0,
  });

  // Fetch learner progress
  const { data: progress = [] } = useQuery({
    queryKey: ['manager-progress', companyId],
    queryFn: async () => {
      const moduleIds = modules.map(m => m.id);
      if (moduleIds.length === 0) return [];
      const { data, error } = await supabase
        .from('learner_module_progress')
        .select('*')
        .in('module_id', moduleIds);
      if (error) throw error;
      return data || [];
    },
    enabled: modules.length > 0,
  });

  // Skills data
  const { data: categories = [] } = useSkillCategories();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { data: employeeSkills = [], isLoading: empLoading } = useEmployeeSkills();

  // Performance evaluations
  const { data: evaluations = [] } = useQuery({
    queryKey: ['manager-evaluations', companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('performance_evaluations')
        .select('*')
        .eq('company_id', companyId!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!companyId,
  });

  // Computed stats
  const totalEmployees = [...new Set(employeeSkills.map(es => es.employee_name))].length || departments.reduce((s, d: any) => s + (d.employee_count || 0), 0);
  const activePlans = plans.filter(p => p.status === 'active').length;
  const completedModules = modules.filter((m: any) => m.completed).length;
  const totalHours = modules.reduce((s, m: any) => s + (m.duration_hours || 0), 0);

  const completedProgress = progress.filter((p: any) => p.completed_at);
  const avgCompletion = progress.length > 0
    ? Math.round((completedProgress.length / progress.length) * 100)
    : 0;

  const quizScores = progress.filter((p: any) => p.quiz_score !== null).map((p: any) => p.quiz_score);
  const avgScore = quizScores.length > 0
    ? Math.round(quizScores.reduce((s, q) => s + q, 0) / quizScores.length)
    : 0;

  const criticalGaps = employeeSkills.filter(es => es.target_level - es.current_level >= 2).length;
  const onTarget = employeeSkills.filter(es => es.target_level - es.current_level <= 0).length;

  // Employee details for direct reports view
  const employees = [...new Set(employeeSkills.map(es => es.employee_name))].sort();
  const employeeDetails = employees.map(name => {
    const empSkills = employeeSkills.filter(es => es.employee_name === name);
    const avgLevel = empSkills.length > 0
      ? empSkills.reduce((s, es) => s + es.current_level, 0) / empSkills.length
      : 0;
    const avgTarget = empSkills.length > 0
      ? empSkills.reduce((s, es) => s + es.target_level, 0) / empSkills.length
      : 0;
    const gaps = empSkills.filter(es => es.target_level - es.current_level >= 2).length;
    const onTgt = empSkills.filter(es => es.target_level - es.current_level <= 0).length;

    return { name, skillCount: empSkills.length, avgLevel, avgTarget, gaps, onTarget: onTgt };
  });

  // Category-level analysis
  const catAnalysis = categories.map(cat => {
    const catSkills = skills.filter(s => s.category_id === cat.id);
    const catEmpSkills = employeeSkills.filter(es =>
      catSkills.some(s => s.id === es.skill_id)
    );
    const avgLevel = catEmpSkills.length > 0
      ? catEmpSkills.reduce((s, es) => s + es.current_level, 0) / catEmpSkills.length
      : 0;
    const avgTarget = catEmpSkills.length > 0
      ? catEmpSkills.reduce((s, es) => s + es.target_level, 0) / catEmpSkills.length
      : 0;
    return {
      name: fr ? cat.name_fr : cat.name_en,
      avgLevel,
      avgTarget,
      gap: avgTarget - avgLevel,
      employees: [...new Set(catEmpSkills.map(es => es.employee_name))].length,
    };
  }).sort((a, b) => b.gap - a.gap);

  if (skillsLoading || empLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            {fr ? 'Tableau de bord Manager' : 'Manager Dashboard'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {fr ? 'Vue d\'ensemble de votre équipe et des formations' : 'Overview of your team and training activities'}
          </p>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{fr ? 'Employés' : 'Employees'}</span>
          </div>
          <div className="text-2xl font-bold">{totalEmployees}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <span className="text-xs text-muted-foreground">{fr ? 'Plans actifs' : 'Active Plans'}</span>
          </div>
          <div className="text-2xl font-bold">{activePlans}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-muted-foreground">{fr ? 'Heures' : 'Hours'}</span>
          </div>
          <div className="text-2xl font-bold">{totalHours}h</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">{fr ? 'Complétion' : 'Completion'}</span>
          </div>
          <div className="text-2xl font-bold">{avgCompletion}%</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-muted-foreground">{fr ? 'Gaps critiques' : 'Critical Gaps'}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalGaps}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-muted-foreground">{fr ? 'Au niveau' : 'On Target'}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{onTarget}</div>
        </Card>
      </div>

      <Tabs defaultValue="team" className="space-y-4">
        <TabsList>
          <TabsTrigger value="team" className="gap-1"><Users className="h-3.5 w-3.5" /> {fr ? 'Équipe' : 'Team'}</TabsTrigger>
          <TabsTrigger value="skills" className="gap-1"><GraduationCap className="h-3.5 w-3.5" /> {fr ? 'Compétences' : 'Skills'}</TabsTrigger>
          <TabsTrigger value="plans" className="gap-1"><BookOpen className="h-3.5 w-3.5" /> {fr ? 'Formations' : 'Training'}</TabsTrigger>
        </TabsList>

        {/* Team / Direct Reports Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Membres de l\'équipe' : 'Team Members'}</CardTitle>
              <CardDescription>
                {fr ? 'Niveau de compétence et gaps par employé' : 'Skill level and gaps per employee'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {employeeDetails.length === 0 ? (
                <div className="text-center py-8">
                  <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {fr ? 'Aucun employé évalué. Ajoutez des évaluations dans la taxonomie des compétences.' : 'No employees assessed yet. Add assessments in the Skills Taxonomy.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {employeeDetails.map(emp => {
                    const pct = emp.avgTarget > 0 ? Math.round((emp.avgLevel / emp.avgTarget) * 100) : 100;
                    return (
                      <div key={emp.name} className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {emp.skillCount} {fr ? 'compétences évaluées' : 'skills assessed'}
                          </p>
                        </div>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{fr ? 'Niveau' : 'Level'}</span>
                            <span className="font-medium">{pct}%</span>
                          </div>
                          <Progress value={pct} className="h-2" />
                        </div>
                        <div className="flex gap-2">
                          {emp.gaps > 0 && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" />{emp.gaps}
                            </Badge>
                          )}
                          {emp.onTarget > 0 && (
                            <Badge variant="outline" className="text-xs text-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />{emp.onTarget}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Analysis Tab */}
        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Analyse par catégorie' : 'Category Analysis'}</CardTitle>
              <CardDescription>
                {fr ? 'Écart moyen entre niveau actuel et cible par catégorie' : 'Average gap between current and target level per category'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {catAnalysis.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {fr ? 'Aucune donnée de compétence disponible' : 'No skill data available'}
                </p>
              ) : (
                <div className="space-y-4">
                  {catAnalysis.map(cat => {
                    const pct = cat.avgTarget > 0 ? Math.round((cat.avgLevel / cat.avgTarget) * 100) : 100;
                    return (
                      <div key={cat.name} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{cat.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {cat.employees} {fr ? 'employés' : 'employees'} · {fr ? 'Gap' : 'Gap'}: {cat.gap.toFixed(1)}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-bold">{cat.avgLevel.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground"> / {cat.avgTarget.toFixed(1)}</span>
                          </div>
                        </div>
                        <div className="h-3 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              cat.gap >= 1.5 ? 'bg-red-500' : cat.gap >= 0.5 ? 'bg-amber-500' : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, pct)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Training Plans Tab */}
        <TabsContent value="plans" className="space-y-4">
          {plans.length === 0 ? (
            <Card className="p-8 text-center">
              <BookOpen className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {fr ? 'Aucun plan de formation' : 'No training plans yet'}
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {plans.slice(0, 10).map((plan: any) => {
                const planModules = modules.filter((m: any) => m.training_plan_id === plan.id);
                const completed = planModules.filter((m: any) => m.completed).length;
                const pct = planModules.length > 0 ? Math.round((completed / planModules.length) * 100) : 0;

                return (
                  <Card key={plan.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-sm">{plan.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {planModules.length} {fr ? 'modules' : 'modules'} · {plan.duration_months || 0} {fr ? 'mois' : 'months'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={
                          plan.status === 'active' ? 'default' :
                          plan.status === 'completed' ? 'secondary' : 'outline'
                        } className="text-xs">
                          {plan.status}
                        </Badge>
                        {plan.ofppt_compliant && (
                          <Badge variant="outline" className="text-xs text-green-600">OFPPT</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress value={pct} className="flex-1 h-2" />
                      <span className="text-xs font-medium w-10 text-right">{pct}%</span>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
