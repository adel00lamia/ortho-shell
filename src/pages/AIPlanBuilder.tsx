import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Brain, Sparkles, Target, Clock, DollarSign, Users, ArrowLeft, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface PlanRequirements {
  company: string;
  industry: string;
  companySize: string;
  budget: number;
  duration: number;
  objectives: string[];
  targetSkills: string[];
  constraints: string[];
  aiModel: string;
  context: string;
}

interface GeneratedPlan {
  title: string;
  description: string;
  modules: any[];
  timeline: string;
  budget_breakdown: any;
  kpis: any[];
  recommendations: string[];
}

export default function AIPlanBuilder() {
  const [step, setStep] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [requirements, setRequirements] = useState<PlanRequirements>({
    company: '',
    industry: '',
    companySize: '',
    budget: 50000,
    duration: 12,
    objectives: [],
    targetSkills: [],
    constraints: [],
    aiModel: 'gpt-4o',
    context: ''
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newConstraint, setNewConstraint] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (Balanced)', description: 'Best for comprehensive planning' },
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Advanced)', description: 'Most sophisticated reasoning' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Exceptional efficiency' },
    { value: 'perplexity', label: 'Perplexity AI', description: 'Real-time market insights' }
  ];

  const industries = [
    'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Education',
    'Retail', 'Consulting', 'Government', 'Non-profit', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      if (isGenerating && progress < 90) {
        setProgress(prev => prev + Math.random() * 10);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGenerating, progress]);

  const addToList = (list: string[], setList: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeFromList = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const generatePlan = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate training plans.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('ai-advanced-planner', {
        body: {
          requirements,
          userId: user.id
        }
      });

      if (error) throw error;

      setProgress(100);
      setGeneratedPlan(data.plan);
      setStep(4);
      
      toast({
        title: "Plan Generated Successfully",
        description: "Your AI-powered training plan is ready for review.",
      });
    } catch (error) {
      console.error('Plan generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the training plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan || !user) return;

    try {
      // Get user's profile to get company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          title: generatedPlan.title,
          description: generatedPlan.description,
          modules: generatedPlan.modules,
          budget: requirements.budget,
          duration_months: requirements.duration,
          objectives: requirements.objectives,
          target_skills: requirements.targetSkills,
          kpis: generatedPlan.kpis,
          ai_generated: true,
          created_by: user.id,
          company_id: profile?.company_id || null,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan Saved",
        description: "Your training plan has been saved successfully.",
      });

      navigate(`/training-plan/${data.id}`);
    } catch (error) {
      console.error('Save plan error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the training plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Company & Objectives
              </CardTitle>
              <CardDescription>
                Tell us about your organization and training goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={requirements.company}
                    onChange={(e) => setRequirements({...requirements, company: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={requirements.industry} onValueChange={(value) => 
                    setRequirements({...requirements, industry: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Company Size</label>
                  <Select value={requirements.companySize} onValueChange={(value) => 
                    setRequirements({...requirements, companySize: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Training Objectives</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add training objective"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.objectives, (items) => 
                        setRequirements({...requirements, objectives: items}), newObjective, setNewObjective)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.objectives, (items) => 
                      setRequirements({...requirements, objectives: items}), newObjective, setNewObjective)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.objectives, (items) => 
                        setRequirements({...requirements, objectives: items}), objective)}>
                      {objective} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Additional Context</label>
                <Textarea
                  value={requirements.context}
                  onChange={(e) => setRequirements({...requirements, context: e.target.value})}
                  placeholder="Provide any additional context about your training needs, current challenges, or specific requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Skills & Requirements
              </CardTitle>
              <CardDescription>
                Define the skills you want to develop and any constraints
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Target Skills</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add target skill"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.targetSkills, (items) => 
                        setRequirements({...requirements, targetSkills: items}), newSkill, setNewSkill)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.targetSkills, (items) => 
                      setRequirements({...requirements, targetSkills: items}), newSkill, setNewSkill)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.targetSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.targetSkills, (items) => 
                        setRequirements({...requirements, targetSkills: items}), skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Constraints & Limitations</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    placeholder="Add constraint (e.g., remote only, budget limits)"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.constraints, (items) => 
                        setRequirements({...requirements, constraints: items}), newConstraint, setNewConstraint)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.constraints, (items) => 
                      setRequirements({...requirements, constraints: items}), newConstraint, setNewConstraint)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.constraints.map((constraint, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.constraints, (items) => 
                        setRequirements({...requirements, constraints: items}), constraint)}>
                      {constraint} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Budget (MAD)</label>
                  <Input
                    type="number"
                    value={requirements.budget}
                    onChange={(e) => setRequirements({...requirements, budget: Number(e.target.value)})}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (months)</label>
                  <Input
                    type="number"
                    value={requirements.duration}
                    onChange={(e) => setRequirements({...requirements, duration: Number(e.target.value)})}
                    placeholder="12"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI Model Selection
              </CardTitle>
              <CardDescription>
                Choose the AI model that best fits your planning needs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {aiModels.map((model) => (
                <div
                  key={model.value}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    requirements.aiModel === model.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setRequirements({...requirements, aiModel: model.value})}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{model.label}</h3>
                      <p className="text-sm text-muted-foreground">{model.description}</p>
                    </div>
                    {requirements.aiModel === model.value && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                </div>
              ))}

              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Plan Preview</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Company: {requirements.company || 'Not specified'}</p>
                  <p>• Objectives: {requirements.objectives.length} defined</p>
                  <p>• Target Skills: {requirements.targetSkills.length} skills</p>
                  <p>• Budget: {requirements.budget.toLocaleString()} MAD</p>
                  <p>• Duration: {requirements.duration} months</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return generatedPlan ? (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{generatedPlan.title}</CardTitle>
                <CardDescription>{generatedPlan.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="kpis">KPIs</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Timeline</h4>
                      <p className="text-sm text-muted-foreground">{generatedPlan.timeline}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Key Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {generatedPlan.recommendations?.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="modules" className="space-y-4">
                    {generatedPlan.modules?.map((module, index) => (
                      <Card key={index}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg">{module.title}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground mb-2">{module.description}</p>
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline">{module.duration}</Badge>
                            <Badge variant="outline">{module.type}</Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="budget" className="space-y-4">
                    {generatedPlan.budget_breakdown && (
                      <div className="space-y-2">
                        {Object.entries(generatedPlan.budget_breakdown).map(([category, amount]) => (
                          <div key={category} className="flex justify-between">
                            <span className="capitalize">{category.replace('_', ' ')}</span>
                            <span className="font-medium">{String(amount)} MAD</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="kpis" className="space-y-4">
                    {generatedPlan.kpis?.map((kpi, index) => (
                      <div key={index} className="p-3 border rounded-lg">
                        <h5 className="font-medium">{kpi.name}</h5>
                        <p className="text-sm text-muted-foreground">{kpi.description}</p>
                        <div className="text-xs text-muted-foreground mt-1">
                          Target: {kpi.target}
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  if (isGenerating) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <RefreshCw className="h-5 w-5 animate-spin" />
              Generating Your Training Plan
            </CardTitle>
            <CardDescription>
              Our AI is analyzing your requirements and creating a customized plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progress} className="w-full" />
            <div className="text-center text-sm text-muted-foreground">
              {progress < 30 && "Analyzing company requirements..."}
              {progress >= 30 && progress < 60 && "Mapping skills and objectives..."}
              {progress >= 60 && progress < 90 && "Generating training modules..."}
              {progress >= 90 && "Finalizing your plan..."}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {step > 1 ? 'Previous Step' : 'Back'}
        </Button>
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold">AI Training Plan Builder</h1>
          <p className="text-xl text-muted-foreground">
            Create comprehensive training plans powered by advanced AI
          </p>
          
          {step < 4 && (
            <div className="flex justify-center space-x-2">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    i === step
                      ? 'bg-primary text-primary-foreground'
                      : i < step
                      ? 'bg-primary/20 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {i}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between mt-8">
        <div />
        <div className="flex gap-4">
          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && (!requirements.company || !requirements.industry || requirements.objectives.length === 0)) ||
                (step === 2 && requirements.targetSkills.length === 0)
              }
            >
              Next Step
            </Button>
          )}
          {step === 3 && (
            <Button onClick={generatePlan} disabled={isGenerating}>
              <Brain className="mr-2 h-4 w-4" />
              Generate Plan
            </Button>
          )}
          {step === 4 && generatedPlan && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>
                Start Over
              </Button>
              <Button onClick={savePlan}>
                Save Plan
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}