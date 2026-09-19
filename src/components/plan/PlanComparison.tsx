import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ArrowLeftRight, 
  Check, 
  X, 
  Equal,
  DollarSign,
  Clock,
  BookOpen,
  Target
} from 'lucide-react';
import type { GeneratedPlanSnapshot } from '@/types/trainingPlan';

interface PlanComparisonProps {
  plans: GeneratedPlanSnapshot[];
  onSelectPlan?: (index: number) => void;
}

export const PlanComparison = ({ plans, onSelectPlan }: PlanComparisonProps) => {
  const [selectedPlans, setSelectedPlans] = useState<number[]>([0, 1].filter(i => i < plans.length));

  if (plans.length < 2) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ArrowLeftRight className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Plan Comparison</h3>
          <p className="text-muted-foreground">
            Generate at least 2 plans to compare them side-by-side.
          </p>
        </CardContent>
      </Card>
    );
  }

  const togglePlan = (index: number) => {
    if (selectedPlans.includes(index)) {
      if (selectedPlans.length > 2) {
        setSelectedPlans(prev => prev.filter(i => i !== index));
      }
    } else {
      if (selectedPlans.length < 3) {
        setSelectedPlans(prev => [...prev, index]);
      }
    }
  };

  const comparePlans = plans.filter((_, i) => selectedPlans.includes(i));

  const getTotalBudget = (breakdown: any): number => {
    if (!breakdown) return 0;
    return Object.values(breakdown).reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' MAD';
  };

  const getBestValue = (values: number[], higherIsBetter: boolean = true): number => {
    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5" />
          Plan Comparison
        </CardTitle>
        <CardDescription>
          Compare up to 3 generated plans side-by-side
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Plan Selector */}
        <div className="flex flex-wrap gap-2">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${
                selectedPlans.includes(idx) ? 'bg-primary/10 border-primary' : 'hover:bg-muted'
              }`}
              onClick={() => togglePlan(idx)}
            >
              <Checkbox checked={selectedPlans.includes(idx)} />
              <span className="text-sm font-medium truncate max-w-[150px]">
                {plan.plan.title.substring(0, 25)}...
              </span>
            </div>
          ))}
        </div>

        {/* Comparison Grid */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 w-40 text-sm font-medium text-muted-foreground">
                  Attribute
                </th>
                {comparePlans.map((plan, idx) => (
                  <th key={idx} className="text-center py-3 px-4 min-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-semibold truncate">{plan.plan.title}</p>
                      <Badge variant="outline" className="text-xs">
                        Plan {selectedPlans[idx] + 1}
                      </Badge>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Budget */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Budget</span>
                </td>
                {comparePlans.map((plan, idx) => {
                  const budget = getTotalBudget(plan.plan.budget_breakdown);
                  const budgets = comparePlans.map(p => getTotalBudget(p.plan.budget_breakdown));
                  const isBest = budget === getBestValue(budgets, false);
                  return (
                    <td key={idx} className={`text-center py-3 px-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {formatCurrency(budget)}
                      {isBest && <Badge className="ml-2 bg-green-100 text-green-800">Best</Badge>}
                    </td>
                  );
                })}
              </tr>

              {/* Duration */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Duration</span>
                </td>
                {comparePlans.map((plan, idx) => (
                  <td key={idx} className="text-center py-3 px-4">
                    {plan.requirements.duration} months
                  </td>
                ))}
              </tr>

              {/* Modules Count */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Total Modules</span>
                </td>
                {comparePlans.map((plan, idx) => {
                  const count = plan.plan.modules?.length || 0;
                  const counts = comparePlans.map(p => p.plan.modules?.length || 0);
                  const isBest = count === getBestValue(counts, true);
                  return (
                    <td key={idx} className={`text-center py-3 px-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {count} modules
                      {isBest && <Badge className="ml-2 bg-green-100 text-green-800">Most</Badge>}
                    </td>
                  );
                })}
              </tr>

              {/* KPIs Count */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">KPIs Defined</span>
                </td>
                {comparePlans.map((plan, idx) => (
                  <td key={idx} className="text-center py-3 px-4">
                    {plan.plan.kpis?.length || 0} KPIs
                  </td>
                ))}
              </tr>

              {/* Target Skills */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2">
                  <span className="text-sm font-medium">Target Skills</span>
                </td>
                {comparePlans.map((plan, idx) => (
                  <td key={idx} className="text-center py-3 px-4">
                    <div className="flex flex-wrap justify-center gap-1">
                      {plan.requirements.targetSkills.slice(0, 3).map((skill, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {plan.requirements.targetSkills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{plan.requirements.targetSkills.length - 3}
                        </Badge>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Recommendations */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2">
                  <span className="text-sm font-medium">Recommendations</span>
                </td>
                {comparePlans.map((plan, idx) => (
                  <td key={idx} className="text-center py-3 px-4">
                    {plan.plan.recommendations?.length || 0} strategies
                  </td>
                ))}
              </tr>

              {/* Risk Assessment */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2">
                  <span className="text-sm font-medium">Risk Assessment</span>
                </td>
                {comparePlans.map((plan, idx) => (
                  <td key={idx} className="text-center py-3 px-4">
                    {plan.plan.risk_assessment ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Included
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <X className="h-3 w-3 mr-1" />
                        Not included
                      </Badge>
                    )}
                  </td>
                ))}
              </tr>

              {/* Cost per Module */}
              <tr className="border-b hover:bg-muted/50">
                <td className="py-3 px-2">
                  <span className="text-sm font-medium">Cost per Module</span>
                </td>
                {comparePlans.map((plan, idx) => {
                  const budget = getTotalBudget(plan.plan.budget_breakdown);
                  const modules = plan.plan.modules?.length || 1;
                  const costPerModule = budget / modules;
                  const costs = comparePlans.map(p => {
                    const b = getTotalBudget(p.plan.budget_breakdown);
                    const m = p.plan.modules?.length || 1;
                    return b / m;
                  });
                  const isBest = costPerModule === getBestValue(costs, false);
                  return (
                    <td key={idx} className={`text-center py-3 px-4 ${isBest ? 'text-green-600 font-semibold' : ''}`}>
                      {formatCurrency(costPerModule)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Action Buttons */}
        {onSelectPlan && (
          <div className="flex justify-center gap-4 pt-4">
            {comparePlans.map((plan, idx) => (
              <Button
                key={idx}
                onClick={() => onSelectPlan(selectedPlans[idx])}
                variant={idx === 0 ? 'default' : 'outline'}
              >
                Select Plan {selectedPlans[idx] + 1}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
