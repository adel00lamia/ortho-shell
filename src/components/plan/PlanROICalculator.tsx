import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Clock, 
  Target,
  BarChart3,
  Calculator,
  Percent
} from 'lucide-react';

interface PlanROICalculatorProps {
  budget: number;
  duration: number;
  modules: any[];
  employeeCount?: number;
}

export const PlanROICalculator = ({ 
  budget, 
  duration, 
  modules,
  employeeCount = 50 
}: PlanROICalculatorProps) => {
  const [inputs, setInputs] = useState({
    employees: employeeCount,
    avgSalary: 15000, // MAD per month
    productivityGain: 15, // percentage
    turnoverReduction: 20, // percentage
    currentTurnoverRate: 25, // percentage
    errorReduction: 30, // percentage
    avgErrorCost: 5000, // MAD per error
    monthlyErrors: 10, // errors per month
  });

  const calculations = useMemo(() => {
    // Productivity gains
    const annualSalaryBill = inputs.employees * inputs.avgSalary * 12;
    const productivityValue = annualSalaryBill * (inputs.productivityGain / 100);

    // Turnover reduction savings
    const currentTurnoverCost = inputs.employees * (inputs.currentTurnoverRate / 100) * (inputs.avgSalary * 3); // 3 months salary per turnover
    const newTurnoverCost = inputs.employees * ((inputs.currentTurnoverRate - (inputs.currentTurnoverRate * inputs.turnoverReduction / 100)) / 100) * (inputs.avgSalary * 3);
    const turnoverSavings = currentTurnoverCost - newTurnoverCost;

    // Error reduction savings
    const currentErrorCost = inputs.monthlyErrors * inputs.avgErrorCost * 12;
    const errorSavings = currentErrorCost * (inputs.errorReduction / 100);

    // Total benefits
    const totalAnnualBenefits = productivityValue + turnoverSavings + errorSavings;
    
    // ROI calculation
    const roi = ((totalAnnualBenefits - budget) / budget) * 100;
    const paybackMonths = (budget / (totalAnnualBenefits / 12));
    const costPerEmployee = budget / inputs.employees;
    const benefitPerEmployee = totalAnnualBenefits / inputs.employees;

    // 3-year projections
    const year1Benefits = totalAnnualBenefits * 0.6; // 60% in year 1 (during training)
    const year2Benefits = totalAnnualBenefits;
    const year3Benefits = totalAnnualBenefits * 1.1; // 10% compounding
    const threeYearROI = (((year1Benefits + year2Benefits + year3Benefits) - budget) / budget) * 100;

    return {
      productivityValue,
      turnoverSavings,
      errorSavings,
      totalAnnualBenefits,
      roi,
      paybackMonths,
      costPerEmployee,
      benefitPerEmployee,
      year1Benefits,
      year2Benefits,
      year3Benefits,
      threeYearROI,
    };
  }, [inputs, budget]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value) + ' MAD';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          ROI Calculator & Cost-Benefit Analysis
        </CardTitle>
        <CardDescription>
          Estimate the return on investment for your training program
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Input Parameters */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              Workforce Parameters
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Number of Employees</Label>
                <span className="text-sm text-muted-foreground">{inputs.employees}</span>
              </div>
              <Slider
                value={[inputs.employees]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, employees: v }))}
                min={10}
                max={500}
                step={10}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Avg Monthly Salary (MAD)</Label>
                <span className="text-sm text-muted-foreground">{formatCurrency(inputs.avgSalary)}</span>
              </div>
              <Slider
                value={[inputs.avgSalary]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, avgSalary: v }))}
                min={5000}
                max={50000}
                step={1000}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Current Turnover Rate (%)</Label>
                <span className="text-sm text-muted-foreground">{inputs.currentTurnoverRate}%</span>
              </div>
              <Slider
                value={[inputs.currentTurnoverRate]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, currentTurnoverRate: v }))}
                min={5}
                max={50}
                step={1}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Target className="h-4 w-4" />
              Expected Improvements
            </h4>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Productivity Gain (%)</Label>
                <span className="text-sm text-muted-foreground">{inputs.productivityGain}%</span>
              </div>
              <Slider
                value={[inputs.productivityGain]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, productivityGain: v }))}
                min={5}
                max={40}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Turnover Reduction (%)</Label>
                <span className="text-sm text-muted-foreground">{inputs.turnoverReduction}%</span>
              </div>
              <Slider
                value={[inputs.turnoverReduction]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, turnoverReduction: v }))}
                min={5}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <Label>Error Reduction (%)</Label>
                <span className="text-sm text-muted-foreground">{inputs.errorReduction}%</span>
              </div>
              <Slider
                value={[inputs.errorReduction]}
                onValueChange={([v]) => setInputs(prev => ({ ...prev, errorReduction: v }))}
                min={10}
                max={60}
                step={5}
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* ROI Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className={`${calculations.roi >= 100 ? 'border-green-500' : calculations.roi >= 50 ? 'border-yellow-500' : 'border-red-500'}`}>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Annual ROI</span>
              </div>
              <p className={`text-2xl font-bold ${calculations.roi >= 100 ? 'text-green-600' : calculations.roi >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                {calculations.roi.toFixed(0)}%
              </p>
              <Badge variant={calculations.roi >= 100 ? 'default' : 'secondary'} className="mt-1">
                {calculations.roi >= 200 ? 'Excellent' : calculations.roi >= 100 ? 'Good' : calculations.roi >= 50 ? 'Fair' : 'Review Needed'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Payback Period</span>
              </div>
              <p className="text-2xl font-bold">
                {calculations.paybackMonths.toFixed(1)} months
              </p>
              <Badge variant="outline" className="mt-1">
                {calculations.paybackMonths <= duration ? 'Within Plan Duration' : 'Extended'}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Cost/Employee</span>
              </div>
              <p className="text-2xl font-bold">
                {formatCurrency(calculations.costPerEmployee)}
              </p>
              <Badge variant="outline" className="mt-1">Per Person</Badge>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">Annual Benefits</span>
              </div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(calculations.totalAnnualBenefits)}
              </p>
              <Badge variant="outline" className="mt-1">Per Year</Badge>
            </CardContent>
          </Card>
        </div>

        {/* Benefit Breakdown */}
        <div className="space-y-4">
          <h4 className="font-semibold flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Benefit Breakdown
          </h4>
          
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Productivity Gains</span>
                <span className="font-medium text-green-600">{formatCurrency(calculations.productivityValue)}</span>
              </div>
              <Progress value={(calculations.productivityValue / calculations.totalAnnualBenefits) * 100} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Turnover Reduction Savings</span>
                <span className="font-medium text-green-600">{formatCurrency(calculations.turnoverSavings)}</span>
              </div>
              <Progress value={(calculations.turnoverSavings / calculations.totalAnnualBenefits) * 100} className="h-2" />
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Error Reduction Savings</span>
                <span className="font-medium text-green-600">{formatCurrency(calculations.errorSavings)}</span>
              </div>
              <Progress value={(calculations.errorSavings / calculations.totalAnnualBenefits) * 100} className="h-2" />
            </div>
          </div>
        </div>

        <Separator />

        {/* 3-Year Projection */}
        <div className="space-y-4">
          <h4 className="font-semibold">3-Year Financial Projection</h4>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Investment</p>
              <p className="text-lg font-bold text-red-600">-{formatCurrency(budget)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Year 1 Benefits</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(calculations.year1Benefits)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Year 2 Benefits</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(calculations.year2Benefits)}</p>
            </div>
            <div className="p-4 bg-muted/50 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-1">Year 3 Benefits</p>
              <p className="text-lg font-bold text-green-600">+{formatCurrency(calculations.year3Benefits)}</p>
            </div>
          </div>

          <div className="p-4 bg-primary/10 rounded-lg flex items-center justify-between">
            <div>
              <p className="font-medium">3-Year Total ROI</p>
              <p className="text-sm text-muted-foreground">
                Net benefit: {formatCurrency(calculations.year1Benefits + calculations.year2Benefits + calculations.year3Benefits - budget)}
              </p>
            </div>
            <p className="text-3xl font-bold text-primary">{calculations.threeYearROI.toFixed(0)}%</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
