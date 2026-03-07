import { useNavigate } from 'react-router-dom';
import { Brain, BookOpen, BarChart3, TrendingUp, ArrowRight, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

interface ContextualActionsProps {
  currentPage: 'diagnostic' | 'plan-builder' | 'module-studio' | 'performance' | 'benchmark';
  data?: any;
}

export function ContextualActions({ currentPage, data }: ContextualActionsProps) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const ca = t.contextualActions;

  const actions = {
    diagnostic: [
      {
        title: ca.diagnostic.createPlanTitle,
        description: ca.diagnostic.createPlanDesc,
        icon: Brain,
        action: () => navigate('/workflow/plan/builder', { state: { diagnosticData: data } }),
        highlighted: true
      },
      {
        title: ca.diagnostic.viewBenchmarkTitle,
        description: ca.diagnostic.viewBenchmarkDesc,
        icon: TrendingUp,
        action: () => navigate('/workflow/assess/benchmark'),
      }
    ],
    'plan-builder': [
      {
        title: ca.planBuilder.buildModulesTitle,
        description: ca.planBuilder.buildModulesDesc,
        icon: BookOpen,
        action: () => navigate('/workflow/execute/modules'),
        highlighted: true
      },
      {
        title: ca.planBuilder.browseMarketplaceTitle,
        description: ca.planBuilder.browseMarketplaceDesc,
        icon: ArrowRight,
        action: () => navigate('/workflow/execute/marketplace'),
      }
    ],
    'module-studio': [
      {
        title: ca.moduleStudio.trackProgressTitle,
        description: ca.moduleStudio.trackProgressDesc,
        icon: BarChart3,
        action: () => navigate('/workflow/track/analytics'),
        highlighted: true
      }
    ],
    performance: [
      {
        title: ca.performance.generatePlanTitle,
        description: ca.performance.generatePlanDesc,
        icon: Brain,
        action: () => navigate('/workflow/plan/builder', { state: { performanceData: data } }),
        highlighted: true
      },
      {
        title: ca.performance.compareBenchmarkTitle,
        description: ca.performance.compareBenchmarkDesc,
        icon: TrendingUp,
        action: () => navigate('/workflow/assess/benchmark'),
      }
    ],
    benchmark: [
      {
        title: ca.benchmark.startDiagnosticTitle,
        description: ca.benchmark.startDiagnosticDesc,
        icon: Brain,
        action: () => navigate('/workflow/assess/diagnostic'),
        highlighted: true
      },
      {
        title: ca.benchmark.createPlanTitle,
        description: ca.benchmark.createPlanDesc,
        icon: ArrowRight,
        action: () => navigate('/workflow/plan/builder'),
      }
    ]
  };

  const currentActions = actions[currentPage] || [];

  if (currentActions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="rounded-xl border border-border/60 bg-card/50 backdrop-blur-sm p-5"
    >
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex items-center gap-2 mb-4"
      >
        <div className="h-1 w-5 rounded-full bg-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {ca.nextStep}
        </span>
      </motion.div>

      <div className={`grid gap-3 ${currentActions.length > 1 ? 'md:grid-cols-2' : ''}`}>
        {currentActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.35, ease: 'easeOut' }}
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.985 }}
              onClick={action.action}
              className={`group flex items-center gap-3 rounded-lg p-3 text-left transition-colors duration-200 ${
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
              <ChevronRight className={`w-4 h-4 shrink-0 transition-transform duration-200 group-hover:translate-x-0.5 ${
                action.highlighted ? 'text-primary' : 'text-muted-foreground'
              }`} />
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
