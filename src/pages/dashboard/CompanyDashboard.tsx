import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Target, Award, BarChart3, FileCheck, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CompanyDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Company Dashboard</h1>
        <p className="text-muted-foreground">Manage your training programs and track ROI</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Brain className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>AI Diagnostic</CardTitle>
            <CardDescription>Identify skills gaps with AI</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/diagnostic">
              <Button className="w-full">Start Diagnostic</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Target className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Training Plans</CardTitle>
            <CardDescription>Create & manage plans</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/ai-plan-builder">
              <Button className="w-full">Build Plan</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileCheck className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Compliance</CardTitle>
            <CardDescription>OFPPT/GIAC tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BarChart3 className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>KPI Dashboard</CardTitle>
            <CardDescription>Track training metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/analytics">
              <Button className="w-full">View Analytics</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Award className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Manage certificates & badges</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/certificate-generator">
              <Button className="w-full">View Certificates</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <TrendingUp className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>ROI Tracking</CardTitle>
            <CardDescription>Measure training impact</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest training activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Leadership Development Plan</p>
                <p className="text-sm text-muted-foreground">Created 2 days ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <div>
                <p className="font-medium">Technical Skills Diagnostic</p>
                <p className="text-sm text-muted-foreground">Completed 5 days ago</p>
              </div>
              <Button variant="ghost" size="sm">View</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
