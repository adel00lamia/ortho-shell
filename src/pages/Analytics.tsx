import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Clock, 
  Award, 
  Target,
  Download,
  Calendar,
  BookOpen,
  Trophy
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const { t } = useLanguage();
  const a = t.analytics;

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalLearners: 1247,
      activeCourses: 89,
      completionRate: 87,
      averageScore: 92,
      totalHours: 15420,
      certificatesIssued: 342
    },
    engagement: [
      { name: 'Week 1', active: 240, completed: 180 },
      { name: 'Week 2', active: 260, completed: 195 },
      { name: 'Week 3', active: 290, completed: 210 },
      { name: 'Week 4', active: 310, completed: 235 }
    ],
    topCourses: [
      { name: 'Advanced React Development', enrollments: 156, completion: 89, avgScore: 94 },
      { name: 'Data Science Fundamentals', enrollments: 143, completion: 76, avgScore: 87 },
      { name: 'Digital Marketing Strategy', enrollments: 128, completion: 92, avgScore: 91 },
      { name: 'Project Management Essentials', enrollments: 115, completion: 85, avgScore: 88 }
    ],
    skillsProgress: [
      { skill: 'JavaScript', progress: 85, learners: 234 },
      { skill: 'Python', progress: 78, learners: 189 },
      { skill: 'Data Analysis', progress: 72, learners: 156 },
      { skill: 'Leadership', progress: 68, learners: 145 }
    ]
  };

  const exportReport = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{a.title}</h1>
          <p className="text-muted-foreground">{a.subtitle}</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{a.last7Days}</SelectItem>
              <SelectItem value="30d">{a.last30Days}</SelectItem>
              <SelectItem value="90d">{a.last3Months}</SelectItem>
              <SelectItem value="1y">{a.lastYear}</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? a.exporting : a.exportReport}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.totalLearners}</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalLearners.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.fromLastMonth('12%')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.activeCourses}</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activeCourses}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.newThisMonth(5)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.completionRate}</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.completionRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.improvement('3%')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.averageScore}</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageScore}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.increase('2%')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.learningHours}</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalHours.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.thisMonth('890h')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">{a.certificates}</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.certificatesIssued}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              {a.thisMonth('47')}
            </div>
          </CardContent>
        </Card>
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
              <CardContent className="space-y-4">
                {analyticsData.topCourses.map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{course.name}</span>
                      <Badge variant="secondary">{course.completion}% {a.completion}</Badge>
                    </div>
                    <Progress value={course.completion} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.enrollments} {a.enrollments}</span>
                      <span>{a.avgScore}: {course.avgScore}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{a.learningTrends}</CardTitle>
                <CardDescription>{a.weeklyEngagement}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.engagement.map((week, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{week.name}</span>
                        <span>{week.completed}/{week.active} {a.completedOf}</span>
                      </div>
                      <Progress value={(week.completed / week.active) * 100} className="h-2" />
                    </div>
                  ))}
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
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground">{a.dailyActiveUsers}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">42min</div>
                  <div className="text-sm text-muted-foreground">{a.avgSessionDuration}</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">7.2</div>
                  <div className="text-sm text-muted-foreground">{a.pagesPerSession}</div>
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
            <CardContent className="space-y-4">
              {analyticsData.skillsProgress.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">{skill.learners} {a.learners}</span>
                  </div>
                  <Progress value={skill.progress} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    {skill.progress}% {a.proficiencyAchieved}
                  </div>
                </div>
              ))}
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
                <div className="flex justify-between items-center">
                  <span>{a.trainingInvestment}</span>
                  <span className="font-bold">MAD 45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{a.productivityGains}</span>
                  <span className="font-bold text-primary">MAD 135,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{a.netROI}</span>
                  <Badge className="bg-primary">300%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{a.costSavings}</CardTitle>
                <CardDescription>{a.savingsDigitalTraining}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>{a.reducedTravelCosts}</span>
                  <span className="font-bold">MAD 25,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{a.timeEfficiency}</span>
                  <span className="font-bold">MAD 38,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>{a.materialCosts}</span>
                  <span className="font-bold">MAD 12,000</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Analytics;
