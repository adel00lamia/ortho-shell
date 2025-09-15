import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  Target, 
  TrendingUp, 
  Award, 
  Clock, 
  BookOpen,
  Brain,
  CheckCircle2,
  ArrowRight,
  Play,
  Zap
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  link: string;
  gradient: string;
  stats?: { label: string; value: string };
}

const FeatureCard = ({ icon, title, description, link, gradient, stats }: FeatureCardProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Card 
      className="group relative overflow-hidden border-0 bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 cursor-pointer transform hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
      
      <CardHeader className="relative z-10 pb-4">
        <div className={`w-14 h-14 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-4 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors mb-2">
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>
      
      {stats && (
        <CardContent className="pt-0 pb-4">
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="text-2xl font-bold text-gray-900">{stats.value}</div>
            <div className="text-sm text-gray-600">{stats.label}</div>
          </div>
        </CardContent>
      )}
      
      <CardContent className="relative z-10 pt-0">
        <Link to={link}>
          <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
            Explore feature
            <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </Link>
      </CardContent>
    </Card>
  );
};

interface StatsCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  change?: string;
  trend?: 'up' | 'down';
}

const StatsCard = ({ icon, value, label, change, trend }: StatsCardProps) => (
  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-shadow">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="text-blue-600">{icon}</div>
        {change && (
          <Badge variant={trend === 'up' ? 'default' : 'secondary'} className="text-xs">
            <TrendingUp className="w-3 h-3 mr-1" />
            {change}
          </Badge>
        )}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </CardContent>
  </Card>
);

interface ProgressCardProps {
  title: string;
  subtitle: string;
  progress: number;
  icon: React.ReactNode;
  color: string;
}

const ProgressCard = ({ title, subtitle, progress, icon, color }: ProgressCardProps) => (
  <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
    <CardContent className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        <div className={`text-${color}-600`}>{icon}</div>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
    </CardContent>
  </Card>
);

export default function DashboardComponents() {
  const featureCards = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "AI Training Plans",
      description: "Generate comprehensive training strategies with GPT-5, Claude, and Perplexity AI",
      link: "/ai-plan-builder",
      gradient: "from-blue-500 to-cyan-500",
      stats: { label: "Plans Generated", value: "1,247" }
    },
    {
      icon: <Target className="h-6 w-6" />,
      title: "Skills Diagnostics",
      description: "Identify gaps and create personalized development paths",
      link: "/diagnostic",
      gradient: "from-purple-500 to-pink-500",
      stats: { label: "Assessments Completed", value: "3,891" }
    },
    {
      icon: <BookOpen className="h-6 w-6" />,
      title: "Content Studio",
      description: "Create engaging modules with AI-powered content generation",
      link: "/module-studio",
      gradient: "from-green-500 to-emerald-500",
      stats: { label: "Modules Created", value: "5,623" }
    },
    {
      icon: <Award className="h-6 w-6" />,
      title: "Certificates",
      description: "Issue verifiable digital credentials and micro-badges",
      link: "/certificate-generator",
      gradient: "from-orange-500 to-red-500",
      stats: { label: "Certificates Issued", value: "12,456" }
    }
  ];

  const statsCards = [
    {
      icon: <Users className="h-6 w-6" />,
      value: "2,847",
      label: "Active Learners",
      change: "+12%",
      trend: "up" as const
    },
    {
      icon: <TrendingUp className="h-6 w-6" />,
      value: "94.3%",
      label: "Completion Rate",
      change: "+5.2%",
      trend: "up" as const
    },
    {
      icon: <Clock className="h-6 w-6" />,
      value: "127h",
      label: "Learning Hours",
      change: "+28%",
      trend: "up" as const
    },
    {
      icon: <Zap className="h-6 w-6" />,
      value: "89%",
      label: "Satisfaction Score",
      change: "+3%",
      trend: "up" as const
    }
  ];

  const progressCards = [
    {
      title: "Cybersecurity Training",
      subtitle: "Advanced threat detection course",
      progress: 78,
      icon: <Brain className="h-5 w-5" />,
      color: "blue"
    },
    {
      title: "Leadership Development",
      subtitle: "Management skills program",
      progress: 92,
      icon: <Target className="h-5 w-5" />,
      color: "green"
    },
    {
      title: "Digital Marketing",
      subtitle: "SEO and analytics certification",
      progress: 65,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "purple"
    }
  ];

  return (
    <div className="space-y-12 p-6">
      {/* Hero Stats */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Training Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsCards.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>
      </section>

      {/* Feature Cards */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {featureCards.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </section>

      {/* Progress Cards */}
      <section>
        <h2 className="text-3xl font-bold text-gray-900 mb-8">Active Training Programs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progressCards.map((progress, index) => (
            <ProgressCard key={index} {...progress} />
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section>
        <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0">
          <CardContent className="p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-4">Ready to Create Your Next Training Plan?</h3>
                <p className="text-blue-100 mb-6">
                  Use our AI-powered platform to generate comprehensive training strategies in minutes.
                </p>
                <div className="flex gap-4">
                  <Button variant="secondary" size="lg" className="bg-white text-blue-700 hover:bg-gray-100">
                    <Play className="mr-2 h-5 w-5" />
                    Start Planning
                  </Button>
                  <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                    View Demo
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">95%</div>
                  <div className="text-sm text-blue-100">Success Rate</div>
                </div>
                <div className="bg-white/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold">&lt; 5min</div>
                  <div className="text-sm text-blue-100">Setup Time</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}