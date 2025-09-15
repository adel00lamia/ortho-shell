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

const Analytics = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(false);

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
    // Simulate export
    setTimeout(() => {
      setLoading(false);
      // In real implementation, trigger download
    }, 2000);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track learning progress and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            {loading ? 'Exporting...' : 'Export Report'}
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Learners</CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalLearners.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.activeCourses}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +5 new this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <Target className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.completionRate}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +3% improvement
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Average Score</CardTitle>
              <Trophy className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.averageScore}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2% increase
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Learning Hours</CardTitle>
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.totalHours.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +890h this month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Certificates</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.overview.certificatesIssued}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 mr-1" />
              +47 this month
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="skills">Skills Progress</TabsTrigger>
          <TabsTrigger value="roi">ROI Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Courses</CardTitle>
                <CardDescription>Courses with highest completion rates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {analyticsData.topCourses.map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{course.name}</span>
                      <Badge variant="secondary">{course.completion}% completion</Badge>
                    </div>
                    <Progress value={course.completion} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{course.enrollments} enrollments</span>
                      <span>Avg score: {course.avgScore}%</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Learning Trends</CardTitle>
                <CardDescription>Weekly engagement and completion metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.engagement.map((week, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{week.name}</span>
                        <span>{week.completed}/{week.active} completed</span>
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
              <CardTitle>User Engagement Metrics</CardTitle>
              <CardDescription>Daily and weekly activity patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">85%</div>
                  <div className="text-sm text-muted-foreground">Daily Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">42min</div>
                  <div className="text-sm text-muted-foreground">Avg Session Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">7.2</div>
                  <div className="text-sm text-muted-foreground">Pages per Session</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills Development Progress</CardTitle>
              <CardDescription>Track skill acquisition across your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analyticsData.skillsProgress.map((skill, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">{skill.skill}</span>
                    <span className="text-sm text-muted-foreground">{skill.learners} learners</span>
                  </div>
                  <Progress value={skill.progress} className="h-3" />
                  <div className="text-xs text-muted-foreground">
                    {skill.progress}% proficiency achieved
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
                <CardTitle>Training ROI</CardTitle>
                <CardDescription>Return on investment metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Training Investment</span>
                  <span className="font-bold">MAD 45,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Productivity Gains</span>
                  <span className="font-bold text-primary">MAD 135,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Net ROI</span>
                  <Badge className="bg-primary">300%</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Savings</CardTitle>
                <CardDescription>Savings through digital training</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Reduced Travel Costs</span>
                  <span className="font-bold">MAD 25,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Time Efficiency</span>
                  <span className="font-bold">MAD 38,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Material Costs</span>
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