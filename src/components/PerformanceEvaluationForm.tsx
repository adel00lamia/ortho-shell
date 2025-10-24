import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import CompetencyScoreCard from "@/components/performance/CompetencyScoreCard";
import EvaluationSection from "@/components/performance/EvaluationSection";

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

      <div>
        <Label className="text-base mb-4 block">Competency Scores</Label>
        <CompetencyScoreCard
          competencies={competencyScores}
          onScoreUpdate={updateCompetencyScore}
        />
      </div>

      <EvaluationSection
        title="Strengths"
        items={strengths}
        onAdd={(value) => setStrengths([...strengths, value])}
        onRemove={(idx) => setStrengths(strengths.filter((_, i) => i !== idx))}
        placeholder="Add a strength..."
        bgColorClass="bg-green-50 dark:bg-green-900/20"
        onAISuggest={() => suggestWithAI('strengths')}
        aiLoading={aiLoading}
        aiDisabled={!formData.employeeName || competencyScores.length === 0}
      />

      <EvaluationSection
        title="Areas for Improvement"
        items={areasForImprovement}
        onAdd={(value) => setAreasForImprovement([...areasForImprovement, value])}
        onRemove={(idx) => setAreasForImprovement(areasForImprovement.filter((_, i) => i !== idx))}
        placeholder="Add an area for improvement..."
        bgColorClass="bg-yellow-50 dark:bg-yellow-900/20"
        onAISuggest={() => suggestWithAI('improvements')}
        aiLoading={aiLoading}
        aiDisabled={!formData.employeeName || competencyScores.length === 0}
      />

      <EvaluationSection
        title="Training Recommendations"
        items={trainingRecommendations}
        onAdd={(value) => setTrainingRecommendations([...trainingRecommendations, value])}
        onRemove={(idx) => setTrainingRecommendations(trainingRecommendations.filter((_, i) => i !== idx))}
        placeholder="Add a training recommendation..."
        bgColorClass="bg-blue-50 dark:bg-blue-900/20"
        onAISuggest={() => suggestWithAI('recommendations')}
        aiLoading={aiLoading}
        aiDisabled={areasForImprovement.length === 0}
      />

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
