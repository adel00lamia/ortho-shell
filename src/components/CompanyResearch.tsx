import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, Building, TrendingUp, Target, DollarSign, 
  Clock, Award, BarChart3, Globe, Loader2, Sparkles,
  BookOpen, Users, Lightbulb, CheckCircle2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface CompanyResearchData {
  company: {
    name: string;
    description: string;
    website?: string;
    industry: string;
    subIndustry?: string;
    companySize: string;
    founded?: string;
    headquarters?: string;
  };
  industryAnalysis: {
    sector: string;
    overview: string;
    marketSize?: string;
    growthRate?: string;
    topTrends: string[];
    keySkills: string[];
    challenges: string[];
  };
  benchmark: {
    avgTrainingBudgetPerEmployee: string;
    avgTrainingHoursPerYear: string;
    topTrainingAreas: string[];
    industryCompletionRate: string;
    avgROI: string;
    certificationRate?: string;
    digitalLearningAdoption?: string;
    competitorTrainingFocus: string[];
  };
  recommendations: {
    suggestedObjectives: string[];
    prioritySkills: string[];
    suggestedBudget: string;
    suggestedDuration: string;
    deliveryMethods: string[];
  };
  branding?: {
    logo?: string;
    favicon?: string;
    colors?: Record<string, string>;
    colorScheme?: string;
  } | null;
}

interface CompanyResearchProps {
  onResearchComplete: (data: CompanyResearchData) => void;
  initialCompanyName?: string;
}

export function CompanyResearch({ onResearchComplete, initialCompanyName = '' }: CompanyResearchProps) {
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [isResearching, setIsResearching] = useState(false);
  const [research, setResearch] = useState<CompanyResearchData | null>(null);
  const { toast } = useToast();

  const handleResearch = async () => {
    if (!companyName.trim()) {
      toast({ title: 'Company name required', description: 'Please enter a company name to research.', variant: 'destructive' });
      return;
    }

    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('company-research', {
        body: { companyName: companyName.trim() }
      });

      if (error) throw error;

      setResearch(data);
      onResearchComplete(data);
      toast({ title: 'Research Complete', description: `Industry analysis for ${data.company?.name || companyName} is ready.` });
    } catch (error: any) {
      console.error('Research error:', error);
      toast({ title: 'Research Failed', description: error.message || 'Could not research this company. Please try again.', variant: 'destructive' });
    } finally {
      setIsResearching(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter company name (e.g., OCP Group, Maroc Telecom, BMCE Bank...)"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="pl-10"
                onKeyDown={(e) => e.key === 'Enter' && handleResearch()}
              />
            </div>
            <Button onClick={handleResearch} disabled={isResearching || !companyName.trim()}>
              {isResearching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Researching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Research
                </>
              )}
            </Button>
          </div>
          {isResearching && (
            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 animate-pulse text-primary" />
              Analyzing company, industry benchmarks, and training insights...
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {research && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          {/* Company Overview */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                {research.branding?.logo ? (
                  <img src={research.branding.logo} alt={research.company.name} className="h-12 w-12 rounded-lg object-contain bg-muted p-1" />
                ) : (
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="flex-1">
                  <CardTitle className="text-lg">{research.company.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{research.company.description}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="secondary">{research.company.industry}</Badge>
                    {research.company.subIndustry && <Badge variant="outline">{research.company.subIndustry}</Badge>}
                    <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{research.company.companySize}</Badge>
                    {research.company.headquarters && <Badge variant="outline"><Globe className="h-3 w-3 mr-1" />{research.company.headquarters}</Badge>}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Industry Analysis + Benchmark Grid */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Industry Analysis */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Industry Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">{research.industryAnalysis.overview}</p>
                {(research.industryAnalysis.marketSize || research.industryAnalysis.growthRate) && (
                  <div className="flex gap-4">
                    {research.industryAnalysis.marketSize && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{research.industryAnalysis.marketSize}</p>
                        <p className="text-xs text-muted-foreground">Market Size</p>
                      </div>
                    )}
                    {research.industryAnalysis.growthRate && (
                      <div className="text-center">
                        <p className="text-lg font-bold text-primary">{research.industryAnalysis.growthRate}</p>
                        <p className="text-xs text-muted-foreground">Growth Rate</p>
                      </div>
                    )}
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-xs font-medium mb-2">Top Trends</p>
                  <div className="flex flex-wrap gap-1.5">
                    {research.industryAnalysis.topTrends.map((trend, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{trend}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Key Challenges</p>
                  <div className="flex flex-wrap gap-1.5">
                    {research.industryAnalysis.challenges.map((c, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{c}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benchmark */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Training Benchmark
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <DollarSign className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-bold">{research.benchmark.avgTrainingBudgetPerEmployee}</p>
                    <p className="text-xs text-muted-foreground">Budget/Employee</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Clock className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-bold">{research.benchmark.avgTrainingHoursPerYear}</p>
                    <p className="text-xs text-muted-foreground">Hours/Year</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Target className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-bold">{research.benchmark.industryCompletionRate}</p>
                    <p className="text-xs text-muted-foreground">Completion Rate</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Award className="h-4 w-4 mx-auto mb-1 text-primary" />
                    <p className="text-sm font-bold">{research.benchmark.avgROI}</p>
                    <p className="text-xs text-muted-foreground">Avg ROI</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium mb-2">Top Training Areas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {research.benchmark.topTrainingAreas.map((area, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2">Competitor Focus</p>
                  <div className="flex flex-wrap gap-1.5">
                    {research.benchmark.competitorTrainingFocus.map((f, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{f}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-primary" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1"><Target className="h-3 w-3" /> Suggested Objectives</p>
                  <ul className="space-y-1">
                    {research.recommendations.suggestedObjectives.map((obj, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs font-medium mb-2 flex items-center gap-1"><BookOpen className="h-3 w-3" /> Priority Skills</p>
                  <div className="flex flex-wrap gap-1.5">
                    {research.recommendations.prioritySkills.map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium flex items-center gap-1"><DollarSign className="h-3 w-3" /> Suggested Budget</p>
                    <p className="text-sm font-bold text-primary">{research.recommendations.suggestedBudget}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium flex items-center gap-1"><Clock className="h-3 w-3" /> Suggested Duration</p>
                    <p className="text-sm font-bold text-primary">{research.recommendations.suggestedDuration}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium">Delivery Methods</p>
                    <div className="flex flex-wrap gap-1">
                      {research.recommendations.deliveryMethods.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-xs">{m}</Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
