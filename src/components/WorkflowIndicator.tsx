import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Target, Brain, BookOpen, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';

interface WorkflowStep {
  id: string;
  label: string;
  path: string;
  icon: React.ReactNode;
  description: string;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 'assess',
    label: 'Assess',
    path: '/workflow/assess/diagnostic',
    icon: <Target className="w-5 h-5" />,
    description: 'Identify skill gaps'
  },
  {
    id: 'plan',
    label: 'Plan',
    path: '/workflow/plan/builder',
    icon: <Brain className="w-5 h-5" />,
    description: 'Create training plan'
  },
  {
    id: 'execute',
    label: 'Execute',
    path: '/workflow/execute/modules',
    icon: <BookOpen className="w-5 h-5" />,
    description: 'Build content'
  },
  {
    id: 'track',
    label: 'Track',
    path: '/workflow/track/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Measure results'
  }
];

export function WorkflowIndicator() {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentStepIndex = () => {
    const pathSegments = location.pathname.split('/');
    const workflowSection = pathSegments[2]; // e.g. 'assess', 'plan', 'execute', 'track'
    const currentStep = workflowSteps.findIndex(step => step.id === workflowSection);
    return currentStep !== -1 ? currentStep : -1;
  };

  const currentStepIndex = getCurrentStepIndex();
  const nextStep = currentStepIndex !== -1 && currentStepIndex < workflowSteps.length - 1 
    ? workflowSteps[currentStepIndex + 1] 
    : null;

  if (currentStepIndex === -1) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-primary/5 to-accent/10 border-primary/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {workflowSteps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all cursor-pointer ${
                    index === currentStepIndex
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : index < currentStepIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-white/50 text-muted-foreground'
                  }`}
                  onClick={() => navigate(step.path)}
                >
                  {index < currentStepIndex ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    step.icon
                  )}
                  <div className="hidden md:block">
                    <div className="text-xs font-semibold">{step.label}</div>
                    <div className="text-[10px] opacity-80">{step.description}</div>
                  </div>
                </div>
                {index < workflowSteps.length - 1 && (
                  <ArrowRight className="w-4 h-4 mx-2 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>

          {nextStep && (
            <Button
              onClick={() => navigate(nextStep.path)}
              className="ml-4"
            >
              Next: {nextStep.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
