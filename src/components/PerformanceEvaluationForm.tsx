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
import ResumeSection from "@/components/performance/ResumeSection";
import SkillsAnalysisCard from "@/components/performance/SkillsAnalysisCard";
import { useLanguage } from "@/contexts/LanguageContext";

interface CompetencyScore {
  name: string;
  score: number;
  category: string;
}

interface ResumeSummary {
  experience: string;
  education: string;
  skills: string[];
  certifications: string[];
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
  const { language, t } = useLanguage();
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
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

  const [resumeUrl, setResumeUrl] = useState<string>(initialData?.resume_url || "");
  const [resumeSummary, setResumeSummary] = useState<ResumeSummary>(
    initialData?.resume_summary && typeof initialData.resume_summary === 'object'
      ? { 
          experience: initialData.resume_summary.experience || "",
          education: initialData.resume_summary.education || "",
          skills: initialData.resume_summary.skills || [],
          certifications: initialData.resume_summary.certifications || [],
        }
      : { experience: "", education: "", skills: [], certifications: [] }
  );
  const [skillsAnalysis, setSkillsAnalysis] = useState<any>(
    initialData?.skills_analysis && Object.keys(initialData.skills_analysis).length > 0
      ? initialData.skills_analysis
      : null
  );

  useEffect(() => {
    loadJobDescriptions();
    loadEmployees();
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

  const loadEmployees = async () => {
    const { data } = await supabase
      .from('company_employees')
      .select('id, full_name, email, department, position')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('full_name');
    if (data) setEmployees(data);
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const emp = employees.find(e => e.id === employeeId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeName: emp.full_name,
        employeeEmail: emp.email || "",
        department: emp.department || prev.department,
      }));
    }
  };

  const loadCompetenciesFromJob = async () => {
    const job = jobDescriptions.find(j => j.id === selectedJobId);
    if (job?.competencies) {
      const scores = (job.competencies as any[]).map((comp: any) => ({
        name: comp.name,
        score: 3,
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

  const getRatingLabel = (rating: number) => {
    const r = t.performance.form.ratings;
    if (rating >= 4.5) return r.exceptional;
    if (rating >= 3.5) return r.exceeds;
    if (rating >= 2.5) return r.meets;
    if (rating >= 1.5) return r.below;
    return r.needsImprovement;
  };

  const suggestWithAI = async (type: 'strengths' | 'improvements' | 'recommendations') => {
    if (!formData.employeeName || competencyScores.length === 0) {
      toast.error(t.performance.enterNameAndScores);
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

      if (type === 'strengths') requestType = 'performance_strengths';
      else if (type === 'improvements') requestType = 'performance_improvements';
      else {
        requestType = 'training_recommendations';
        context.improvements = areasForImprovement;
      }

      const { data, error } = await supabase.functions.invoke('ai-suggest-diagnostic', {
        body: { type: requestType, context }
      });

      if (error) throw error;

      if (data?.suggestions) {
        if (type === 'strengths') setStrengths([...strengths, ...data.suggestions]);
        else if (type === 'improvements') setAreasForImprovement([...areasForImprovement, ...data.suggestions]);
        else setTrainingRecommendations([...trainingRecommendations, ...data.suggestions]);
        toast.success(t.performance.aiSuggestionsAdded);
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      toast.error(error.message || t.performance.failedToGenerate);
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
      trainingRecommendations,
      resumeUrl,
      resumeSummary,
      skillsAnalysis,
    });
  };

  const selectedJob = jobDescriptions.find(j => j.id === selectedJobId);
  const p = t.performance;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{p.form.employeeName} *</Label>
          <Input
            value={formData.employeeName}
            onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
            placeholder={p.form.fullName}
            required
          />
        </div>
        <div>
          <Label>{p.form.email}</Label>
          <Input
            type="email"
            value={formData.employeeEmail}
            onChange={(e) => setFormData(prev => ({ ...prev, employeeEmail: e.target.value }))}
            placeholder={p.form.emailPlaceholder}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{p.form.jobDescription}</Label>
          <Select value={selectedJobId} onValueChange={setSelectedJobId}>
            <SelectTrigger>
              <SelectValue placeholder={p.form.selectJobDescription} />
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
          <Label>{p.form.department}</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder={p.form.departmentPlaceholder}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>{p.form.evaluationPeriod}</Label>
          <Input
            value={formData.evaluationPeriod}
            onChange={(e) => setFormData(prev => ({ ...prev, evaluationPeriod: e.target.value }))}
            placeholder={p.form.evaluationPeriodPlaceholder}
          />
        </div>
        <div>
          <Label>{p.form.evaluationDate} *</Label>
          <Input
            type="date"
            value={formData.evaluationDate}
            onChange={(e) => setFormData(prev => ({ ...prev, evaluationDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label>{p.form.overallRating} *</Label>
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
                  {rating} - {getRatingLabel(rating)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ResumeSection
        resumeUrl={resumeUrl}
        resumeSummary={resumeSummary}
        onResumeUrlChange={setResumeUrl}
        onResumeSummaryChange={setResumeSummary}
        companyId={companyId}
        employeeName={formData.employeeName}
      />

      <div>
        <Label className="text-base mb-4 block">{p.form.competencyScores}</Label>
        <CompetencyScoreCard
          competencies={competencyScores}
          onScoreUpdate={updateCompetencyScore}
        />
      </div>

      <SkillsAnalysisCard
        analysis={skillsAnalysis}
        onAnalysisUpdate={setSkillsAnalysis}
        resumeSummary={resumeSummary}
        jobCompetencies={selectedJob?.competencies || []}
        competencyScores={competencyScores}
        employeeName={formData.employeeName}
        jobTitle={selectedJob?.title || ""}
        language={language}
      />

      <EvaluationSection
        title={p.sections.strengths}
        items={strengths}
        onAdd={(value) => setStrengths([...strengths, value])}
        onRemove={(idx) => setStrengths(strengths.filter((_, i) => i !== idx))}
        placeholder={p.sections.addStrength}
        bgColorClass="bg-green-50 dark:bg-green-900/20"
        onAISuggest={() => suggestWithAI('strengths')}
        aiLoading={aiLoading}
        aiDisabled={!formData.employeeName || competencyScores.length === 0}
        aiSuggestLabel={p.sections.aiSuggest}
      />

      <EvaluationSection
        title={p.sections.areasForImprovement}
        items={areasForImprovement}
        onAdd={(value) => setAreasForImprovement([...areasForImprovement, value])}
        onRemove={(idx) => setAreasForImprovement(areasForImprovement.filter((_, i) => i !== idx))}
        placeholder={p.sections.addImprovement}
        bgColorClass="bg-yellow-50 dark:bg-yellow-900/20"
        onAISuggest={() => suggestWithAI('improvements')}
        aiLoading={aiLoading}
        aiDisabled={!formData.employeeName || competencyScores.length === 0}
        aiSuggestLabel={p.sections.aiSuggest}
      />

      <EvaluationSection
        title={p.sections.trainingRecommendations}
        items={trainingRecommendations}
        onAdd={(value) => setTrainingRecommendations([...trainingRecommendations, value])}
        onRemove={(idx) => setTrainingRecommendations(trainingRecommendations.filter((_, i) => i !== idx))}
        placeholder={p.sections.addRecommendation}
        bgColorClass="bg-blue-50 dark:bg-blue-900/20"
        onAISuggest={() => suggestWithAI('recommendations')}
        aiLoading={aiLoading}
        aiDisabled={areasForImprovement.length === 0}
        aiSuggestLabel={p.sections.aiSuggest}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{p.form.careerGoals}</Label>
          <Textarea
            value={formData.careerGoals}
            onChange={(e) => setFormData(prev => ({ ...prev, careerGoals: e.target.value }))}
            placeholder={p.form.careerGoalsPlaceholder}
            rows={3}
          />
        </div>
        <div>
          <Label>{p.form.additionalNotes}</Label>
          <Textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder={p.form.additionalNotesPlaceholder}
            rows={3}
          />
        </div>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t.common.cancel}
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? p.form.updateEvaluation : p.form.createEvaluation}
        </Button>
      </div>
    </form>
  );
}
