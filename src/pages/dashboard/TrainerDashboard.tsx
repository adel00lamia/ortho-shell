import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, BookOpen, Star, Calendar, TrendingUp, Award,
  FileText, Edit, Eye, Plus, BarChart3, Target, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TrainerDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: 'Active Clients', value: '24', icon: Users, change: '+3 this month', color: 'text-blue-500' },
    { title: 'Training Programs', value: '18', icon: BookOpen, change: '+5 this month', color: 'text-green-500' },
    { title: 'Average Rating', value: '4.8', icon: Star, change: '+0.2 this month', color: 'text-yellow-500' },
    { title: 'Revenue This Month', value: '45K MAD', icon: TrendingUp, change: '+15% vs last month', color: 'text-purple-500' }
  ];

  const trainingPrograms = [
    { title: 'Leadership Excellence', clients: 8, status: 'active', rating: 4.9, progress: 75 },
    { title: 'Digital Marketing Mastery', clients: 12, status: 'active', rating: 4.7, progress: 60 },
    { title: 'Project Management Pro', clients: 6, status: 'draft', rating: 0, progress: 90 },
    { title: 'Sales & Negotiation', clients: 4, status: 'completed', rating: 4.8, progress: 100 }
  ];

  const upcomingSessions = [
    { title: 'Leadership Workshop', client: 'TechCorp', date: 'Tomorrow 10:00', type: 'workshop' },
    { title: 'Marketing Strategy', client: 'StartupXYZ', date: 'Dec 15 14:00', type: 'consultation' },
    { title: 'Team Building', client: 'BigCo Inc', date: 'Dec 18 09:00', type: 'workshop' },
    { title: 'Performance Review', client: 'MedServices', date: 'Dec 20 11:00', type: 'assessment' }
  ];

  const recentActivity = [
    { action: 'New client inquiry from TechStart', time: '2 hours ago', type: 'inquiry' },
    { action: 'Training session completed with BigCorp', time: '5 hours ago', type: 'completion' },
    { action: 'Certificate issued for Leadership program', time: '1 day ago', type: 'certificate' },
    { action: 'Profile viewed 15 times this week', time: '2 days ago', type: 'view' }
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
          <CardDescription>Manage your training business efficiently</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button className="h-20 flex-col" onClick={() => navigate('/dashboard/trainer/profile')}>
              <Edit className="w-6 h-6 mb-2" />
              <span>Edit Profile</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/dashboard/trainer/catalog')}>
              <BookOpen className="w-6 h-6 mb-2" />
              <span>Manage Catalog</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/dashboard/trainer/studio')}>
              <FileText className="w-6 h-6 mb-2" />
              <span>Content Studio</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/dashboard/trainer/certificates')}>
              <Award className="w-6 h-6 mb-2" />
              <span>Certificates</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Sessions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingSessions.map((session, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{session.title}</p>
                    <p className="text-xs text-muted-foreground">{session.client}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {session.type}
                    </Badge>
                    <p className="text-xs text-muted-foreground">{session.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`h-2 w-2 mt-2 rounded-full ${
                    activity.type === 'inquiry' ? 'bg-blue-500' :
                    activity.type === 'completion' ? 'bg-green-500' :
                    activity.type === 'certificate' ? 'bg-yellow-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderPrograms = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Training Programs</h3>
          <p className="text-muted-foreground">Manage your training catalog and programs</p>
        </div>
        <Button onClick={() => navigate('/dashboard/trainer/catalog')}>
          <Plus className="w-4 h-4 mr-2" />
          New Program
        </Button>
      </div>

      <div className="grid gap-4">
        {trainingPrograms.map((program, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{program.title}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {program.clients} clients
                    </span>
                    {program.rating > 0 && (
                      <span className="flex items-center text-sm text-muted-foreground">
                        <Star className="w-4 h-4 mr-1 text-yellow-500" />
                        {program.rating}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant={
                  program.status === 'active' ? 'default' :
                  program.status === 'draft' ? 'secondary' : 'outline'
                }>
                  {program.status}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Development Progress</span>
                  <span>{program.progress}%</span>
                </div>
                <Progress value={program.progress} className="h-2" />
              </div>

              <div className="flex justify-between items-center mt-4">
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    Preview
                  </Button>
                </div>
                <Button size="sm">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Analytics
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderPerformance = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Performance Analytics</h3>
        <p className="text-muted-foreground">Track your training effectiveness and business metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client Satisfaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500">96%</div>
              <p className="text-sm text-muted-foreground">Average satisfaction rate</p>
              <Progress value={96} className="h-2 mt-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Effectiveness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500">89%</div>
              <p className="text-sm text-muted-foreground">Skill improvement rate</p>
              <Progress value={89} className="h-2 mt-3" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Business Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500">+28%</div>
              <p className="text-sm text-muted-foreground">Revenue growth this quarter</p>
              <Progress value={78} className="h-2 mt-3" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>This Month</span>
                <span className="font-semibold">45,000 MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Last Month</span>
                <span className="text-muted-foreground">39,200 MAD</span>
              </div>
              <div className="flex justify-between">
                <span>Growth</span>
                <span className="text-green-500 font-semibold">+14.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Client Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Repeat Clients</span>
                <span className="font-semibold">18/24</span>
              </div>
              <div className="flex justify-between">
                <span>Retention Rate</span>
                <span className="text-green-500 font-semibold">75%</span>
              </div>
              <div className="flex justify-between">
                <span>Referrals</span>
                <span className="font-semibold">6 this month</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trainer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your training business and grow your client base
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="programs" className="mt-6">
          {renderPrograms()}
        </TabsContent>
        
        <TabsContent value="performance" className="mt-6">
          {renderPerformance()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainerDashboard;