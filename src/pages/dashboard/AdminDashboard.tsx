import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, ShoppingCart, BarChart3, Settings, Shield, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform management and analytics</p>
      </div>

      {/* Platform Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">1,247</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Trainers</CardDescription>
            <CardTitle className="text-3xl">89</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+5 new this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Companies</CardDescription>
            <CardTitle className="text-3xl">156</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Revenue (MAD)</CardDescription>
            <CardTitle className="text-3xl">2.4M</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">+18% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Users className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage companies & trainers</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/user-management">
              <Button className="w-full">Manage Users</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <ShoppingCart className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Marketplace</CardTitle>
            <CardDescription>Approve trainer profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/marketplace">
              <Button className="w-full">Manage Marketplace</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Platform metrics & insights</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Settings className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Settings</CardTitle>
            <CardDescription>Platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Shield className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Security</CardTitle>
            <CardDescription>Access control & logs</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Activity className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>System Health</CardTitle>
            <CardDescription>Monitor performance</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activity</CardTitle>
          <CardDescription>Latest system events</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">New trainer registered: Digital Skills Academy</p>
                <p className="text-sm text-muted-foreground">2 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">Review</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Company upgraded to Pro plan: TechCorp</p>
                <p className="text-sm text-muted-foreground">5 hours ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
