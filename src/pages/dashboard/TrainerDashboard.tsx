import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, BookOpen, Sparkles, FileCheck, Award, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TrainerDashboard() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Trainer Dashboard</h1>
        <p className="text-muted-foreground">Manage your training catalog and content</p>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <User className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Profile</CardTitle>
            <CardDescription>Manage your public profile</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Edit Profile</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <BookOpen className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Training Catalog</CardTitle>
            <CardDescription>Your training offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/marketplace">
              <Button className="w-full">Manage Catalog</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Sparkles className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>AI Studio</CardTitle>
            <CardDescription>Digitize training content</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/module-studio">
              <Button className="w-full">Open Studio</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <FileCheck className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Compliance Forms</CardTitle>
            <CardDescription>Evaluation forms helper</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Award className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Certificates</CardTitle>
            <CardDescription>Co-branded badges</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/certificate-generator">
              <Button className="w-full">Manage Badges</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <Calendar className="w-8 h-8 mb-2 text-primary" />
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Training sessions schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="outline">Coming Soon</Button>
          </CardContent>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Programs</CardDescription>
            <CardTitle className="text-3xl">12</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Students</CardDescription>
            <CardTitle className="text-3xl">248</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completion Rate</CardDescription>
            <CardTitle className="text-3xl">87%</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg. Rating</CardDescription>
            <CardTitle className="text-3xl">4.8</CardTitle>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
