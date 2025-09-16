import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  ArrowRight, 
  Clock, 
  Users, 
  Target,
  Sparkles,
  Video,
  FileText,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface TrainingPlan {
  id: string;
  title: string;
  description: string | null;
  status: string | null;
  duration_months: number | null;
  created_at: string | null;
  modules_count?: number;
}

export default function ModuleStudioLanding() {
  const [trainingPlans, setTrainingPlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');
  const [newPlanDescription, setNewPlanDescription] = useState('');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchTrainingPlans();
  }, []);

  const fetchTrainingPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .select(`
          *,
          training_modules(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plansWithModuleCount = data?.map(plan => ({
        id: plan.id,
        title: plan.title,
        description: plan.description,
        status: plan.status,
        duration_months: plan.duration_months,
        created_at: plan.created_at,
        modules_count: plan.training_modules?.[0]?.count || 0
      })) || [];

      setTrainingPlans(plansWithModuleCount);
    } catch (error) {
      console.error('Error fetching training plans:', error);
      toast({
        title: "Error",
        description: "Failed to load training plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createNewPlan = async () => {
    if (!newPlanTitle.trim()) return;

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          title: newPlanTitle,
          description: newPlanDescription,
          status: 'draft',
          duration_months: 1,
          company_id: user?.user_metadata?.company_id || '',
          created_by: user?.id || ''
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Training plan created successfully"
      });

      navigate(`/module-studio/${data.id}`);
    } catch (error) {
      console.error('Error creating training plan:', error);
      toast({
        title: "Error",
        description: "Failed to create training plan",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading training plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Module Studio</h1>
          <p className="text-muted-foreground">
            Create and manage training modules for your courses
          </p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Training Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Training Plan</DialogTitle>
              <DialogDescription>
                Start by creating a training plan to organize your modules
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter training plan title"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Brief description of the training plan"
                  value={newPlanDescription}
                  onChange={(e) => setNewPlanDescription(e.target.value)}
                />
              </div>
              <Button 
                onClick={createNewPlan} 
                disabled={isCreating || !newPlanTitle.trim()}
                className="w-full"
              >
                {isCreating ? 'Creating...' : 'Create Training Plan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Features Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Module Studio Features
          </CardTitle>
          <CardDescription>
            Build engaging training content with our comprehensive studio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Video className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">Video Creation</h4>
                <p className="text-sm text-muted-foreground">Interactive video content</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <FileText className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-medium">AI Content Generation</h4>
                <p className="text-sm text-muted-foreground">Automated slide & quiz creation</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <Award className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium">Certificates</h4>
                <p className="text-sm text-muted-foreground">Digital badges & certificates</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Plans */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Training Plans</h2>
          <p className="text-sm text-muted-foreground">
            {trainingPlans.length} {trainingPlans.length === 1 ? 'plan' : 'plans'} available
          </p>
        </div>

        {trainingPlans.length === 0 ? (
          <Card className="p-8">
            <div className="text-center space-y-4">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">No Training Plans Yet</h3>
                <p className="text-muted-foreground">
                  Create your first training plan to start building modules
                </p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Create New Training Plan</DialogTitle>
                    <DialogDescription>
                      Start by creating a training plan to organize your modules
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter training plan title"
                        value={newPlanTitle}
                        onChange={(e) => setNewPlanTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        placeholder="Brief description of the training plan"
                        value={newPlanDescription}
                        onChange={(e) => setNewPlanDescription(e.target.value)}
                      />
                    </div>
                    <Button 
                      onClick={createNewPlan} 
                      disabled={isCreating || !newPlanTitle.trim()}
                      className="w-full"
                    >
                      {isCreating ? 'Creating...' : 'Create Training Plan'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trainingPlans.map((plan) => (
              <Card key={plan.id} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg line-clamp-1">{plan.title}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {plan.description}
                      </CardDescription>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(plan.status)}`}>
                      {plan.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">General</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {plan.duration_months ? `${plan.duration_months} months` : 'Duration not set'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      {plan.modules_count} {plan.modules_count === 1 ? 'module' : 'modules'}
                    </span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => navigate(`/module-studio/${plan.id}`)}
                      className="flex-1 flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      Open Studio
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}