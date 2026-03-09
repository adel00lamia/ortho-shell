import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCompanyId } from '@/hooks/useCompanyId';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { generateOFPPTAnnualReport, type AnnualReportData } from './OFPPTAnnualReportPDF';
import { FileText, Download, Loader2, Building2, BarChart3, GraduationCap } from 'lucide-react';

export function AnnualReportGenerator() {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { user } = useAuth();
  const { companyId } = useCompanyId();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const handleGenerate = async () => {
    if (!companyId || !user) {
      toast.error(fr ? 'Erreur: identifiant entreprise manquant' : 'Error: company ID missing');
      return;
    }

    setGenerating(true);
    try {
      // Fetch company name
      const { data: company } = await supabase
        .from('companies')
        .select('name')
        .eq('id', companyId)
        .single();

      // Fetch training plans
      const { data: plans = [] } = await supabase
        .from('training_plans')
        .select('*')
        .eq('company_id', companyId);

      // Fetch training modules
      const planIds = (plans || []).map(p => p.id);
      let modules: any[] = [];
      if (planIds.length > 0) {
        const { data } = await supabase
          .from('training_modules')
          .select('*')
          .in('training_plan_id', planIds);
        modules = data || [];
      }

      // Fetch learner progress
      const moduleIds = modules.map(m => m.id);
      let progress: any[] = [];
      if (moduleIds.length > 0) {
        const { data } = await supabase
          .from('learner_module_progress')
          .select('*')
          .in('module_id', moduleIds);
        progress = data || [];
      }

      // Fetch OFPPT dossiers
      const { data: dossiers = [] } = await supabase
        .from('ofppt_reimbursement_dossiers')
        .select('*')
        .eq('company_id', companyId)
        .eq('exercise_year', parseInt(year));

      // Fetch skill categories and employee skills
      const { data: skillCategories = [] } = await supabase
        .from('skill_categories')
        .select('*')
        .eq('company_id', companyId);

      const { data: skills = [] } = await supabase
        .from('skills')
        .select('*')
        .eq('company_id', companyId);

      const { data: employeeSkills = [] } = await supabase
        .from('employee_skills')
        .select('*')
        .eq('company_id', companyId);

      // Fetch departments
      const { data: departments = [] } = await supabase
        .from('departments')
        .select('*')
        .eq('company_id', companyId);

      // Calculate metrics
      const uniqueEmployees = [...new Set(employeeSkills.map((es: any) => es.employee_name))];
      const completedProgress = progress.filter((p: any) => p.completed_at);
      const quizScores = progress.filter((p: any) => p.quiz_score !== null).map((p: any) => p.quiz_score);

      // Skill category analysis
      const catAnalysis = (skillCategories || []).map((cat: any) => {
        const catSkills = (skills || []).filter((s: any) => s.category_id === cat.id);
        const catEmpSkills = (employeeSkills || []).filter((es: any) =>
          catSkills.some((s: any) => s.id === es.skill_id)
        );
        const avgLevel = catEmpSkills.length > 0
          ? catEmpSkills.reduce((s: number, es: any) => s + es.current_level, 0) / catEmpSkills.length
          : 0;
        const avgTarget = catEmpSkills.length > 0
          ? catEmpSkills.reduce((s: number, es: any) => s + es.target_level, 0) / catEmpSkills.length
          : 0;
        return {
          name: fr ? cat.name_fr : cat.name_en,
          skills: catSkills.length,
          avgLevel,
          avgTarget,
        };
      });

      const criticalGaps = (employeeSkills || []).filter((es: any) => es.target_level - es.current_level >= 2).length;
      const onTarget = (employeeSkills || []).filter((es: any) => es.target_level - es.current_level <= 0).length;

      const reportData: AnnualReportData = {
        companyName: company?.name || 'Company',
        exerciseYear: parseInt(year),
        language: fr ? 'fr' : 'en',
        totalPlans: (plans || []).length,
        activePlans: (plans || []).filter((p: any) => p.status === 'active').length,
        completedPlans: (plans || []).filter((p: any) => p.status === 'completed').length,
        totalModules: modules.length,
        completedModules: modules.filter((m: any) => m.completed).length,
        totalHours: modules.reduce((s: number, m: any) => s + (m.duration_hours || 0), 0),
        totalBudget: (plans || []).reduce((s: number, p: any) => s + (p.budget || 0), 0),
        totalEmployees: uniqueEmployees.length || (departments || []).reduce((s: number, d: any) => s + (d.employee_count || 0), 0),
        employeesTrained: [...new Set(progress.map((p: any) => p.user_id))].length,
        avgCompletionRate: progress.length > 0
          ? Math.round((completedProgress.length / progress.length) * 100)
          : 0,
        avgQuizScore: quizScores.length > 0
          ? Math.round(quizScores.reduce((s: number, q: number) => s + q, 0) / quizScores.length)
          : 0,
        skillCategories: catAnalysis,
        criticalGaps,
        onTarget,
        dossiers: (dossiers || []).map((d: any) => ({
          title: d.title,
          status: d.status,
          amount: d.total_amount || 0,
          reimbursement: d.reimbursement_amount || 0,
          hours: d.total_hours || 0,
          participants: d.total_participants || 0,
        })),
        totalReimbursementRequested: (dossiers || []).reduce((s: number, d: any) => s + (d.reimbursement_amount || 0), 0),
        totalReimbursementApproved: (dossiers || [])
          .filter((d: any) => d.status === 'approved' || d.status === 'reimbursed')
          .reduce((s: number, d: any) => s + (d.reimbursement_amount || 0), 0),
        plans: (plans || []).map((p: any) => ({
          title: p.title,
          status: p.status,
          modules: modules.filter((m: any) => m.training_plan_id === p.id).length,
          budget: p.budget || 0,
          duration: p.duration_months || 0,
          ofpptCompliant: p.ofppt_compliant || false,
        })),
        departments: (departments || []).map((d: any) => ({
          name: d.name,
          employees: d.employee_count || 0,
          trained: 0, // Would need per-dept tracking
          hours: 0,
        })),
      };

      generateOFPPTAnnualReport(reportData);
      toast.success(fr ? 'Rapport PDF généré avec succès' : 'PDF report generated successfully');
    } catch (err) {
      console.error('Report generation error:', err);
      toast.error(fr ? 'Erreur lors de la génération du rapport' : 'Error generating report');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          {fr ? 'Bilan Annuel de Formation' : 'Annual Training Report'}
        </CardTitle>
        <CardDescription>
          {fr
            ? 'Générez un rapport PDF complet pour la soumission OFPPT/CSF'
            : 'Generate a comprehensive PDF report for OFPPT/CSF submission'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm">{fr ? 'Plans & modules' : 'Plans & modules'}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-sm">{fr ? 'KPIs & statistiques' : 'KPIs & stats'}</span>
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm">{fr ? 'Analyse compétences' : 'Skills analysis'}</span>
          </div>
        </div>

        <div className="flex items-end gap-3">
          <div className="space-y-1">
            <span className="text-sm font-medium">{fr ? 'Exercice' : 'Fiscal Year'}</span>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleGenerate} disabled={generating} className="gap-2">
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {generating
              ? (fr ? 'Génération...' : 'Generating...')
              : (fr ? 'Générer le rapport PDF' : 'Generate PDF Report')}
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">OFPPT/CSF</Badge>
          <Badge variant="outline" className="text-xs">{fr ? 'Bilingue FR/EN' : 'Bilingual FR/EN'}</Badge>
          <Badge variant="outline" className="text-xs">{fr ? 'Conforme réglementation' : 'Regulation compliant'}</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
