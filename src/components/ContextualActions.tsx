import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, BookOpen, BarChart3, TrendingUp, ArrowRight } from 'lucide-react';

interface ContextualActionsProps {
  currentPage: 'diagnostic' | 'plan-builder' | 'module-studio' | 'performance' | 'benchmark';
  data?: any;
}

export function ContextualActions({ currentPage, data }: ContextualActionsProps) {
  const navigate = useNavigate();

  const actions = {
    diagnostic: [
      {
        title: 'Create Training Plan',
        description: 'Use AI to generate a plan based on this diagnostic',
        icon: <Brain className="w-5 h-5" />,
        action: () => navigate('/workflow/plan/builder', { state: { diagnosticData: data } }),
        variant: 'default' as const,
        highlighted: true
      },
      {
        title: 'View Benchmark',
        description: 'Compare results with industry standards',
        icon: <TrendingUp className="w-5 h-5" />,
        action: () => navigate('/workflow/assess/benchmark'),
        variant: 'outline' as const
      }
    ],
    'plan-builder': [
      {
        title: 'Build Modules',
        description: 'Create custom training content',
        icon: <BookOpen className="w-5 h-5" />,
        action: () => navigate('/workflow/execute/modules'),
        variant: 'default' as const,
        highlighted: true
      },
      {
        title: 'Browse Marketplace',
        description: 'Find external courses to complement your plan',
        icon: <ArrowRight className="w-5 h-5" />,
        action: () => navigate('/workflow/execute/marketplace'),
        variant: 'outline' as const
      }
    ],
    'module-studio': [
      {
        title: 'Track Progress',
        description: 'View analytics and ROI metrics',
        icon: <BarChart3 className="w-5 h-5" />,
        action: () => navigate('/workflow/track/analytics'),
        variant: 'default' as const,
        highlighted: true
      }
    ],
    performance: [
      {
        title: 'Generate Training Plan',
        description: 'Create plan based on evaluation gaps',
        icon: <Brain className="w-5 h-5" />,
        action: () => navigate('/workflow/plan/builder', { state: { performanceData: data } }),
        variant: 'default' as const,
        highlighted: true
      },
      {
        title: 'Compare Benchmark',
        description: 'See industry performance standards',
        icon: <TrendingUp className="w-5 h-5" />,
        action: () => navigate('/workflow/assess/benchmark'),
        variant: 'outline' as const
      }
    ],
    benchmark: [
      {
        title: 'Start Diagnostic',
        description: 'Assess your current skill levels',
        icon: <Brain className="w-5 h-5" />,
        action: () => navigate('/workflow/assess/diagnostic'),
        variant: 'default' as const,
        highlighted: true
      },
      {
        title: 'Create Plan',
        description: 'Build training plan with AI',
        icon: <ArrowRight className="w-5 h-5" />,
        action: () => navigate('/workflow/plan/builder'),
        variant: 'outline' as const
      }
    ]
  };

  const currentActions = actions[currentPage] || [];

  if (currentActions.length === 0) return null;

  return (
    <Card className="border-2 border-dashed border-primary/30 bg-gradient-to-br from-primary/5 to-purple-50">
      <CardHeader>
        <CardTitle className="text-lg">What's Next?</CardTitle>
        <CardDescription>
          Continue your training workflow with these suggested actions
        </CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-4">
        {currentActions.map((action, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              action.highlighted ? 'border-2 border-primary bg-gradient-to-br from-blue-50 to-purple-50' : ''
            }`}
            onClick={action.action}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  action.highlighted ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">{action.title}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
}
