import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, TrendingUp, Users, Clock, Award, Target,
  Download, BookOpen, Trophy, Loader2
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.35, delay: i * 0.04 },
  }),
};

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { t } = useLanguage();
  const { user } = useAuth();
  const a = t.analytics;

  // Real data state
  const [realStats, setRealStats] = useState({
    totalModules: 0,
    completedModules: 0,
    totalPlans: 0,
    activePlans: 0,
    totalEvaluations: 0,
    avgRating: 0,
    certificates: 0,
  });

  useEffect(() => {
    const loadRealData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single();
        if (!profile?.company_id) { setLoading(false); return; }
        const companyId = profile.company_id;

        const [modulesRes, plansRes, evalsRes, progressRes] = await Promise.all([
          supabase.from('training_modules').select('id, completed, training_plan_id, training_plans!inner(company_id)').eq('training_plans.company_id', companyId),
          supabase.from('training_plans').select('id, status').eq('company_id', companyId),
          supabase.from('performance_evaluations').select('id, overall_rating').eq('company_id', companyId),
          supabase.from('learner_module_progress').select('id, completed_at'),
        ]);

        const modules = modulesRes.data || [];
        const plans = plansRes.data || [];
        const evals = evalsRes.data || [];
        const progress = progressRes.data || [];

        const ratings = evals.filter(e => e.overall_rating).map(e => e.overall_rating as number);
        const avgRating = ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : 0;

        setRealStats({
          totalModules: modules.length,
          completedModules: modules.filter(m => m.completed).length,
          totalPlans: plans.length,
          activePlans: plans.filter(p => p.status === 'active').length,
          totalEvaluations: evals.length,
          avgRating,
          certificates: progress.filter(p => p.completed_at).length,
        });
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadRealData();
  }, [user]);

  const exportReport = () => {
    setExporting(true);
    setTimeout(() => setExporting(false), 2000);
  };

  const completionRate = realStats.totalModules > 0
    ? Math.round((realStats.completedModules / realStats.totalModules) * 100)
    : 0;

  const overviewCards = [
    { label: a.totalLearners, value: String(realStats.totalEvaluations || '-'), icon: Users, trend: '' },
    { label: a.activeCourses, value: String(realStats.totalModules || '-'), icon: BookOpen, trend: '' },
    { label: a.completionRate, value: `${completionRate}%`, icon: Target, trend: '' },
    { label: a.averageScore, value: realStats.avgRating ? `${realStats.avgRating}/5` : '-', icon: Trophy, trend: '' },
    { label: a.learningHours, value: '-', icon: Clock, trend: '' },
    { label: a.certificates, value: String(realStats.certificates || '-'), icon: Award, trend: '' },
  ];

  return (
    <div className="space-y-6 p-6">
      <motion.div initial="hidden" animate="visible" variants={fadeIn} custom={0} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>{a.title}</h1>
          <p className="text-muted-foreground">{a.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{a.last7Days}</SelectItem>
              <SelectItem value="30d">{a.last30Days}</SelectItem>
              <SelectItem value="90d">{a.last3Months}</SelectItem>
              <SelectItem value="1y">{a.lastYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={exporting} className="gap-2">
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {exporting ? a.exporting : a.exportReport}
          </Button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {overviewCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div key={card.label} initial="hidden" animate="visible" variants={fadeIn} custom={i + 1}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xs font-medium text-muted-foreground">{card.label}</CardTitle>
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" style={{ fontFamily: 'Plus Jakarta Sans' }}>{card.value}</div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <Tabs defaultValue="performance" className="space-y-4">
            <TabsList>
              <TabsTrigger value="performance">{a.performance}</TabsTrigger>
              <TabsTrigger value="engagement">{a.engagement}</TabsTrigger>
              <TabsTrigger value="skills">{a.skillsProgress}</TabsTrigger>
              <TabsTrigger value="roi">{a.roiAnalysis}</TabsTrigger>
            </TabsList>

            <TabsContent value="performance" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{a.topPerformingCourses}</CardTitle>
                    <CardDescription>{a.coursesHighestCompletion}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {realStats.totalModules === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">{'No data yet'}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{a.completionRate}</span>
                            <Badge variant="secondary">{completionRate}%</Badge>
                          </div>
                          <Progress value={completionRate} className="h-2" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{realStats.completedModules} / {realStats.totalModules} modules</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{a.activeCourses}</span>
                            <Badge variant="secondary">{realStats.activePlans}</Badge>
                          </div>
                          <Progress value={realStats.totalPlans > 0 ? (realStats.activePlans / realStats.totalPlans) * 100 : 0} className="h-2" />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{a.learningTrends}</CardTitle>
                    <CardDescription>{a.weeklyEngagement}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-4 rounded-xl bg-primary/5">
                          <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'Plus Jakarta Sans' }}>{realStats.totalPlans}</div>
                          <div className="text-xs text-muted-foreground mt-1">{a.activeCourses}</div>
                        </div>
                        <div className="text-center p-4 rounded-xl bg-accent/5">
                          <div className="text-3xl font-bold text-accent" style={{ fontFamily: 'Plus Jakarta Sans' }}>{realStats.certificates}</div>
                          <div className="text-xs text-muted-foreground mt-1">{a.certificates}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="engagement" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{a.userEngagementMetrics}</CardTitle>
                  <CardDescription>{a.dailyWeeklyPatterns}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="text-center p-6 rounded-xl bg-muted/50">
                      <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'Plus Jakarta Sans' }}>{realStats.totalEvaluations}</div>
                      <div className="text-sm text-muted-foreground mt-1">{a.totalLearners}</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-muted/50">
                      <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'Plus Jakarta Sans' }}>{completionRate}%</div>
                      <div className="text-sm text-muted-foreground mt-1">{a.completionRate}</div>
                    </div>
                    <div className="text-center p-6 rounded-xl bg-muted/50">
                      <div className="text-3xl font-bold text-primary" style={{ fontFamily: 'Plus Jakarta Sans' }}>{realStats.avgRating || '-'}</div>
                      <div className="text-sm text-muted-foreground mt-1">{a.averageScore}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="skills" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{a.skillsDevelopmentProgress}</CardTitle>
                  <CardDescription>{a.trackSkillAcquisition}</CardDescription>
                </CardHeader>
                <CardContent>
                  {realStats.totalModules === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Target className="h-10 w-10 mx-auto mb-3 opacity-30" />
                      <p className="text-sm">{'No skills data yet. Create training modules to track progress.'}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-medium">{a.completionRate}</span>
                          <span className="text-sm text-muted-foreground">{realStats.totalModules} modules</span>
                        </div>
                        <Progress value={completionRate} className="h-3" />
                        <div className="text-xs text-muted-foreground">
                          {completionRate}% {a.proficiencyAchieved}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="roi" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>{a.trainingROI}</CardTitle>
                    <CardDescription>{a.returnOnInvestment}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">{a.trainingInvestment}</span>
                      <span className="font-bold">MAD 45,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">{a.productivityGains}</span>
                      <span className="font-bold text-primary">MAD 135,000</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t">
                      <span className="text-sm font-medium">{a.netROI}</span>
                      <Badge className="bg-primary text-primary-foreground">300%</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{a.costSavings}</CardTitle>
                    <CardDescription>{a.savingsDigitalTraining}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">{a.reducedTravelCosts}</span>
                      <span className="font-bold">MAD 25,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">{a.timeEfficiency}</span>
                      <span className="font-bold">MAD 38,000</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm">{a.materialCosts}</span>
                      <span className="font-bold">MAD 12,000</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default Analytics;
