import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, Users, Target, Clock, Award, BookOpen, 
  BarChart3, Calendar, CheckCircle, AlertTriangle, PlayCircle,
  FileText, Shield, DollarSign, Lightbulb 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CompanyDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Active Training Plans', value: '12', icon: BookOpen, change: '+2 this month', color: 'text-blue-500' },
    { title: 'Employees Trained', value: '148', icon: Users, change: '+23 this month', color: 'text-green-500' },
    { title: 'Completion Rate', value: '87%', icon: Target, change: '+5% this month', color: 'text-purple-500' },
    { title: 'ROI Generated', value: '285%', icon: DollarSign, change: '+12% this quarter', color: 'text-orange-500' }
  ];

  const complianceItems = [
    { title: 'OFPPT Documentation', status: 'completed', dueDate: 'Dec 31, 2024', progress: 100 },
    { title: 'GIAC Certification Review', status: 'in-progress', dueDate: 'Jan 15, 2025', progress: 65 },
    { title: 'Safety Training Records', status: 'pending', dueDate: 'Jan 30, 2025', progress: 30 },
    { title: 'Skills Assessment Update', status: 'overdue', dueDate: 'Dec 1, 2024', progress: 0 }
  ];

  const kpiData = [
    { metric: 'Training Hours', current: 2840, target: 3000, unit: 'hours' },
    { metric: 'Skill Improvement', current: 78, target: 85, unit: '%' },
    { metric: 'Employee Satisfaction', current: 4.2, target: 4.5, unit: '/5' },
    { metric: 'Cost per Employee', current: 1250, target: 1200, unit: 'MAD' }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Start your training initiatives</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button className="h-20 flex-col" onClick={() => navigate('/dashboard/company/diagnostic')}>
              <Target className="w-6 h-6 mb-2" />
              <span>Skills Diagnostic</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/ai-plan-builder')}>
              <Lightbulb className="w-6 h-6 mb-2" />
              <span>AI Plan Builder</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/marketplace')}>
              <Users className="w-6 h-6 mb-2" />
              <span>Find Trainers</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/dashboard/company/certificates')}>
              <Award className="w-6 h-6 mb-2" />
              <span>Certificates</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm">Digital Marketing plan completed</span>
              </div>
              <div className="flex items-center space-x-3">
                <PlayCircle className="h-4 w-4 text-blue-500" />
                <span className="text-sm">New cybersecurity training started</span>
              </div>
              <div className="flex items-center space-x-3">
                <Award className="h-4 w-4 text-yellow-500" />
                <span className="text-sm">15 certificates issued this week</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">GIAC Review</span>
                <Badge variant="outline">Jan 15</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Safety Training</span>
                <Badge variant="outline">Jan 30</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Q1 Assessment</span>
                <Badge variant="outline">Mar 31</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderCompliance = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Compliance Tracker</h3>
          <p className="text-muted-foreground">OFPPT and GIAC requirements status</p>
        </div>
        <Button onClick={() => navigate('/dashboard/company/compliance')}>
          <FileText className="w-4 h-4 mr-2" />
          Manage Documents
        </Button>
      </div>

      <div className="grid gap-4">
        {complianceItems.map((item, index) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-medium">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">Due: {item.dueDate}</p>
                </div>
                <Badge variant={
                  item.status === 'completed' ? 'default' :
                  item.status === 'in-progress' ? 'secondary' :
                  item.status === 'overdue' ? 'destructive' : 'outline'
                }>
                  {item.status.replace('-', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderKPIs = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Key Performance Indicators</h3>
          <p className="text-muted-foreground">Track your training program effectiveness</p>
        </div>
        <Button onClick={() => navigate('/dashboard/company/kpi')}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Detailed Analytics
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle className="text-base">{kpi.metric}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">
                    {kpi.current} {kpi.unit}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Target: {kpi.target} {kpi.unit}
                  </span>
                </div>
                <Progress 
                  value={(kpi.current / kpi.target) * 100} 
                  className="h-2" 
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Current</span>
                  <span>{Math.round((kpi.current / kpi.target) * 100)}% of target</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ROI Analysis</CardTitle>
          <CardDescription>Return on investment from training programs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">285%</div>
              <p className="text-sm text-muted-foreground">Overall ROI</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">450K</div>
              <p className="text-sm text-muted-foreground">MAD Saved</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">6.2</div>
              <p className="text-sm text-muted-foreground">Months Payback</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Company Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your organization's training and development
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="kpis">KPIs & ROI</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="compliance" className="mt-6">
          {renderCompliance()}
        </TabsContent>
        
        <TabsContent value="kpis" className="mt-6">
          {renderKPIs()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanyDashboard;