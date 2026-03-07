import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, BarChart3, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

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
        icon: Brain,
        action: () => navigate('/workflow/plan/builder', { state: { diagnosticData: data } }),
        highlighted: true
      },
      {
        title: 'View Benchmark',
        description: 'Compare results with industry standards',
        icon: TrendingUp,
        action: () => navigate('/workflow/assess/benchmark'),
      }
    ],
    'plan-builder': [
      {
        title: 'Build Modules',
        description: 'Create custom training content',
        icon: BookOpen,
        action: () => navigate('/workflow/execute/modules'),
        highlighted: true
      },
      {
        title: 'Browse Marketplace',
        description: 'Find external courses to complement your plan',
        icon: ArrowRight,
        action: () => navigate('/workflow/execute/marketplace'),
      }
    ],
    'module-studio': [
      {
        title: 'Track Progress',
        description: 'View analytics and ROI metrics',
        icon: BarChart3,
        action: () => navigate('/workflow/track/analytics'),
        highlighted: true
      }
    ],
    performance: [
      {
        title: 'Generate Training Plan',
        description: 'Create plan based on evaluation gaps',
        icon: Brain,
        action: () => navigate('/workflow/plan/builder', { state: { performanceData: data } }),
        highlighted: true
      },
      {
        title: 'Compare Benchmark',
        description: 'See industry performance standards',
        icon: TrendingUp,
        action: () => navigate('/workflow/assess/benchmark'),
      }
    ],
    benchmark: [
      {
        title: 'Start Diagnostic',
        description: 'Assess your current skill levels',
        icon: Brain,
        action: () => navigate('/workflow/assess/diagnostic'),
        highlighted: true
      },
      {
        title: 'Create Plan',
        description: 'Build training plan with AI',
        icon: ArrowRight,
        action: () => navigate('/workflow/plan/builder'),
      }
    ]
  };

  const currentActions = actions[currentPage] || [];

  if (currentActions.length === 0) return null;

  return (
    <div className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-1 w-5 rounded-full bg-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Next Step
        </span>
      </div>

      <div className={`grid gap-3 ${currentActions.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {currentActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <button
              key={index}
              onClick={action.action}
              className={`group flex items-center gap-3 rounded-lg p-3 text-left transition-all duration-200 ${
                action.highlighted
                  ? 'bg-primary/8 hover:bg-primary/14 border border-primary/20'
                  : 'bg-muted/40 hover:bg-muted/70 border border-transparent'
              }`}
            >
              <div className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-lg transition-colors ${
                action.highlighted
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground group-hover:text-foreground'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${
                  action.highlighted ? 'text-foreground' : 'text-foreground/80'
                }`}>
                  {action.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {action.description}
                </p>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${
                action.highlighted ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
