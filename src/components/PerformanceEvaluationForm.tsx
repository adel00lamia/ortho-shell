import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CompetencyScore {
  name: string;
  score: number;
  category: string;
}

interface PerformanceEvaluationFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  companyId: string;
  initialData?: any;
}

export default function PerformanceEvaluationForm({ 
  onSave, 
  onCancel, 
  companyId,
  initialData 
}: PerformanceEvaluationFormProps) {
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialData?.job_description_id || "");
  const [formData, setFormData] = useState({
    employeeName: initialData?.employee_name || "",
    employeeEmail: initialData?.employee_email || "",
    department: initialData?.department || "",
    evaluationPeriod: initialData?.evaluation_period || "",
    evaluationDate: initialData?.evaluation_date || new Date().toISOString().split('T')[0],
    overallRating: initialData?.overall_rating || 3,
    notes: initialData?.notes || "",
    careerGoals: initialData?.career_goals || ""
  });

  const [competencyScores, setCompetencyScores] = useState<CompetencyScore[]>(
    initialData?.competency_scores || []
  );
  const [strengths, setStrengths] = useState<string[]>(initialData?.strengths || []);
  const [areasForImprovement, setAreasForImprovement] = useState<string[]>(
    initialData?.areas_for_improvement || []
  );
  const [trainingRecommendations, setTrainingRecommendations] = useState<string[]>(
    initialData?.training_recommendations || []
  );

  const [newStrength, setNewStrength] = useState("");
  const [newImprovement, setNewImprovement] = useState("");
  const [newRecommendation, setNewRecommendation] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    loadJobDescriptions();
  }, [companyId]);

  useEffect(() => {
    if (selectedJobId) {
      loadCompetenciesFromJob();
    }
  }, [selectedJobId]);

  const loadJobDescriptions = async () => {
    const { data } = await supabase
      .from('job_descriptions')
      .select('*')
      .eq('company_id', companyId);
    
    if (data) setJobDescriptions(data);
  };

  const loadCompetenciesFromJob = async () => {
    const job = jobDescriptions.find(j => j.id === selectedJobId);
    if (job?.competencies) {
      // Pre-populate competency scores from job description
      const scores = job.competencies.map((comp: any) => ({
        name: comp.name,
        score: 3, // Default mid-level score
        category: comp.category
      }));
      setCompetencyScores(scores);
    }
  };

  const updateCompetencyScore = (index: number, score: number) => {
    setCompetencyScores(prev => 
      prev.map((comp, i) => i === index ? { ...comp, score } : comp)
    );
  };

  const addItem = (value: string, setter: (items: string[]) => void, currentItems: string[]) => {
    if (value.trim()) {
      setter([...currentItems, value]);
      return "";
    }
    return value;
  };

  const removeItem = (index: number, setter: (items: string[]) => void, currentItems: string[]) => {
    setter(currentItems.filter((_, i) => i !== index));
  };

  const suggestWithAI = async (type: 'strengths' | 'improvements' | 'recommendations') => {
    if (!formData.employeeName || competencyScores.length === 0) {
      toast.error("Please enter employee name and score competencies first");
      return;
    }

    setAiLoading(true);
    try {
      const selectedJob = jobDescriptions.find(j => j.id === selectedJobId);
      
      let requestType = '';
      let context: any = {
        employeeName: formData.employeeName,
        jobTitle: selectedJob?.title || 'N/A',
        scores: competencyScores
      };

      if (type === 'strengths') {
        requestType = 'performance_strengths';
      } else if (type === 'improvements') {
        requestType = 'performance_improvements';
      } else {
        requestType = 'training_recommendations';
        context.improvements = areasForImprovement;
      }

      const { data, error } = await supabase.functions.invoke('ai-suggest-diagnostic', {
        body: { type: requestType, context }
      });

      if (error) throw error;

      if (data?.suggestions) {
        if (type === 'strengths') {
          setStrengths([...strengths, ...data.suggestions]);
        } else if (type === 'improvements') {
          setAreasForImprovement([...areasForImprovement, ...data.suggestions]);
        } else {
          setTrainingRecommendations([...trainingRecommendations, ...data.suggestions]);
        }
        toast.success("AI suggestions added!");
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      toast.error(error.message || "Failed to generate suggestions");
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      jobDescriptionId: selectedJobId || null,
      competencyScores,
      strengths,
      areasForImprovement,
      trainingRecommendations
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Employee Name *</Label>
          <Input
            value={formData.employeeName}
            onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
            placeholder="Full name"
            required
          />
        </div>
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            value={formData.employeeEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, employeeEmail: e.target.value }))}
            placeholder="email@company.com"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Job Description</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder="Select job description" />
            </SelectTrigger>
            <SelectContent>
              {jobDescriptions.map(job => (
                <SelectItem key={job.id} value={job.id}>
                  {job.title} {job.department && `(${job.department})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g., Engineering"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Evaluation Period</Label>
          <Input
            value={formData.evaluationPeriod}
            onChange={(e) => setFormData(prev => ({ ...prev, evaluationPeriod: e.target.value }))}
            placeholder="e.g., Q1 2024"
          />
        </div>
        <div>
          <Label>Evaluation Date *</Label>
          <Input
            type="date"
            value={formData.evaluationDate}
            onChange={(e) => setFormData(prev => ({ ...prev, evaluationDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>Overall Rating (1-5) *</Label>
          <Select 
            value={formData.overallRating.toString()} 
            onValueChange={(value) => setFormData(prev => ({ ...prev, overallRating: parseFloat(value) }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5].map(rating => (
                <SelectItem key={rating} value={rating.toString()}>
                  {rating} - {rating >= 4.5 ? 'Exceptional' : rating >= 3.5 ? 'Exceeds' : rating >= 2.5 ? 'Meets' : rating >= 1.5 ? 'Below' : 'Needs Improvement'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <Label className="text-base">Competency Scores</Label>
          {competencyScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select a job description to load competencies for evaluation
            </p>
          ) : (
            <div className="space-y-3">
              {competencyScores.map((comp, idx) => (
                <div key={idx} className="grid grid-cols-2 gap-4 items-center p-3 bg-muted rounded">
                  <div>
                    <div className="font-medium">{comp.name}</div>
                    <div className="text-xs text-muted-foreground">{comp.category}</div>
                  </div>
                  <Select 
                    value={comp.score.toString()} 
                    onValueChange={(value) => updateCompetencyScore(idx, parseFloat(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map(score => (
                        <SelectItem key={score} value={score.toString()}>
                          {score} - {['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][score - 1]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Strengths</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => suggestWithAI('strengths')}
            disabled={aiLoading || !formData.employeeName || competencyScores.length === 0}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Suggest
          </Button>
        </div>
        <div className="space-y-2">
          {strengths.map((strength, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded">{strength}</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx, setStrengths, strengths)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newStrength}
              onChange={(e) => setNewStrength(e.target.value)}
              placeholder="Add a strength..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setNewStrength(addItem(newStrength, setStrengths, strengths)))}
            />
            <Button type="button" onClick={() => setNewStrength(addItem(newStrength, setStrengths, strengths))} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Areas for Improvement</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => suggestWithAI('improvements')}
            disabled={aiLoading || !formData.employeeName || competencyScores.length === 0}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Suggest
          </Button>
        </div>
        <div className="space-y-2">
          {areasForImprovement.map((area, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 text-sm p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">{area}</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx, setAreasForImprovement, areasForImprovement)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newImprovement}
              onChange={(e) => setNewImprovement(e.target.value)}
              placeholder="Add an area for improvement..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setNewImprovement(addItem(newImprovement, setAreasForImprovement, areasForImprovement)))}
            />
            <Button type="button" onClick={() => setNewImprovement(addItem(newImprovement, setAreasForImprovement, areasForImprovement))} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Training Recommendations</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => suggestWithAI('recommendations')}
            disabled={aiLoading || areasForImprovement.length === 0}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            AI Suggest
          </Button>
        </div>
        <div className="space-y-2">
          {trainingRecommendations.map((rec, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 text-sm p-2 bg-blue-50 dark:bg-blue-900/20 rounded">{rec}</div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(idx, setTrainingRecommendations, trainingRecommendations)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newRecommendation}
              onChange={(e) => setNewRecommendation(e.target.value)}
              placeholder="Add a training recommendation..."
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), setNewRecommendation(addItem(newRecommendation, setTrainingRecommendations, trainingRecommendations)))}
            />
            <Button type="button" onClick={() => setNewRecommendation(addItem(newRecommendation, setTrainingRecommendations, trainingRecommendations))} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Career Goals</Label>
          <Textarea
            value={formData.careerGoals}
            onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
            placeholder="Employee's career aspirations..."
            rows={3}
          />
        </div>
        <div>
          <Label>Additional Notes</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any additional observations..."
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? "Update" : "Create"} Evaluation
        </Button>
      </div>
    </form>
  );
}
