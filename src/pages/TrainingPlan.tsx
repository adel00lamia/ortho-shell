import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Pencil, Save, X, CheckCircle, Clock, TrendingUp, Target, PlusCircle, ArrowLeft } from "lucide-react";
import MarketplaceIntegration from "@/components/MarketplaceIntegration";

export default function TrainingPlan() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedPlan, setEditedPlan] = useState<any>(null);

  useEffect(() => {
    fetchTrainingPlan();
  }, [id]);

  const fetchTrainingPlan = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setPlan(data);
      setEditedPlan(data);
    } catch (error: any) {
      console.error('Error fetching training plan:', error);
      toast.error('Failed to load training plan');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedPlan || !user) return;

    try {
      const { error } = await supabase
        .from('training_plans')
        .update({
          title: editedPlan.title,
          description: editedPlan.description,
          objectives: editedPlan.objectives,
          target_skills: editedPlan.target_skills,
          duration_months: editedPlan.duration_months,
          budget: editedPlan.budget,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      setPlan(editedPlan);
      setEditing(false);
      toast.success('Training plan updated successfully');
    } catch (error: any) {
      console.error('Error updating training plan:', error);
      toast.error('Failed to update training plan');
    }
  };

  const handleStatusUpdate = async (newStatus: 'draft' | 'active' | 'completed' | 'cancelled') => {
    if (!id || !user) return;

    try {
      const { error } = await supabase
        .from('training_plans')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setPlan(prev => ({ ...prev, status: newStatus }));
      toast.success(`Plan status updated to ${newStatus}`);
    } catch (error: any) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">Loading training plan...</div>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Training Plan Not Found</h2>
          <Button onClick={() => navigate('/')}>Return Home</Button>
        </div>
      </div>
    );
  }

  const modules = plan.modules || [];
  const kpis = plan.kpis || {};
  const completionRate = Math.round((modules.filter((m: any) => m.completed).length / modules.length) * 100) || 0;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex-1">
            {editing ? (
              <div className="space-y-2">
                <Input
                  value={editedPlan?.title || ''}
                  onChange={(e) => setEditedPlan(prev => ({ ...prev, title: e.target.value }))}
                  className="text-2xl font-bold"
                />
                <Textarea
                  value={editedPlan?.description || ''}
                  onChange={(e) => setEditedPlan(prev => ({ ...prev, description: e.target.value }))}
                  className="text-muted-foreground"
                />
              </div>
            ) : (
              <div>
                <h1 className="text-3xl font-bold mb-2">{plan.title}</h1>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <Badge 
              variant={plan.status === 'active' ? 'default' : plan.status === 'completed' ? 'secondary' : 'outline'}
            >
              {plan.status}
            </Badge>
            {plan.ai_generated && <Badge variant="outline">AI Generated</Badge>}
            {plan.ofppt_compliant && <Badge variant="outline">OFPPT Compliant</Badge>}
            {plan.giac_approved && <Badge variant="outline">GIAC Approved</Badge>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mb-8">
          {editing ? (
            <>
              <Button onClick={handleSave} className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => { setEditing(false); setEditedPlan(plan); }}>
                <X className="w-4 h-4" />
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="outline" className="flex items-center gap-2">
              <Pencil className="w-4 h-4" />
              Edit Plan
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => handleStatusUpdate(plan.status === 'active' ? 'completed' : 'active')}
          >
            {plan.status === 'active' ? 'Mark Complete' : 'Activate Plan'}
          </Button>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="modules">Modules</TabsTrigger>
            <TabsTrigger value="marketplace">External Courses</TabsTrigger>
            <TabsTrigger value="kpis">KPIs & Progress</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Duration</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{plan.duration_months} months</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Budget</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {plan.budget ? `${plan.budget.toLocaleString()} MAD` : 'TBD'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completion</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{completionRate}%</div>
                  <Progress value={completionRate} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Objectives */}
            <Card>
              <CardHeader>
                <CardTitle>Training Objectives</CardTitle>
              </CardHeader>
              <CardContent>
                {editing ? (
                  <Textarea
                    value={editedPlan?.objectives?.join('\n') || ''}
                    onChange={(e) => setEditedPlan(prev => ({ 
                      ...prev, 
                      objectives: e.target.value.split('\n').filter(obj => obj.trim()) 
                    }))}
                    className="min-h-24"
                  />
                ) : (
                  <ul className="space-y-2">
                    {(plan.objectives || []).map((objective: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{objective}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* Target Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Target Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(plan.target_skills || []).map((skill: string, index: number) => (
                    <Badge key={index} variant="secondary">{skill}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modules" className="space-y-6">
            <div className="flex justify-end mb-4">
              <Button onClick={() => navigate(`/module-studio/${id}`)}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Create New Module
              </Button>
            </div>
            <div className="grid gap-6">
              {modules.map((module: any, index: number) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <div className="flex gap-2">
                        <Badge variant={module.type === 'internal' ? 'default' : 'secondary'}>
                          {module.type}
                        </Badge>
                        {module.certification && <Badge variant="outline">Certification</Badge>}
                        {module.completed && <Badge variant="default">Completed</Badge>}
                      </div>
                    </div>
                    <CardDescription>{module.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <Label className="font-medium">Duration</Label>
                        <p>{module.duration}</p>
                      </div>
                      <div>
                        <Label className="font-medium">Skills Covered</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(module.skills || []).map((skill: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label className="font-medium">Compliance</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {module.ofpptCompliant && <Badge variant="outline" className="text-xs">OFPPT</Badge>}
                          {module.giacApproved && <Badge variant="outline" className="text-xs">GIAC</Badge>}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="marketplace" className="space-y-6">
            <MarketplaceIntegration 
              planSkills={plan.target_skills || []}
              planBudget={plan.budget}
              onCourseSelect={(course) => {
                console.log('Course selected:', course);
                // Here you could add the course to the plan or open a dialog
              }}
            />
          </TabsContent>

          <TabsContent value="kpis" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Completion Rate Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">{kpis.completionRate || 85}%</div>
                  <Progress value={completionRate} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Current: {completionRate}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Score Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.satisfactionScore || 4.5}/5</div>
                  <p className="text-sm text-muted-foreground">
                    Based on participant feedback
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skill Improvement Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.skillImprovement || 40}%</div>
                  <p className="text-sm text-muted-foreground">
                    Average skill level increase
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROI Target</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{kpis.roiTarget || 300}%</div>
                  <p className="text-sm text-muted-foreground">
                    Return on training investment
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">Type</Label>
                    <p className="capitalize">{plan.type}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Created</Label>
                    <p>{new Date(plan.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">Last Updated</Label>
                    <p>{new Date(plan.updated_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <Label className="font-medium">AI Generated</Label>
                    <p>{plan.ai_generated ? 'Yes' : 'No'}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Compliance & Certification</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="font-medium">OFPPT Compliant</Label>
                    <p>{plan.ofppt_compliant ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <Label className="font-medium">GIAC Approved</Label>
                    <p>{plan.giac_approved ? 'Yes' : 'No'}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 flex gap-4">
          <Button variant="outline" onClick={() => navigate('/')}>
            Back to Dashboard
          </Button>
          <Button onClick={() => navigate('/diagnostic')} variant="outline">
            Create New Plan
          </Button>
        </div>
      </div>
    </div>
  );
}