import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Building, TrendingUp, DollarSign, Star, FileText,
  UserCheck, UserX, AlertTriangle, CheckCircle, BarChart3,
  Settings, Shield, Globe, Calendar, Target
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const platformStats = [
    { title: 'Total Users', value: '2,847', icon: Users, change: '+12% this month', color: 'text-blue-500' },
    { title: 'Active Companies', value: '324', icon: Building, change: '+8% this month', color: 'text-green-500' },
    { title: 'Active Trainers', value: '156', icon: UserCheck, change: '+15% this month', color: 'text-purple-500' },
    { title: 'Monthly Revenue', value: '2.4M MAD', icon: DollarSign, change: '+23% vs last month', color: 'text-orange-500' }
  ];

  const pendingApprovals = [
    { type: 'trainer', name: 'Sarah Johnson', company: 'Leadership Expert', status: 'pending', date: '2 days ago' },
    { type: 'training', name: 'Digital Marketing Course', trainer: 'Mike Chen', status: 'review', date: '3 days ago' },
    { type: 'company', name: 'TechCorp Solutions', plan: 'Enterprise', status: 'pending', date: '5 days ago' },
    { type: 'certificate', name: 'Advanced Cybersecurity', trainer: 'Alex Brown', status: 'pending', date: '1 week ago' }
  ];

  const recentActivities = [
    { action: 'New company registered: StartupXYZ', time: '2 hours ago', type: 'registration' },
    { action: 'Trainer profile approved: Digital Marketing Pro', time: '4 hours ago', type: 'approval' },
    { action: 'Payment processed: 45,000 MAD from BigCorp', time: '6 hours ago', type: 'payment' },
    { action: 'Content reported: Inappropriate training material', time: '1 day ago', type: 'report' },
    { action: 'System maintenance completed', time: '2 days ago', type: 'system' }
  ];

  const marketplaceStats = [
    { category: 'Leadership', trainers: 45, courses: 128, rating: 4.7 },
    { category: 'Technology', trainers: 67, courses: 203, rating: 4.8 },
    { category: 'Sales', trainers: 34, courses: 89, rating: 4.6 },
    { category: 'Marketing', trainers: 29, courses: 76, rating: 4.5 }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {platformStats.map((stat, index) => (
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
          <CardTitle>Administrative Actions</CardTitle>
          <CardDescription>Common administrative tasks and system management</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button className="h-20 flex-col" onClick={() => navigate('/admin/users')}>
              <Users className="w-6 h-6 mb-2" />
              <span>Manage Users</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/marketplace')}>
              <Globe className="w-6 h-6 mb-2" />
              <span>Marketplace</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col" onClick={() => navigate('/admin/analytics')}>
              <BarChart3 className="w-6 h-6 mb-2" />
              <span>Analytics</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="w-6 h-6 mb-2" />
              <span>System Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Approvals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-yellow-500" />
              Pending Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingApprovals.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === 'trainer' ? item.company : 
                       item.type === 'training' ? `by ${item.trainer}` :
                       item.type === 'company' ? item.plan : 
                       `by ${item.trainer}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={
                      item.status === 'pending' ? 'destructive' :
                      item.status === 'review' ? 'secondary' : 'outline'
                    }>
                      {item.status}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>
            <Button className="w-full mt-4" variant="outline">
              View All Approvals
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`h-2 w-2 mt-2 rounded-full ${
                    activity.type === 'registration' ? 'bg-green-500' :
                    activity.type === 'approval' ? 'bg-blue-500' :
                    activity.type === 'payment' ? 'bg-purple-500' :
                    activity.type === 'report' ? 'bg-red-500' : 'bg-gray-400'
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

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">User Management</h3>
          <p className="text-muted-foreground">Manage companies, trainers, and platform users</p>
        </div>
        <Button onClick={() => navigate('/admin/users')}>
          <Users className="w-4 h-4 mr-2" />
          Advanced User Management
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Companies
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Companies</span>
                <span className="font-semibold">324</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Subscriptions</span>
                <span className="font-semibold">298</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Free Trial</span>
                <span className="font-semibold">26</span>
              </div>
              <Progress value={92} className="h-2" />
              <p className="text-xs text-muted-foreground">92% retention rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <UserCheck className="w-5 h-5 mr-2" />
              Trainers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Total Trainers</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Verified Profiles</span>
                <span className="font-semibold">142</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending Approval</span>
                <span className="font-semibold">14</span>
              </div>
              <Progress value={91} className="h-2" />
              <p className="text-xs text-muted-foreground">91% verification rate</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Shield className="w-5 h-5 mr-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Server Uptime</span>
                <span className="font-semibold text-green-500">99.9%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Active Sessions</span>
                <span className="font-semibold">1,247</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Daily Backups</span>
                <span className="font-semibold text-green-500">✓ Complete</span>
              </div>
              <Progress value={99.9} className="h-2" />
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderMarketplace = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Marketplace Overview</h3>
          <p className="text-muted-foreground">Monitor trainer marketplace performance and content</p>
        </div>
        <Button onClick={() => navigate('/admin/marketplace')}>
          <Globe className="w-4 h-4 mr-2" />
          Marketplace Management
        </Button>
      </div>

      <div className="grid gap-4">
        {marketplaceStats.map((category, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-lg">{category.category}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {category.trainers} trainers
                    </span>
                    <span className="flex items-center text-sm text-muted-foreground">
                      <FileText className="w-4 h-4 mr-1" />
                      {category.courses} courses
                    </span>
                    <span className="flex items-center text-sm text-muted-foreground">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {category.rating}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline">Active</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(category.rating * 20)}% satisfaction
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Content Moderation</CardTitle>
          <CardDescription>Recent content reviews and moderation actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">98%</div>
              <p className="text-sm text-muted-foreground">Approved Content</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">12</div>
              <p className="text-sm text-muted-foreground">Pending Review</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">3</div>
              <p className="text-sm text-muted-foreground">Rejected Content</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">847</div>
              <p className="text-sm text-muted-foreground">Total Reviews</p>
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
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            System administration and platform management
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          {renderUsers()}
        </TabsContent>
        
        <TabsContent value="marketplace" className="mt-6">
          {renderMarketplace()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;