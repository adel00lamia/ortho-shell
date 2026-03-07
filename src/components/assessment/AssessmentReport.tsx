import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { Sparkles, Loader2, FileText, Download, CheckCircle2, AlertTriangle, TrendingUp, Target, Shield } from 'lucide-react';
import { exportAssessmentReportPDF } from './AssessmentReportPDFExport';

interface AssessmentReportProps {
  companyId: string | null;
  companyName: string;
  departments: any[];
  positions: any[];
  jobDescriptions: any[];
  evaluations: any[];
}

interface ReportData {
  executiveSummary: string;
  maturityScore: number;
  orgStructureAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  skillsGapAnalysis: {
    criticalGaps: { skill: string; severity: string; affectedPositions: number; recommendation: string }[];
    overallCoverage: number;
  };
  positionPlanning: {
    openPositions: { title: string; department: string; priority: string; reason: string }[];
    upskillCandidates: { currentRole: string; targetRole: string; matchScore: number; gapAreas: string[]; estimatedTime: string }[];
    reskillOpportunities: { currentRole: string; suggestedRole: string; rationale: string; trainingNeeded: string[] }[];
  };
  prioritizedActions: { action: string; priority: string; impact: string; timeline: string; estimatedCost: string }[];
  swotCompetencies: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

export const AssessmentReport = ({ companyId, companyName, departments, positions, jobDescriptions, evaluations }: AssessmentReportProps) => {
  const { language } = useLanguage();
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [report, setReport] = useState<ReportData | null>(null);

  const handleGenerate = async () => {
    if (!companyId) { toast.error('Company not found'); return; }
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-org-assessment', {
        body: {
          action: 'analyze-org',
          data: {
            companyName,
            departments: departments.map(d => ({ name: d.name, employeeCount: d.employee_count, head: d.head_employee_name })),
            positions: positions.map(p => ({ title: p.title, level: p.level, status: p.status, holder: p.current_holder_name, isCritical: p.is_critical, matchScore: p.match_score, upskill: p.upskill_potential, reskill: p.reskill_candidate })),
            jobDescriptions: jobDescriptions.map(j => ({ title: j.title, department: j.department, level: j.level })),
            evaluations: evaluations.map(e => ({ name: e.employee_name, department: e.department, rating: e.overall_rating, areas: e.areas_for_improvement, recommendations: e.training_recommendations })),
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      if (result) {
        setReport(result);
        // Save report to DB
        await supabase.from('assessment_reports').insert({
          company_id: companyId,
          created_by: (await supabase.auth.getUser()).data.user?.id || '',
          title: `${language === 'fr' ? 'Rapport d\'évaluation' : 'Assessment Report'} - ${new Date().toLocaleDateString()}`,
          report_type: 'full',
          report_data: result as any,
          maturity_score: result.maturityScore || 0,
        });
        toast.success(language === 'fr' ? 'Rapport généré et sauvegardé' : 'Report generated and saved');
      }
    } catch (err: any) {
      toast.error(err.message || 'Report generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const handleExportPDF = async () => {
    if (!report) return;
    setExporting(true);
    try {
      // Fetch company branding
      let logoUrl: string | null = null;
      let primaryColor: string | null = null;
      if (companyId) {
        const { data: companyRow } = await supabase
          .from('companies')
          .select('logo_url, primary_color')
          .eq('id', companyId)
          .single();
        logoUrl = companyRow?.logo_url || null;
        primaryColor = companyRow?.primary_color || null;
      }

      await exportAssessmentReportPDF({
        report,
        company: { name: companyName, logoUrl, primaryColor },
        language: language as 'fr' | 'en',
        stats: {
          departments: departments.length,
          positions: positions.length,
          jobDescriptions: jobDescriptions.length,
          evaluations: evaluations.length,
        },
      });
      toast.success(language === 'fr' ? 'PDF exporté avec succès' : 'PDF exported successfully');
    } catch (err: any) {
      toast.error(err.message || 'PDF export failed');
    } finally {
      setExporting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'medium': return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      default: return '';
    }
  };

  if (!report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {language === 'fr' ? 'Rapport d\'évaluation 360°' : '360° Assessment Report'}
          </CardTitle>
          <CardDescription>
            {language === 'fr'
              ? 'Générez un rapport complet analysant la structure, les compétences et les opportunités d\'évolution de votre organisation.'
              : 'Generate a comprehensive report analyzing your organization\'s structure, skills, and growth opportunities.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="mb-6 space-y-2 text-sm text-muted-foreground">
            <p>📊 {departments.length} {language === 'fr' ? 'départements' : 'departments'} · {positions.length} {language === 'fr' ? 'postes' : 'positions'}</p>
            <p>📋 {jobDescriptions.length} {language === 'fr' ? 'fiches de poste' : 'job descriptions'} · {evaluations.length} {language === 'fr' ? 'évaluations' : 'evaluations'}</p>
          </div>
          <Button size="lg" onClick={handleGenerate} disabled={generating}>
            {generating ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Sparkles className="h-5 w-5 mr-2" />}
            {generating
              ? (language === 'fr' ? 'Analyse en cours...' : 'Analyzing...')
              : (language === 'fr' ? 'Générer le rapport AI' : 'Generate AI Report')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Maturity Score */}
      <Card className="bg-gradient-to-r from-primary/10 to-primary/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold">{language === 'fr' ? 'Score de maturité RH' : 'HR Maturity Score'}</h3>
              <p className="text-sm text-muted-foreground">{companyName}</p>
            </div>
            <div className="text-4xl font-bold text-primary">{report.maturityScore}/100</div>
          </div>
          <Progress value={report.maturityScore} className="h-3" />
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader><CardTitle className="text-base">{language === 'fr' ? 'Résumé exécutif' : 'Executive Summary'}</CardTitle></CardHeader>
        <CardContent><p className="text-sm">{report.executiveSummary}</p></CardContent>
      </Card>

      {/* SWOT */}
      {report.swotCompetencies && (
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-green-200 dark:border-green-900">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-green-700 dark:text-green-400 flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {language === 'fr' ? 'Forces' : 'Strengths'}</CardTitle></CardHeader>
            <CardContent><ul className="text-xs space-y-1">{report.swotCompetencies.strengths?.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-red-200 dark:border-red-900">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-red-700 dark:text-red-400 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> {language === 'fr' ? 'Faiblesses' : 'Weaknesses'}</CardTitle></CardHeader>
            <CardContent><ul className="text-xs space-y-1">{report.swotCompetencies.weaknesses?.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-blue-200 dark:border-blue-900">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-700 dark:text-blue-400 flex items-center gap-1"><TrendingUp className="h-4 w-4" /> {language === 'fr' ? 'Opportunités' : 'Opportunities'}</CardTitle></CardHeader>
            <CardContent><ul className="text-xs space-y-1">{report.swotCompetencies.opportunities?.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent>
          </Card>
          <Card className="border-amber-200 dark:border-amber-900">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-amber-700 dark:text-amber-400 flex items-center gap-1"><Shield className="h-4 w-4" /> {language === 'fr' ? 'Menaces' : 'Threats'}</CardTitle></CardHeader>
            <CardContent><ul className="text-xs space-y-1">{report.swotCompetencies.threats?.map((s, i) => <li key={i}>• {s}</li>)}</ul></CardContent>
          </Card>
        </div>
      )}

      {/* Skills Gap */}
      {report.skillsGapAnalysis?.criticalGaps?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{language === 'fr' ? 'Gaps de compétences critiques' : 'Critical Skills Gaps'}</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {report.skillsGapAnalysis.criticalGaps.map((g, i) => (
              <div key={i} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{g.skill}</span>
                  <Badge className={getPriorityColor(g.severity)}>{g.severity}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{g.recommendation}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Position Planning */}
      {report.positionPlanning && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {report.positionPlanning.openPositions?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm">{language === 'fr' ? 'Postes à pourvoir' : 'Positions to Fill'}</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.positionPlanning.openPositions.map((p, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-muted">
                    <span className="font-medium">{p.title}</span> — {p.department}
                    <Badge className={`ml-2 text-xs ${getPriorityColor(p.priority)}`}>{p.priority}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {report.positionPlanning.upskillCandidates?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1"><TrendingUp className="h-4 w-4 text-green-500" /> Upskilling</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.positionPlanning.upskillCandidates.map((c, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-green-50 dark:bg-green-950/20">
                    <span className="font-medium">{c.currentRole}</span> → {c.targetRole}
                    <Badge variant="outline" className="ml-1">{c.matchScore}%</Badge>
                    <p className="text-muted-foreground mt-1">{c.estimatedTime}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {report.positionPlanning.reskillOpportunities?.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Target className="h-4 w-4 text-amber-500" /> Reskilling</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {report.positionPlanning.reskillOpportunities.map((r, i) => (
                  <div key={i} className="text-xs p-2 rounded bg-amber-50 dark:bg-amber-950/20">
                    <span className="font-medium">{r.currentRole}</span> → {r.suggestedRole}
                    <p className="text-muted-foreground mt-1">{r.rationale}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Prioritized Actions */}
      {report.prioritizedActions?.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">{language === 'fr' ? 'Actions prioritaires' : 'Prioritized Actions'}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {report.prioritizedActions.map((a, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
                  <Badge className={`mt-0.5 ${getPriorityColor(a.priority)}`}>{i + 1}</Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{a.action}</p>
                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-muted-foreground">
                      <span>📈 {a.impact}</span>
                      <span>⏱ {a.timeline}</span>
                      <span>💰 {a.estimatedCost}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-2">
        <Button variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {language === 'fr' ? 'Régénérer' : 'Regenerate'}
        </Button>
        <Button onClick={handleExportPDF} disabled={exporting}>
          {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
          {language === 'fr' ? 'Exporter PDF' : 'Export PDF'}
        </Button>
      </div>
    </div>
  );
};
