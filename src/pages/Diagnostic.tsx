import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Briefcase, Users, Target, Upload, Plus, X, FileText, Sparkles, Loader2 } from "lucide-react";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import PerformanceEvaluationForm from "@/components/PerformanceEvaluationForm";

import { ContextualActions } from "@/components/ContextualActions";
import { CompanyResearch, CompanyResearchData } from "@/components/CompanyResearch";
import { useLanguage } from '@/contexts/LanguageContext';

interface Employee {
  id: string;
  name: string;
  jobDescriptionId: string | null;
  performanceEvaluationId: string | null;
  currentCompetencies: Record<string, number>;
  targetCompetencies: Record<string, number>;
  priority: 'low' | 'medium' | 'high';
}

interface JobDescription {
  id: string;
  title: string;
  department: string;
  level: string;
  description: string;
  competencies: any; // JSONB from database
}

interface PerformanceEvaluation {
  id: string;
  employee_name: string;
  overall_rating: number;
  department: string;
  job_description_id: string | null;
  competency_scores: any; // JSONB from database
  areas_for_improvement: string[];
  training_recommendations: string[];
}

export default function Diagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const d = t.diagnostic;
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Job Descriptions & Evaluations
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [performanceEvaluations, setPerformanceEvaluations] = useState<PerformanceEvaluation[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showEvalForm, setShowEvalForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [editingEval, setEditingEval] = useState<any>(null);
  
  // Employees for diagnostic
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [formData, setFormData] = useState({
    objectives: "",
    industry: "",
    companySize: "",
    budgetRange: "",
    languages: [] as string[],
    priorities: [] as string[],
    constraints: [] as string[]
  });

  const [aiLoading, setAiLoading] = useState(false);

  const skillCategories = [
    "Leadership", "Communication", "Technical Skills", "Project Management",
    "Sales", "Marketing", "Data Analysis", "Cybersecurity", "AI/ML",
    "Customer Service", "Financial Management", "Operations"
  ];

  const budgetRanges = [
    "10,000 - 50,000 MAD",
    "50,000 - 100,000 MAD", 
    "100,000 - 250,000 MAD",
    "250,000 - 500,000 MAD",
    "500,000+ MAD"
  ];

  const languages = ["Arabic", "French", "English", "Spanish"];
  const priorities = ["Quick ROI", "Skill Certification", "Team Building", "Compliance", "Innovation"];
  const constraints = ["Remote Only", "Limited Budget", "Time Constraints", "Location Specific"];

  const trainingTemplates = [
    {
      name: "Digital Transformation",
      objectives: "Upgrade team digital skills to modernize operations and improve efficiency through cloud, automation, and data analytics training.",
      priorities: ["Innovation", "Quick ROI"]
    },
    {
      name: "Leadership Development",
      objectives: "Build strong management pipeline through leadership, strategic thinking, and team management training programs.",
      priorities: ["Team Building", "Skill Certification"]
    },
    {
      name: "Technical Skills Upskilling",
      objectives: "Enhance technical capabilities in programming, cybersecurity, and AI/ML to stay competitive in the tech landscape.",
      priorities: ["Innovation", "Skill Certification"]
    },
    {
      name: "Customer Service Excellence",
      objectives: "Improve customer satisfaction through communication, problem-solving, and service quality training.",
      priorities: ["Quick ROI", "Team Building"]
    }
  ];

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Get company ID
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);

        // Load job descriptions
        const { data: jobs } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('company_id', profile.company_id);

        if (jobs) setJobDescriptions(jobs);

        // Load performance evaluations
        const { data: evals } = await supabase
          .from('performance_evaluations')
          .select('*')
          .eq('company_id', profile.company_id);

        if (evals) setPerformanceEvaluations(evals);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const addEmployee = () => {
    setEmployees([
      ...employees,
      {
        id: crypto.randomUUID(),
        name: "",
        jobDescriptionId: null,
        performanceEvaluationId: null,
        currentCompetencies: {},
        targetCompetencies: {},
        priority: 'medium'
      }
    ]);
  };

  const removeEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    setEmployees(employees.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const applyTemplate = (template: typeof trainingTemplates[0]) => {
    setFormData(prev => ({
      ...prev,
      objectives: template.objectives,
      priorities: template.priorities
    }));
    toast.success(`Applied "${template.name}" template`);
  };

  const suggestObjectives = async () => {
    if (!formData.industry || !formData.companySize) {
      toast.error("Please select industry and company size first");
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-diagnostic', {
        body: {
          type: 'company_objectives',
          context: {
            industry: formData.industry,
            size: formData.companySize
          }
        }
      });

      if (error) throw error;

      if (data?.suggestions && data.suggestions.length > 0) {
        setFormData(prev => ({
          ...prev,
          objectives: data.suggestions.join('\n• ')
        }));
        toast.success("AI suggestions added!");
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      toast.error(error.message || "Failed to generate suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveJobDescription = async (data: any) => {
    try {
      if (!companyId || !user) return;

      const jobData = {
        company_id: companyId,
        created_by: user.id,
        title: data.title,
        department: data.department,
        level: data.level,
        description: data.description,
        responsibilities: data.responsibilities,
        required_skills: data.requiredSkills || [],
        preferred_skills: data.preferredSkills || [],
        competencies: data.competencies
      };

      if (editingJob) {
        const { error } = await supabase
          .from('job_descriptions')
          .update(jobData)
          .eq('id', editingJob.id);
        
        if (error) throw error;
        toast.success("Job description updated");
      } else {
        const { error } = await supabase
          .from('job_descriptions')
          .insert(jobData);
        
        if (error) throw error;
        toast.success("Job description created");
      }

      setShowJobForm(false);
      setEditingJob(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteJobDescription = async (id: string) => {
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Job description deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveEvaluation = async (data: any) => {
    try {
      if (!companyId || !user) return;

      const evalData = {
        company_id: companyId,
        created_by: user.id,
        employee_name: data.employeeName,
        employee_email: data.employeeEmail,
        department: data.department,
        job_description_id: data.jobDescriptionId,
        evaluation_period: data.evaluationPeriod,
        evaluation_date: data.evaluationDate,
        overall_rating: data.overallRating,
        competency_scores: data.competencyScores,
        strengths: data.strengths,
        areas_for_improvement: data.areasForImprovement,
        training_recommendations: data.trainingRecommendations,
        career_goals: data.careerGoals,
        notes: data.notes
      };

      if (editingEval) {
        const { error } = await supabase
          .from('performance_evaluations')
          .update(evalData)
          .eq('id', editingEval.id);
        
        if (error) throw error;
        toast.success("Evaluation updated");
      } else {
        const { error } = await supabase
          .from('performance_evaluations')
          .insert(evalData);
        
        if (error) throw error;
        toast.success("Evaluation created");
      }

      setShowEvalForm(false);
      setEditingEval(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteEvaluation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('performance_evaluations')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      toast.success("Evaluation deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleArrayToggle = (item: string, field: 'languages' | 'priorities' | 'constraints') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item) 
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !companyId) {
      toast.error("Please complete your profile first");
      return;
    }

    if (employees.length === 0) {
      toast.error("Please add at least one employee to the diagnostic");
      return;
    }

    setLoading(true);
    try {
      // Calculate aggregate skill gaps from employees
      const currentSkills: Record<string, number> = {};
      const targetSkills: Record<string, number> = {};

      employees.forEach(emp => {
        Object.entries(emp.currentCompetencies).forEach(([skill, level]) => {
          currentSkills[skill] = (currentSkills[skill] || 0) + level;
        });
        Object.entries(emp.targetCompetencies).forEach(([skill, level]) => {
          targetSkills[skill] = (targetSkills[skill] || 0) + level;
        });
      });

      // Average the skills
      Object.keys(currentSkills).forEach(skill => {
        currentSkills[skill] = currentSkills[skill] / employees.length;
      });
      Object.keys(targetSkills).forEach(skill => {
        targetSkills[skill] = targetSkills[skill] / employees.length;
      });

      // Save diagnostic data
      const { data: diagnostic, error: diagnosticError } = await supabase
        .from('training_diagnostics')
        .insert({
          company_id: companyId,
          created_by: user.id,
          industry: formData.industry,
          company_size: formData.companySize,
          budget_range: formData.budgetRange,
          current_skills: currentSkills,
          target_skills: targetSkills,
          priorities: formData.priorities,
          constraints: formData.constraints
        })
        .select()
        .single();

      if (diagnosticError) throw diagnosticError;

      // Save employee diagnostic data
      for (const emp of employees) {
        await supabase
          .from('training_diagnostic_employees')
          .insert({
            diagnostic_id: diagnostic.id,
            employee_name: emp.name,
            job_description_id: emp.jobDescriptionId,
            performance_evaluation_id: emp.performanceEvaluationId,
            current_competencies: emp.currentCompetencies,
            target_competencies: emp.targetCompetencies,
            priority: emp.priority
          });
      }

      // Prepare enhanced diagnostic data for AI
      const enhancedData = {
        ...formData,
        diagnosticId: diagnostic.id,
        employees: employees.map(emp => ({
          name: emp.name,
          jobDescription: jobDescriptions.find(j => j.id === emp.jobDescriptionId),
          performanceEvaluation: performanceEvaluations.find(p => p.id === emp.performanceEvaluationId),
          currentCompetencies: emp.currentCompetencies,
          targetCompetencies: emp.targetCompetencies,
          priority: emp.priority
        })),
        aggregateSkills: { current: currentSkills, target: targetSkills }
      };

      // Call AI to generate training plan
      const { data: aiPlan, error: aiError } = await supabase.functions
        .invoke('ai-plan-generator', {
          body: {
            objectives: formData.objectives,
            diagnosticData: enhancedData
          }
        });

      if (aiError) throw aiError;

      // Save the generated plan
      const { data: trainingPlan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          company_id: companyId,
          created_by: user.id,
          title: aiPlan.title,
          description: aiPlan.description,
          objectives: aiPlan.objectives,
          target_skills: aiPlan.targetSkills,
          modules: aiPlan.modules,
          duration_months: aiPlan.durationMonths,
          budget: aiPlan.estimatedBudget,
          type: aiPlan.type,
          diagnostic_data: enhancedData as any,
          kpis: aiPlan.kpis,
          giac_approved: aiPlan.giacApproved || false,
          ofppt_compliant: aiPlan.ofpptCompliant || false,
          ai_generated: true
        } as any)
        .select()
        .single();

      if (planError) throw planError;

      toast.success("Training plan generated successfully!");
      navigate(`/workflow/plan/plans/${trainingPlan.id}`);

    } catch (error: any) {
      console.error('Error generating training plan:', error);
      toast.error(error.message || "Failed to generate training plan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{d.title}</h1>
          <p className="text-muted-foreground">{d.subtitle}</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{d.overview}</TabsTrigger>
            <TabsTrigger value="jobs">{d.jobDescriptions}</TabsTrigger>
            <TabsTrigger value="evaluations">{d.performanceEvaluations}</TabsTrigger>
            <TabsTrigger value="diagnostic">{d.diagnostic}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Company Research */}
            <CompanyResearch
              onResearchComplete={(data: CompanyResearchData) => {
                setFormData(prev => ({
                  ...prev,
                  objectives: data.recommendations.suggestedObjectives.join('. '),
                  industry: data.company.industry,
                  companySize: data.company.companySize,
                }));
              }}
            />

            <Card>
              <CardHeader>
                <CardTitle>{d.getStarted}</CardTitle>
                <CardDescription>{d.followSteps}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{d.addJobDescriptions}</h3>
                    <p className="text-sm text-muted-foreground">{d.addJobDescriptionsDesc}</p>
                    <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("jobs")}>
                      {d.manageJobDescriptions}
                    </Button>
                  </div>
                  <Badge variant="secondary">{jobDescriptions.length} {t.common.added}</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{d.addPerformanceEvaluations}</h3>
                    <p className="text-sm text-muted-foreground">{d.addPerformanceEvaluationsDesc}</p>
                    <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("evaluations")}>
                      {d.manageEvaluations}
                    </Button>
                  </div>
                  <Badge variant="secondary">{performanceEvaluations.length} {t.common.added}</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{d.runDiagnostic}</h3>
                    <p className="text-sm text-muted-foreground">{d.runDiagnosticDesc}</p>
                    <Button variant="link" className="p-0 h-auto mt-2" onClick={() => setActiveTab("diagnostic")}>
                      {d.startDiagnostic}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Descriptions Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {showJobForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingJob ? "Edit" : "Create"} Job Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <JobDescriptionForm
                    onSave={handleSaveJobDescription}
                    onCancel={() => {
                      setShowJobForm(false);
                      setEditingJob(null);
                    }}
                    initialData={editingJob}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Job Descriptions</CardTitle>
                      <CardDescription>
                        Define roles and required competencies
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowJobForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Job Description
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobDescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No job descriptions yet
                      </p>
                      <Button onClick={() => setShowJobForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Job Description
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobDescriptions.map((job) => (
                        <Card key={job.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{job.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {job.department} • {job.level}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingJob(job);
                                    setShowJobForm(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteJobDescription(job.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {job.description && (
                              <p className="text-sm mb-4">{job.description}</p>
                            )}
                            {job.competencies && job.competencies.length > 0 && (
                              <div>
                                <Label className="text-xs mb-2 block">Required Competencies</Label>
                                <div className="flex flex-wrap gap-2">
                                  {job.competencies.map((comp: any, idx: number) => (
                                    <Badge key={idx} variant="secondary">
                                      {comp.name} (Level {comp.requiredLevel})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-4">
            {showEvalForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>{editingEval ? "Edit" : "Create"} Performance Evaluation</CardTitle>
                </CardHeader>
                <CardContent>
                  {companyId && (
                    <PerformanceEvaluationForm
                      companyId={companyId}
                      onSave={handleSaveEvaluation}
                      onCancel={() => {
                        setShowEvalForm(false);
                        setEditingEval(null);
                      }}
                      initialData={editingEval}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Performance Evaluations</CardTitle>
                      <CardDescription>
                        Track employee performance and skill levels
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowEvalForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Evaluation
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {performanceEvaluations.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No performance evaluations yet
                      </p>
                      <Button onClick={() => setShowEvalForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Create First Evaluation
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {performanceEvaluations.map((evaluation) => (
                        <Card key={evaluation.id}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{evaluation.employee_name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {evaluation.department} • Overall Rating: {evaluation.overall_rating}/5
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingEval(evaluation);
                                    setShowEvalForm(true);
                                  }}
                                >
                                  Edit
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteEvaluation(evaluation.id)}
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {evaluation.competency_scores && evaluation.competency_scores.length > 0 && (
                              <div className="mb-3">
                                <Label className="text-xs mb-2 block">Competency Scores</Label>
                                <div className="flex flex-wrap gap-2">
                                  {evaluation.competency_scores.map((score: any, idx: number) => (
                                    <Badge key={idx} variant="outline">
                                      {score.name}: {score.score}/5
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            {evaluation.training_recommendations && evaluation.training_recommendations.length > 0 && (
                              <div>
                                <Label className="text-xs mb-2 block">Training Recommendations</Label>
                                <div className="space-y-1">
                                  {evaluation.training_recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                    <p key={idx} className="text-sm text-muted-foreground">• {rec}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Diagnostic Tab */}
          <TabsContent value="diagnostic">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                  <CardDescription>
                    Choose a template or let AI suggest objectives based on your company profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Quick Templates */}
                  <div>
                    <Label className="mb-3 block">Quick Start Templates</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {trainingTemplates.map((template) => (
                        <Card 
                          key={template.name}
                          className="cursor-pointer hover:border-primary transition-colors"
                          onClick={() => applyTemplate(template)}
                        >
                          <CardContent className="pt-4">
                            <h4 className="font-semibold mb-2">{template.name}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.objectives}
                            </p>
                            <div className="flex gap-2 mt-2">
                              {template.priorities.map(p => (
                                <Badge key={p} variant="secondary" className="text-xs">
                                  {p}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Training Objectives *</Label>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={suggestObjectives}
                          disabled={aiLoading || !formData.industry || !formData.companySize}
                        >
                          {aiLoading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Sparkles className="w-4 h-4 mr-2" />
                          )}
                          AI Suggest
                        </Button>
                      </div>
                      <Textarea
                        placeholder="Describe your main training goals and expected outcomes..."
                        value={formData.objectives}
                        onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                        className="min-h-24"
                        required
                      />
                    </div>
                    <div>
                      <Label>Industry *</Label>
                      <Select value={formData.industry} onValueChange={(value) => setFormData(prev => ({ ...prev, industry: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select industry" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Technology">Technology</SelectItem>
                          <SelectItem value="Healthcare">Healthcare</SelectItem>
                          <SelectItem value="Finance">Finance & Banking</SelectItem>
                          <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                          <SelectItem value="Retail">Retail & E-commerce</SelectItem>
                          <SelectItem value="Education">Education</SelectItem>
                          <SelectItem value="Hospitality">Hospitality & Tourism</SelectItem>
                          <SelectItem value="Construction">Construction</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Company Size *</Label>
                      <Select value={formData.companySize} onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1-10">1-10 employees</SelectItem>
                          <SelectItem value="11-50">11-50 employees</SelectItem>
                          <SelectItem value="51-200">51-200 employees</SelectItem>
                          <SelectItem value="201-1000">201-1000 employees</SelectItem>
                          <SelectItem value="1000+">1000+ employees</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-2">
                      <Label>Annual Training Budget</Label>
                      <Select value={formData.budgetRange} onValueChange={(value) => setFormData(prev => ({ ...prev, budgetRange: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent>
                          {budgetRanges.map(range => (
                            <SelectItem key={range} value={range}>{range}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Employees & Skills Assessment */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Employees & Skills Assessment</CardTitle>
                      <CardDescription>
                        Add employees and assess their competency levels
                      </CardDescription>
                    </div>
                    <Button type="button" onClick={addEmployee}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Employee
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {employees.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed rounded-lg">
                      <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        No employees added yet
                      </p>
                      <Button type="button" onClick={addEmployee} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Employee
                      </Button>
                    </div>
                  ) : (
                    employees.map((emp, idx) => (
                      <Card key={emp.id}>
                        <CardContent className="pt-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="font-semibold">Employee #{idx + 1}</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeEmployee(emp.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                          
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Employee Name</Label>
                              <Select 
                                value={emp.name}
                                onValueChange={(value) => {
                                  const perfEval = performanceEvaluations.find(e => e.employee_name === value);
                                  if (perfEval) {
                                    // Auto-populate from evaluation
                                    const currentComp: Record<string, number> = {};
                                    perfEval.competency_scores?.forEach((score: any) => {
                                      currentComp[score.name] = score.score;
                                    });
                                    
                                    const job = jobDescriptions.find(j => j.id === perfEval.job_description_id);
                                    const targetComp: Record<string, number> = {};
                                    job?.competencies?.forEach((comp: any) => {
                                      targetComp[comp.name] = comp.requiredLevel;
                                    });

                                    updateEmployee(emp.id, { 
                                      name: value,
                                      performanceEvaluationId: perfEval.id,
                                      jobDescriptionId: perfEval.job_description_id,
                                      currentCompetencies: currentComp,
                                      targetCompetencies: targetComp
                                    });
                                  } else {
                                    updateEmployee(emp.id, { name: value });
                                  }
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select employee" />
                                </SelectTrigger>
                                <SelectContent>
                                  {performanceEvaluations.map(perfEval => (
                                    <SelectItem key={perfEval.id} value={perfEval.employee_name}>
                                      {perfEval.employee_name}
                                    </SelectItem>
                                  ))}
                                  <SelectItem value="custom">+ Manual Entry</SelectItem>
                                </SelectContent>
                              </Select>
                              {emp.name === "custom" && (
                                <Input
                                  className="mt-2"
                                  placeholder="Enter name"
                                  onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                                />
                              )}
                            </div>
                            <div>
                              <Label>Priority</Label>
                              <Select 
                                value={emp.priority} 
                                onValueChange={(value: 'low' | 'medium' | 'high') => updateEmployee(emp.id, { priority: value })}
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="low">Low Priority</SelectItem>
                                  <SelectItem value="medium">Medium Priority</SelectItem>
                                  <SelectItem value="high">High Priority</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {emp.performanceEvaluationId && (
                            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-sm">
                              <p className="text-green-800 dark:text-green-200">
                                ✓ Skills auto-loaded from performance evaluation
                              </p>
                            </div>
                          )}

                          <div>
                            <Label className="mb-2 block">Competency Assessment</Label>
                            <div className="space-y-3">
                              {skillCategories.slice(0, 5).map(skill => (
                                <div key={skill} className="grid grid-cols-3 gap-4 items-center">
                                  <Label className="text-sm">{skill}</Label>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Current</Label>
                                    <Select 
                                      value={emp.currentCompetencies[skill]?.toString() || ""}
                                      onValueChange={(val) => {
                                        const updated = { ...emp.currentCompetencies, [skill]: parseInt(val) };
                                        updateEmployee(emp.id, { currentCompetencies: updated });
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="1-5" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[1,2,3,4,5].map(level => (
                                          <SelectItem key={level} value={level.toString()}>{level}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Target</Label>
                                    <Select 
                                      value={emp.targetCompetencies[skill]?.toString() || ""}
                                      onValueChange={(val) => {
                                        const updated = { ...emp.targetCompetencies, [skill]: parseInt(val) };
                                        updateEmployee(emp.id, { targetCompetencies: updated });
                                      }}
                                    >
                                      <SelectTrigger>
                                        <SelectValue placeholder="1-5" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {[1,2,3,4,5].map(level => (
                                          <SelectItem key={level} value={level.toString()}>{level}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Languages & Priorities */}
              <Card>
                <CardHeader>
                  <CardTitle>Training Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Preferred Languages</Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {languages.map(lang => (
                        <div key={lang} className="flex items-center space-x-2">
                          <Checkbox
                            id={lang}
                            checked={formData.languages.includes(lang)}
                            onCheckedChange={() => handleArrayToggle(lang, 'languages')}
                          />
                          <Label htmlFor={lang}>{lang}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Priorities</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {priorities.map(priority => (
                        <div key={priority} className="flex items-center space-x-2">
                          <Checkbox
                            id={priority}
                            checked={formData.priorities.includes(priority)}
                            onCheckedChange={() => handleArrayToggle(priority, 'priorities')}
                          />
                          <Label htmlFor={priority}>{priority}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="mb-2 block">Constraints</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {constraints.map(constraint => (
                        <div key={constraint} className="flex items-center space-x-2">
                          <Checkbox
                            id={constraint}
                            checked={formData.constraints.includes(constraint)}
                            onCheckedChange={() => handleArrayToggle(constraint, 'constraints')}
                          />
                          <Label htmlFor={constraint}>{constraint}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/dashboard/company')}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Generating Plan..." : "Generate AI Training Plan"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        {activeTab === 'diagnostic' && employees.length > 0 && (
          <div className="mt-6">
            <ContextualActions currentPage="diagnostic" data={formData} />
          </div>
        )}
      </div>
    </div>
  );
}
