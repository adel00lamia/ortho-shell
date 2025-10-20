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
import { Briefcase, Users, Target, Upload, Plus, X, FileText } from "lucide-react";

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
  competencies: any; // JSONB from database
}

interface PerformanceEvaluation {
  id: string;
  employee_name: string;
  overall_rating: number;
  competency_scores: any; // JSONB from database
  areas_for_improvement: string[];
  training_recommendations: string[];
}

export default function Diagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [companyId, setCompanyId] = useState<string | null>(null);

  // Job Descriptions & Evaluations
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [performanceEvaluations, setPerformanceEvaluations] = useState<PerformanceEvaluation[]>([]);
  
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
      navigate(`/training-plan/${trainingPlan.id}`);

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
          <h1 className="text-3xl font-bold mb-2">Training Diagnostic & AI Plan Builder</h1>
          <p className="text-muted-foreground">
            Create data-driven training plans based on job descriptions and performance evaluations
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="jobs">Job Descriptions</TabsTrigger>
            <TabsTrigger value="evaluations">Performance Evaluations</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Get Started</CardTitle>
                <CardDescription>
                  Follow these steps to create a comprehensive training plan
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">1. Add Job Descriptions</h3>
                    <p className="text-sm text-muted-foreground">
                      Define roles, required skills, and competency levels
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2"
                      onClick={() => setActiveTab("jobs")}
                    >
                      Manage Job Descriptions →
                    </Button>
                  </div>
                  <Badge variant="secondary">{jobDescriptions.length} added</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">2. Add Performance Evaluations</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload evaluation data to identify skill gaps
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2"
                      onClick={() => setActiveTab("evaluations")}
                    >
                      Manage Evaluations →
                    </Button>
                  </div>
                  <Badge variant="secondary">{performanceEvaluations.length} added</Badge>
                </div>

                <div className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="bg-primary/10 p-2 rounded-lg">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">3. Run Diagnostic</h3>
                    <p className="text-sm text-muted-foreground">
                      AI analyzes data and generates personalized training plan
                    </p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto mt-2"
                      onClick={() => setActiveTab("diagnostic")}
                    >
                      Start Diagnostic →
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Job Descriptions Tab */}
          <TabsContent value="jobs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Job Descriptions</CardTitle>
                <CardDescription>
                  Define roles and required competencies for your organization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Job description management coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For now, you can define competencies directly in the diagnostic
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Evaluations Tab */}
          <TabsContent value="evaluations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Evaluations</CardTitle>
                <CardDescription>
                  Import or create employee performance evaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground mb-4">
                    Performance evaluation management coming soon
                  </p>
                  <p className="text-sm text-muted-foreground">
                    For now, you can assess competencies directly in the diagnostic
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Diagnostic Tab */}
          <TabsContent value="diagnostic">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Company Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Company Overview</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label>Training Objectives</Label>
                    <Textarea
                      placeholder="Describe your main training goals and expected outcomes..."
                      value={formData.objectives}
                      onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                      className="min-h-24"
                      required
                    />
                  </div>
                  <div>
                    <Label>Industry</Label>
                    <Input
                      placeholder="e.g., Technology, Healthcare, Finance"
                      value={formData.industry}
                      onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Company Size</Label>
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
                              <Input
                                value={emp.name}
                                onChange={(e) => updateEmployee(emp.id, { name: e.target.value })}
                                placeholder="Enter name"
                                required
                              />
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
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

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
      </div>
    </div>
  );
}
