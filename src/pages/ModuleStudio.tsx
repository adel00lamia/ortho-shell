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
  PlusCircle, Trash2, Presentation, MonitorPlay, Download
} from "lucide-react";
import { WorkflowIndicator } from "@/components/WorkflowIndicator";
import { ContextualActions } from "@/components/ContextualActions";
import { SlideEditor } from "@/components/module-studio/SlideEditor";
import { QuizEditor } from "@/components/module-studio/QuizEditor";
import { PresentationMode } from "@/components/module-studio/PresentationMode";
import { exportModuleToPDF } from "@/components/module-studio/ModulePDFExport";

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
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regeneratingSection, setRegeneratingSection] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("details");
  const [showPresentation, setShowPresentation] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration_hours: 1,
    content_type: "ai_generated",
    skills_covered: [] as string[],
    target_audience: [] as string[],
    content: {} as ModuleContent
  });

  useEffect(() => {
    if (planId) fetchTrainingPlan();
    if (moduleId) fetchModule();
    else setLoading(false);
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
        content: (data.content as ModuleContent) || {}
      });
    } catch (error: any) {
      console.error('Error fetching module:', error);
      toast.error('Failed to load module');
      navigate(`/training-plan/${planId}`);
    } finally {
      setLoading(false);
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
    if (!formData.title || !planId || !user) {
      toast.error('Please provide required information');
      return;
    }

    try {
      const moduleData = {
        title: formData.title,
        description: formData.description,
        duration_hours: formData.duration_hours,
        content_type: formData.content_type,
        skills_covered: formData.skills_covered,
        target_audience: formData.target_audience,
        content: formData.content as any,
        training_plan_id: planId,
        ai_generated: formData.content_type === 'ai_generated'
      };

      if (moduleId) {
        const { error } = await supabase.from('training_modules').update(moduleData).eq('id', moduleId);
        if (error) throw error;
        toast.success('Module updated successfully!');
      } else {
        const { data, error } = await supabase.from('training_modules').insert([moduleData]).select().single();
        if (error) throw error;
        navigate(`/module-studio/${planId}/${data.id}`);
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
      navigate(`/training-plan/${planId}`);
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

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">Loading module studio...</div>
        </div>
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>No Training Plan Selected</CardTitle>
            <CardDescription>Module Studio needs to be opened from a training plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To create or edit training modules, please:
            </p>
            <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
              <li>Go to the Training Diagnostic page</li>
              <li>Create a new training plan</li>
              <li>Open the training plan</li>
              <li>Click "Create New Module" to access Module Studio</li>
            </ol>
            <div className="flex gap-2">
              <Button onClick={() => navigate('/diagnostic')}>Go to Training Diagnostic</Button>
              <Button variant="outline" onClick={() => navigate('/')}>Return to Dashboard</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const slides = formData.content.slides || [];
  const quiz = formData.content.quiz || [];

  return (
    <>
      {showPresentation && (
        <PresentationMode
          slides={slides}
          moduleTitle={formData.title || "Module Preview"}
          onClose={() => setShowPresentation(false)}
        />
      )}

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <WorkflowIndicator />

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {moduleId ? 'Edit Module' : 'Create New Module'}
              </h1>
              <p className="text-muted-foreground">
                {trainingPlan && `For training plan: ${trainingPlan.title}`}
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

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details">Module Details</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="certificates">Certificates</TabsTrigger>
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
                      </SelectContent>
                    </Select>
                  </div>

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

            {/* Preview Tab */}
            <TabsContent value="preview" className="space-y-6">
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

                  {/* Mini slide preview strip */}
                  {slides.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-medium mb-3">Slide Thumbnails</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {slides.map((slide, i) => (
                          <button
                            key={i}
                            onClick={() => { setShowPresentation(true); }}
                            className="border rounded-lg p-3 text-left hover:border-primary/50 hover:shadow-sm transition-all group"
                          >
                            <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                            <p className="text-xs font-medium line-clamp-2 group-hover:text-primary">{slide.title}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex gap-4">
            <Button variant="outline" onClick={() => navigate(`/training-plan/${planId}`)}>
              Back to Training Plan
            </Button>
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
