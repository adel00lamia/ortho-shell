import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export default function Diagnostic() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    objectives: "",
    currentSkills: {},
    targetSkills: {},
    budgetRange: "",
    languages: [] as string[],
    industry: "",
    companySize: "",
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

  const handleSkillChange = (category: string, level: number, type: 'current' | 'target') => {
    setFormData(prev => ({
      ...prev,
      [`${type}Skills`]: {
        ...prev[`${type}Skills` as keyof typeof prev] as object,
        [category]: level
      }
    }));
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
    if (!user) return;

    setLoading(true);
    try {
      // Get user's profile to get company_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        toast.error("Please complete your company profile first");
        return;
      }

      // Save diagnostic data
      const { data: diagnostic, error: diagnosticError } = await supabase
        .from('training_diagnostics')
        .insert({
          company_id: profile.company_id,
          created_by: user.id,
          industry: formData.industry,
          company_size: formData.companySize,
          budget_range: formData.budgetRange,
          current_skills: formData.currentSkills,
          target_skills: formData.targetSkills,
          priorities: formData.priorities,
          constraints: formData.constraints
        })
        .select()
        .single();

      if (diagnosticError) throw diagnosticError;

      // Call AI to generate training plan
      const { data: aiPlan, error: aiError } = await supabase.functions
        .invoke('ai-plan-generator', {
          body: {
            objectives: formData.objectives,
            diagnosticData: {
              ...formData,
              diagnosticId: diagnostic.id
            }
          }
        });

      if (aiError) throw aiError;

      // Save the generated plan
      const { data: trainingPlan, error: planError } = await supabase
        .from('training_plans')
        .insert({
          company_id: profile.company_id,
          created_by: user.id,
          title: aiPlan.title,
          description: aiPlan.description,
          objectives: aiPlan.objectives,
          target_skills: aiPlan.targetSkills,
          modules: aiPlan.modules,
          duration_months: aiPlan.durationMonths,
          budget: aiPlan.estimatedBudget,
          type: aiPlan.type,
          diagnostic_data: formData,
          kpis: aiPlan.kpis,
          giac_approved: aiPlan.giacApproved || false,
          ofppt_compliant: aiPlan.ofpptCompliant || false,
          ai_generated: true
        })
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Training Diagnostic & AI Plan Builder</h1>
          <p className="text-muted-foreground">
            Help us understand your training needs to generate a personalized annual training plan
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Objectives */}
          <Card>
            <CardHeader>
              <CardTitle>Training Objectives</CardTitle>
              <CardDescription>What are your main training goals?</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe your training objectives and expected outcomes..."
                value={formData.objectives}
                onChange={(e) => setFormData(prev => ({ ...prev, objectives: e.target.value }))}
                className="min-h-24"
                required
              />
            </CardContent>
          </Card>

          {/* Company Info */}
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  placeholder="e.g., Technology, Healthcare, Finance"
                  value={formData.industry}
                  onChange={(e) => setFormData(prev => ({ ...prev, industry: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="companySize">Company Size</Label>
                <Select value={formData.companySize} onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select company size" />
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
            </CardContent>
          </Card>

          {/* Budget */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Range</CardTitle>
              <CardDescription>Annual training budget</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle>Preferred Languages</CardTitle>
              <CardDescription>Select training languages</CardDescription>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Skills Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
              <CardDescription>Rate current skills (1-5) and target improvement levels</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillCategories.map(skill => (
                  <div key={skill} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                    <Label className="font-medium">{skill}</Label>
                    <div>
                      <Label className="text-sm text-muted-foreground">Current Level</Label>
                      <Select onValueChange={(value) => handleSkillChange(skill, parseInt(value), 'current')}>
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
                      <Label className="text-sm text-muted-foreground">Target Level</Label>
                      <Select onValueChange={(value) => handleSkillChange(skill, parseInt(value), 'target')}>
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
            </CardContent>
          </Card>

          {/* Priorities */}
          <Card>
            <CardHeader>
              <CardTitle>Training Priorities</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Constraints */}
          <Card>
            <CardHeader>
              <CardTitle>Training Constraints</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Generating Plan..." : "Generate AI Training Plan"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}