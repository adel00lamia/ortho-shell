import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, FileText, TrendingUp, Users, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import PerformanceEvaluationForm from "@/components/PerformanceEvaluationForm";
import PerformanceAnalytics from "@/components/performance/PerformanceAnalytics";
import SkillsOverview from "@/components/performance/SkillsOverview";
import { Badge } from "@/components/ui/badge";

import { ContextualActions } from "@/components/ContextualActions";
import { useLanguage } from "@/contexts/LanguageContext";
import AIPerformancePanel from "@/components/performance/AIPerformancePanel";

export default function PerformanceEvaluation() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const p = t.performance;
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvaluation, setEditingEvaluation] = useState<any>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [selectedEvalId, setSelectedEvalId] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [user]);

  useEffect(() => {
    if (companyId) {
      loadEvaluations();
    }
  }, [companyId]);

  const loadProfile = async () => {
    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();
      if (data?.company_id) {
        setCompanyId(data.company_id);
        return;
      }
    }
    // Discovery Mode fallback: find any company with demo data
    const { data: companies } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'Atlas Industries Maroc')
      .limit(1);
    if (companies && companies.length > 0) {
      setCompanyId(companies[0].id);
    } else {
      // Try any company
      const { data: anyCompany } = await supabase
        .from('companies')
        .select('id')
        .limit(1);
      if (anyCompany && anyCompany.length > 0) {
        setCompanyId(anyCompany[0].id);
      } else {
        setLoading(false);
      }
    }
  };

  const loadEvaluations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('performance_evaluations')
      .select('*')
      .eq('company_id', companyId)
      .order('evaluation_date', { ascending: false });

    if (error) {
      toast.error(p.failedToLoad);
    } else {
      setEvaluations(data || []);
    }
    setLoading(false);
  };

  const handleSaveEvaluation = async (formData: any) => {
    const evaluationData = {
      company_id: companyId,
      created_by: user?.id,
      employee_name: formData.employeeName,
      employee_email: formData.employeeEmail,
      department: formData.department,
      job_description_id: formData.jobDescriptionId,
      evaluation_period: formData.evaluationPeriod,
      evaluation_date: formData.evaluationDate,
      overall_rating: formData.overallRating,
      competency_scores: formData.competencyScores,
      strengths: formData.strengths,
      areas_for_improvement: formData.areasForImprovement,
      training_recommendations: formData.trainingRecommendations,
      career_goals: formData.careerGoals,
      notes: formData.notes,
      resume_url: formData.resumeUrl || null,
      resume_summary: formData.resumeSummary || {},
      skills_analysis: formData.skillsAnalysis || {},
    };

    let result;
    if (editingEvaluation) {
      result = await supabase
        .from('performance_evaluations')
        .update(evaluationData)
        .eq('id', editingEvaluation.id);
    } else {
      result = await supabase
        .from('performance_evaluations')
        .insert(evaluationData);
    }

    if (result.error) {
      toast.error(p.failedToSave);
    } else {
      toast.success(editingEvaluation ? p.evaluationUpdated : p.evaluationCreated);
      setShowForm(false);
      setEditingEvaluation(null);
      loadEvaluations();
    }
  };

  const handleEdit = (evaluation: any) => {
    setEditingEvaluation(evaluation);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('performance_evaluations')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(p.failedToDelete);
    } else {
      toast.success(p.evaluationDeleted);
      loadEvaluations();
    }
  };

  const getRatingBadge = (rating: number) => {
    const r = p.form.ratings;
    if (rating >= 4.5) return <Badge className="bg-green-500">{r.exceptional}</Badge>;
    if (rating >= 3.5) return <Badge className="bg-blue-500">{r.exceeds}</Badge>;
    if (rating >= 2.5) return <Badge className="bg-yellow-500">{r.meets}</Badge>;
    if (rating >= 1.5) return <Badge className="bg-orange-500">{r.below}</Badge>;
    return <Badge className="bg-red-500">{r.needsImprovement}</Badge>;
  };

  if (loading) {
    return <div className="container mx-auto p-6">{t.common.loading}</div>;
  }

  if (showForm) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingEvaluation ? p.editEvaluation : p.newEvaluationTitle}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceEvaluationForm
              companyId={companyId}
              onSave={handleSaveEvaluation}
              onCancel={() => {
                setShowForm(false);
                setEditingEvaluation(null);
              }}
              initialData={editingEvaluation}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">{p.title}</h1>
          <p className="text-muted-foreground">{p.subtitle}</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          {p.newEvaluation}
        </Button>
      </div>

      <Tabs defaultValue="evaluations" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-[800px]">
          <TabsTrigger value="evaluations">
            <FileText className="w-4 h-4 mr-2" />
            {p.tabs.evaluations}
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="w-4 h-4 mr-2" />
            {p.tabs.analytics}
          </TabsTrigger>
          <TabsTrigger value="skills">
            <Brain className="w-4 h-4 mr-2" />
            {p.tabs.skills}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="w-4 h-4 mr-2" />
            {p.tabs.byEmployee}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evaluations" className="space-y-4">
          {evaluations.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground mb-4">{p.noEvaluations}</p>
                <Button onClick={() => setShowForm(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  {p.createFirst}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {evaluations.map(evaluation => (
                <Card key={evaluation.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-xl font-semibold">{evaluation.employee_name}</h3>
                          {getRatingBadge(evaluation.overall_rating)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                          <div>
                            <span className="font-medium">{p.card.department}:</span> {evaluation.department || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">{p.card.period}:</span> {evaluation.evaluation_period || 'N/A'}
                          </div>
                          <div>
                            <span className="font-medium">{p.card.date}:</span> {new Date(evaluation.evaluation_date).toLocaleDateString()}
                          </div>
                          <div>
                            <span className="font-medium">{p.card.rating}:</span> {evaluation.overall_rating}/5
                          </div>
                        </div>
                        {evaluation.strengths && evaluation.strengths.length > 0 && (
                          <div className="mb-2">
                            <span className="text-sm font-medium">{p.sections.strengths}:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {evaluation.strengths.slice(0, 3).map((strength: string, idx: number) => (
                                <Badge key={idx} variant="secondary" className="bg-green-50 dark:bg-green-900/20">
                                  {strength}
                                </Badge>
                              ))}
                              {evaluation.strengths.length > 3 && (
                                <Badge variant="secondary">+{evaluation.strengths.length - 3} {t.common.more}</Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant={selectedEvalId === evaluation.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedEvalId(selectedEvalId === evaluation.id ? null : evaluation.id)}
                        >
                          <Brain className="w-4 h-4 mr-1" />
                          AI
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(evaluation)}>
                          {t.common.edit}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDelete(evaluation.id)}>
                          {t.common.delete}
                        </Button>
                      </div>
                    </div>
                    {selectedEvalId === evaluation.id && (
                      <div className="mt-4">
                        <AIPerformancePanel
                          evaluation={evaluation}
                          allEvaluations={evaluations}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <PerformanceAnalytics evaluations={evaluations} />
        </TabsContent>

        <TabsContent value="skills">
          <SkillsOverview evaluations={evaluations} />
        </TabsContent>

        <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>{p.employees.title}</CardTitle>
            </CardHeader>
            <CardContent>
              {evaluations.length === 0 ? (
                <p className="text-center text-muted-foreground">{p.employees.noData}</p>
              ) : (
                <div className="space-y-4">
                  {Array.from(new Set(evaluations.map(e => e.employee_name))).map(employeeName => {
                    const employeeEvals = evaluations.filter(e => e.employee_name === employeeName);
                    const latestEval = employeeEvals[0];
                    const avgRating = employeeEvals.reduce((sum, e) => sum + e.overall_rating, 0) / employeeEvals.length;

                    return (
                      <Card key={employeeName}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-lg">{employeeName}</h4>
                              <p className="text-sm text-muted-foreground">{latestEval.department || 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
                              <p className="text-xs text-muted-foreground">{p.employees.averageRating}</p>
                              <Badge variant="outline" className="mt-1">{employeeEvals.length} {p.employees.evaluationsCount}</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {evaluations.length > 0 && (
        <div className="mt-6">
          <ContextualActions currentPage="performance" data={evaluations} />
        </div>
      )}
    </div>
  );
}
