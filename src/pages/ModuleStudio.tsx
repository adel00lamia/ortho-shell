import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Wand2, Save, Play, FileText, Award, QrCode,
  PlusCircle, Trash2, Presentation, MonitorPlay, Download, Link2, Unlink
} from "lucide-react";

import { ContextualActions } from "@/components/ContextualActions";
import { SlideEditor } from "@/components/module-studio/SlideEditor";
import { QuizEditor } from "@/components/module-studio/QuizEditor";
import { PresentationMode } from "@/components/module-studio/PresentationMode";
import { ScormPlayer } from "@/components/module-studio/ScormPlayer";
import { XAPIActivityLog } from "@/components/module-studio/XAPIActivityLog";
import { DiscussionThread } from "@/components/collaboration/DiscussionThread";
import { exportModuleToPDF } from "@/components/module-studio/ModulePDFExport";
import { useModuleProgress } from "@/hooks/useModuleProgress";
import { useTrackEvent } from "@/hooks/useXAPIEvents";
import { Progress } from "@/components/ui/progress";

interface ModuleContent {
  slides?: { title: string; content: string; type?: string; videoUrl?: string; exerciseInstructions?: string; resourceLinks?: string[] }[];
  script?: string;
  quiz?: { question: string; options: string[]; correct: number }[];
}

export default function ModuleStudio() {
  const { planId, moduleId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [module, setModule] = useState<any>(null);
  const [trainingPlan, setTrainingPlan] = useState<any>(null);
  const [trainingPlans, setTrainingPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showPresentation, setShowPresentation] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(planId || "");
  const [showPlanSelector, setShowPlanSelector] = useState(false);

  const isStandalone = !planId;

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_hours: 1,
    content_type: "ai_generated",
    skills_covered: [] as string[],
    target_audience: [] as string[],
    content: {} as ModuleContent,
    scorm_url: "",
    scorm_version: "" as string,
    scorm_entry_point: "index.html",
  });

  const [showScormPlayer, setShowScormPlayer] = useState(false);
  const trackEvent = useTrackEvent();

  useEffect(() => {
    const init = async () => {
      if (planId) await fetchTrainingPlan();
      if (moduleId) await fetchModule();
      if (!planId) await fetchAvailablePlans();
      setLoading(false);
    };
    init();
  }, [planId, moduleId]);

  const fetchTrainingPlan = async () => {
    if (!planId || !user) return;
    try {
      const { data, error } = await supabase.from('training_plans').select('*').eq('id', planId).single();
      if (error) throw error;
      setTrainingPlan(data);
    } catch (error: any) {
      console.error('Error fetching training plan:', error);
      toast.error('Failed to load training plan');
    }
  };

  const fetchAvailablePlans = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('training_plans').select('id, title, status').order('created_at', { ascending: false });
      if (error) throw error;
      setTrainingPlans(data || []);
    } catch (error: any) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchModule = async () => {
    if (!moduleId || !user) return;
    try {
      const { data, error } = await supabase.from('training_modules').select('*').eq('id', moduleId).single();
      if (error) throw error;
      setModule(data);
      setFormData({
        title: data.title || "",
        description: data.description || "",
        duration_hours: data.duration_hours || 1,
        content_type: data.content_type || "ai_generated",
        skills_covered: data.skills_covered || [],
        target_audience: data.target_audience || [],
        content: (data.content as ModuleContent) || {},
        scorm_url: (data as any).scorm_url || "",
        scorm_version: (data as any).scorm_version || "",
        scorm_entry_point: (data as any).scorm_entry_point || "index.html",
      });
    } catch (error: any) {
      console.error('Error fetching module:', error);
      toast.error('Failed to load module');
    }
  };

  const generateAIContent = async (section: 'all' | 'slides' | 'quiz' | 'script' = 'all') => {
    if (!formData.title || !formData.description) {
      toast.error('Please provide title and description before generating content');
      return;
    }

    if (section === 'all') setGenerating(true);
    else setRegeneratingSection(section);

    try {
      const { data, error } = await supabase.functions.invoke('module-content-generator', {
        body: {
          title: formData.title,
          description: formData.description,
          skills: formData.skills_covered,
          audience: formData.target_audience,
          duration: formData.duration_hours,
          regenerateSection: section,
          existingContent: formData.content,
        }
      });

      if (error) throw error;

      if (section === 'all') {
        setFormData(prev => ({ ...prev, content: data.content }));
      } else if (section === 'slides') {
        setFormData(prev => ({ ...prev, content: { ...prev.content, slides: data.slides } }));
      } else if (section === 'quiz') {
        setFormData(prev => ({ ...prev, content: { ...prev.content, quiz: data.quiz } }));
      } else if (section === 'script') {
        setFormData(prev => ({ ...prev, content: { ...prev.content, script: data.script } }));
      }

      if (section === 'all') setActiveTab('content');
      toast.success(section === 'all' ? 'AI content generated!' : `${section} regenerated!`);
    } catch (error: any) {
      console.error('Error generating content:', error);
      toast.error('Failed to generate content: ' + error.message);
    } finally {
      setGenerating(false);
      setRegeneratingSection(null);
    }
  };

  const saveModule = async () => {
    if (!formData.title) {
      toast.error('Please provide a module title');
      return;
    }

    const targetPlanId = planId || selectedPlanId;

    if (!targetPlanId) {
      setShowPlanSelector(true);
      toast.error('Please select a training plan to link the module to, or create one first');
      return;
    }

    if (!user) {
      toast.error('You must be logged in');
      return;
    }

    try {
      const moduleData: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        duration_hours: formData.duration_hours,
        content_type: formData.content_type,
        skills_covered: formData.skills_covered,
        target_audience: formData.target_audience,
        content: formData.content as any,
        training_plan_id: targetPlanId,
        ai_generated: formData.content_type === 'ai_generated',
        scorm_url: formData.scorm_url || null,
        scorm_version: formData.scorm_version || null,
        scorm_entry_point: formData.scorm_entry_point || 'index.html',
      };

      if (moduleId) {
        const { error } = await supabase.from('training_modules').update(moduleData as any).eq('id', moduleId);
        if (error) throw error;
        toast.success('Module updated successfully!');
      } else {
        const { data, error } = await supabase.from('training_modules').insert([moduleData]).select().single();
        if (error) throw error;
        navigate(`/workflow/execute/modules/${targetPlanId}/${data.id}`);
        toast.success('Module created successfully!');
      }
    } catch (error: any) {
      console.error('Error saving module:', error);
      toast.error('Failed to save module');
    }
  };

  const publishModule = async () => {
    if (!moduleId) { await saveModule(); return; }
    try {
      const { error } = await supabase.from('training_modules').update({ completed: false, completion_rate: 0 }).eq('id', moduleId);
      if (error) throw error;
      toast.success('Module published successfully!');
      if (planId) navigate(`/workflow/plan/plans/${planId}`);
      else navigate('/workflow/execute/modules');
    } catch (error: any) {
      console.error('Error publishing module:', error);
      toast.error('Failed to publish module');
    }
  };

  const addSkill = (skill: string) => {
    if (skill && !formData.skills_covered.includes(skill)) {
      setFormData(prev => ({ ...prev, skills_covered: [...prev.skills_covered, skill] }));
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({ ...prev, skills_covered: prev.skills_covered.filter((_, i) => i !== index) }));
  };

  const slides = formData.content.slides || [];
  const quiz = formData.content.quiz || [];

  const {
    progress: learnerProgress,
    markSlideCompleted,
    submitQuizAnswer,
    slideCompletionPercent,
    quizCompletionPercent,
    isComplete,
  } = useModuleProgress(moduleId, slides.length, quiz.length);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">Loading module studio...</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {showPresentation && (
        <PresentationMode
          slides={slides}
          moduleTitle={formData.title || "Module Preview"}
          onClose={() => {
            setShowPresentation(false);
            if (moduleId) {
              trackEvent.mutate({ module_id: moduleId, verb: 'suspended', object_type: 'module' });
            }
          }}
          onSlideViewed={(idx) => {
            if (moduleId) {
              markSlideCompleted(idx);
              trackEvent.mutate({
                module_id: moduleId,
                verb: 'progressed',
                object_type: 'slide',
                object_id: String(idx),
              });
            }
          }}
          completedSlides={learnerProgress.completedSlides}
        />
      )}

      {showScormPlayer && formData.scorm_url && moduleId && (
        <ScormPlayer
          moduleId={moduleId}
          moduleTitle={formData.title || 'SCORM Module'}
          scormUrl={formData.scorm_url}
          entryPoint={formData.scorm_entry_point}
          onClose={() => setShowScormPlayer(false)}
          onComplete={(score, passed) => {
            toast.success(passed ? 'Module completed!' : 'Module finished');
          }}
        />
      )}

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {moduleId ? 'Edit Module' : 'Create New Module'}
              </h1>
              <p className="text-muted-foreground">
                {trainingPlan
                  ? `Linked to plan: ${trainingPlan.title}`
                  : isStandalone
                  ? 'Standalone module — link to a plan when saving'
                  : ''}
              </p>
            </div>
            <div className="flex gap-2">
              {slides.length > 0 && (
                <>
                  <Button variant="outline" onClick={() => {
                    const fileName = exportModuleToPDF({
                      title: formData.title,
                      description: formData.description,
                      duration_hours: formData.duration_hours,
                      skills_covered: formData.skills_covered,
                      slides,
                      quiz,
                      script: formData.content.script,
                    });
                    toast.success(`PDF exported: ${fileName}`);
                  }}>
                    <Download className="w-4 h-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" onClick={() => setShowPresentation(true)}>
                    <Presentation className="w-4 h-4 mr-2" />
                    Present
                  </Button>
                </>
              )}
              <Button onClick={saveModule} variant="outline">
                <Save className="w-4 h-4 mr-2" />
                Save Draft
              </Button>
              <Button onClick={publishModule}>
                <Play className="w-4 h-4 mr-2" />
                Publish Module
              </Button>
            </div>
          </div>

          {/* Plan Selector for standalone mode */}
          {(isStandalone || showPlanSelector) && (
            <Card className="mb-6 border-primary/20 bg-primary/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Link2 className="w-4 h-4" />
                  Link to Training Plan
                </CardTitle>
                <CardDescription>
                  Select a training plan to associate this module with. This is required to save.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1">
                    <Label htmlFor="plan-select" className="text-sm">Training Plan</Label>
                    <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                      <SelectTrigger id="plan-select">
                        <SelectValue placeholder="Select a training plan..." />
                      </SelectTrigger>
                      <SelectContent>
                        {trainingPlans.map((plan) => (
                          <SelectItem key={plan.id} value={plan.id}>
                            <div className="flex items-center gap-2">
                              <span>{plan.title}</span>
                              <Badge variant="outline" className="text-[10px]">{plan.status}</Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/workflow/plan/builder')}
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    New Plan
                  </Button>
                </div>
                {trainingPlans.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-3">
                    No training plans found. Create one first to link your module.
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Module Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            {/* Module Details Tab */}
            <TabsContent value="details" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Basic Information</CardTitle>
                  <CardDescription>Define the module's core details and learning objectives</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Module Title *</Label>
                      <Input id="title" value={formData.title} onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))} placeholder="e.g., Introduction to Cybersecurity" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Hours)</Label>
                      <Input id="duration" type="number" min="1" max="100" value={formData.duration_hours} onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: parseInt(e.target.value) || 1 }))} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what learners will achieve in this module..." className="min-h-24" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content-type">Content Type</Label>
                    <Select value={formData.content_type} onValueChange={(value) => setFormData(prev => ({ ...prev, content_type: value }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ai_generated">AI Generated</SelectItem>
                        <SelectItem value="manual">Manual Creation</SelectItem>
                        <SelectItem value="imported">Imported Content</SelectItem>
                        <SelectItem value="scorm">SCORM Package</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SCORM configuration fields */}
                  {formData.content_type === 'scorm' && (
                    <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                      <h4 className="text-sm font-semibold flex items-center gap-2">
                        <MonitorPlay className="h-4 w-4" /> SCORM Package Configuration
                      </h4>
                      <div className="space-y-2">
                        <Label>SCORM Content URL *</Label>
                        <Input
                          value={formData.scorm_url}
                          onChange={(e) => setFormData(prev => ({ ...prev, scorm_url: e.target.value }))}
                          placeholder="https://your-storage.com/scorm-packages/course1/"
                        />
                        <p className="text-xs text-muted-foreground">URL to the extracted SCORM package folder (must contain imsmanifest.xml)</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>SCORM Version</Label>
                          <Select value={formData.scorm_version} onValueChange={(v) => setFormData(prev => ({ ...prev, scorm_version: v }))}>
                            <SelectTrigger><SelectValue placeholder="Select version" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1.2">SCORM 1.2</SelectItem>
                              <SelectItem value="2004">SCORM 2004</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Entry Point</Label>
                          <Input
                            value={formData.scorm_entry_point}
                            onChange={(e) => setFormData(prev => ({ ...prev, scorm_entry_point: e.target.value }))}
                            placeholder="index.html"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <Label>Skills Covered</Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add a skill..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') { addSkill(e.currentTarget.value); e.currentTarget.value = ''; }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addSkill(input.value); input.value = '';
                      }}>
                        <PlusCircle className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.skills_covered.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {skill}
                          <button onClick={() => removeSkill(index)} className="ml-1 hover:text-destructive">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button onClick={() => generateAIContent('all')} disabled={generating || !formData.title || !formData.description} size="lg">
                      <Wand2 className="w-5 h-5 mr-2" />
                      {generating ? 'Generating Content...' : 'Generate All AI Content'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SlideEditor
                  slides={slides}
                  onSlidesChange={(newSlides) => setFormData(prev => ({ ...prev, content: { ...prev.content, slides: newSlides } }))}
                  onRegenerateSlides={() => generateAIContent('slides')}
                  isRegenerating={regeneratingSection === 'slides'}
                />
                <QuizEditor
                  quiz={quiz}
                  onQuizChange={(newQuiz) => setFormData(prev => ({ ...prev, content: { ...prev.content, quiz: newQuiz } }))}
                  onRegenerateQuiz={() => generateAIContent('quiz')}
                  isRegenerating={regeneratingSection === 'quiz'}
                />
              </div>

              {/* Script Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Training Script</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => generateAIContent('script')} disabled={regeneratingSection === 'script'}>
                      <Wand2 className="w-4 h-4 mr-1" />
                      {regeneratingSection === 'script' ? "Regenerating..." : "Regenerate"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={formData.content.script || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: { ...prev.content, script: e.target.value } }))}
                    placeholder="Instructor script will appear here after AI generation, or you can write your own..."
                    className="min-h-48 font-mono text-sm"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Certificate Configuration
                  </CardTitle>
                  <CardDescription>Set up certificates and badges for module completion</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium">Certificate Details</h4>
                      <div className="space-y-2">
                        <Label>Certificate Title</Label>
                        <Input placeholder="Certificate of Completion" />
                      </div>
                      <div className="space-y-2">
                        <Label>Issuing Organization</Label>
                        <Input placeholder="Your Company Name" />
                      </div>
                      <div className="space-y-2">
                        <Label>Certificate Template</Label>
                        <Select>
                          <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="modern">Modern</SelectItem>
                            <SelectItem value="classic">Classic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h4 className="font-medium">Digital Badge</h4>
                      <div className="space-y-2">
                        <Label>Badge Name</Label>
                        <Input placeholder="Cybersecurity Fundamentals" />
                      </div>
                      <div className="space-y-2">
                        <Label>Badge Criteria</Label>
                        <Textarea placeholder="Learner must complete all modules and pass the final assessment..." className="min-h-20" />
                      </div>
                      <Button variant="outline" className="w-full">
                        <QrCode className="w-4 h-4 mr-2" />
                        Generate QR Verification
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <h5 className="font-medium mb-2">Open Badges Compliance</h5>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your certificates will be compatible with Open Badges 3.0 standard for digital credentialing.
                    </p>
                    <div className="flex gap-2">
                      <Badge variant="outline">Blockchain Verified</Badge>
                      <Badge variant="outline">Open Badges 3.0</Badge>
                      <Badge variant="outline">QR Verification</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Discussion Tab */}
            <TabsContent value="discussion">
              {moduleId ? (
                <DiscussionThread moduleId={moduleId} />
              ) : (
                <Card className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">Save the module first to enable discussions</p>
                </Card>
              )}
            </TabsContent>

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
              {/* Learner Progress Card */}
              {moduleId && (slides.length > 0 || quiz.length > 0) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      Learner Progress
                      {isComplete && <Badge className="bg-green-500/20 text-green-700 border-green-300">Complete</Badge>}
                    </CardTitle>
                    <CardDescription>Track your progress through slides and quizzes</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Slides viewed</span>
                          <span className="font-medium">{learnerProgress.completedSlides.length}/{slides.length}</span>
                        </div>
                        <Progress value={slideCompletionPercent} className="h-2" />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Quiz answered</span>
                          <span className="font-medium">{Object.keys(learnerProgress.quizAnswers).length}/{quiz.length}</span>
                        </div>
                        <Progress value={quizCompletionPercent} className="h-2" />
                      </div>
                    </div>
                    {learnerProgress.quizScore !== null && (
                      <div className="border rounded-lg p-3 bg-muted/50 text-center">
                        <span className="text-sm text-muted-foreground">Quiz Score: </span>
                        <span className="font-bold text-lg">{Math.round(learnerProgress.quizScore)}%</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Module Preview</CardTitle>
                      <CardDescription>Preview how learners will experience this module</CardDescription>
                    </div>
                    {slides.length > 0 && (
                      <Button onClick={() => setShowPresentation(true)}>
                        <MonitorPlay className="w-4 h-4 mr-2" />
                        Fullscreen Presentation
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg p-6 bg-gradient-to-br from-background to-muted/20">
                    <div className="text-center space-y-4">
                      <h2 className="text-2xl font-bold">{formData.title || 'Module Title'}</h2>
                      <p className="text-muted-foreground">{formData.description || 'Module description will appear here'}</p>
                      <div className="flex justify-center gap-4 text-sm">
                        <Badge variant="secondary">{formData.duration_hours}h duration</Badge>
                        <Badge variant="secondary">{slides.length} slides</Badge>
                        <Badge variant="secondary">{quiz.length} questions</Badge>
                      </div>
                    </div>
                  </div>

                  {/* SCORM Launch */}
                  {formData.content_type === 'scorm' && formData.scorm_url && (
                    <div className="mt-6 p-4 bg-muted/50 rounded-lg border text-center space-y-3">
                      <h4 className="font-medium">SCORM Content</h4>
                      <p className="text-sm text-muted-foreground">This module uses an external SCORM {formData.scorm_version || ''} package</p>
                      <Button onClick={() => setShowScormPlayer(true)} size="lg">
                        <MonitorPlay className="w-5 h-5 mr-2" />
                        Launch SCORM Player
                      </Button>
                    </div>
                  )}

                  {/* Mini slide preview strip with completion indicators */}
                  {slides.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Slide Thumbnails</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {slides.map((slide, i) => {
                          const isViewed = learnerProgress.completedSlides.includes(i);
                          return (
                            <button
                              key={i}
                              onClick={() => { setShowPresentation(true); }}
                              className={`border rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-sm transition-all group relative ${isViewed ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20' : ''}`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                                {isViewed && <span className="text-green-500 text-[10px]">✓</span>}
                              </div>
                              <p className="text-xs font-medium line-clamp-2 group-hover:text-primary">{slide.title}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* xAPI Activity Log */}
              {moduleId && (
                <XAPIActivityLog moduleId={moduleId} />
              )}
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex gap-4">
            {planId ? (
              <Button variant="outline" onClick={() => navigate(`/workflow/plan/plans/${planId}`)}>
                Back to Training Plan
              </Button>
            ) : (
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
              </Button>
            )}
          </div>

          {formData.title && formData.description && (
            <div className="mt-6">
              <ContextualActions currentPage="module-studio" data={formData} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
