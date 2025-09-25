import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Target, 
  Users, 
  Building, 
  DollarSign, 
  Clock, 
  ArrowRight, 
  CheckCircle2,
  Sparkles,
  BarChart3,
  Shield,
  Globe
} from 'lucide-react';

export default function SkillsWaveStyleHome() {
  const navigate = useNavigate();
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Training Plans",
      description: "Generate comprehensive, personalized training strategies with advanced AI models including GPT-5, Claude Sonnet 4, and Perplexity.",
      color: "from-blue-500 to-cyan-500",
      link: "/ai-plan-builder"
    },
    {
      icon: <Target className="h-8 w-8" />,
      title: "Skills Assessment & Diagnostics",
      description: "Identify skill gaps and training needs with intelligent diagnostic tools and competency mapping.",
      color: "from-purple-500 to-pink-500",
      link: "/diagnostic"
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      title: "Content Creation Studio",
      description: "Build engaging training modules with AI-generated content, interactive elements, and assessment tools.",
      color: "from-green-500 to-emerald-500",
      link: "/module-studio"
    },
    {
      icon: <Globe className="h-8 w-8" />,
      title: "External Course Marketplace",
      description: "Access thousands of expert-led courses with AI-powered matching to your specific training needs.",
      color: "from-orange-500 to-red-500",
      link: "/marketplace"
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Compliance & Certification",
      description: "Ensure OFPPT and GIAC compliance with automated tracking and digital certificate generation.",
      color: "from-indigo-500 to-purple-500",
      link: "/certificate-generator"
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Analytics & ROI Tracking",
      description: "Measure training effectiveness with comprehensive analytics, KPI tracking, and ROI calculations.",
      color: "from-teal-500 to-cyan-500",
      link: "#"
    }
  ];

  const stats = [
    { value: "500+", label: "Organizations Trust Us", icon: <Building className="h-6 w-6" /> },
    { value: "95%", label: "Training Completion Rate", icon: <Target className="h-6 w-6" /> },
    { value: "300%", label: "Average ROI Increase", icon: <DollarSign className="h-6 w-6" /> },
    { value: "40h", label: "Admin Time Saved", icon: <Clock className="h-6 w-6" /> }
  ];

  const benefits = [
    "Reduce administrative workload by 80%",
    "Boost learner engagement and retention",
    "Deliver personalized learning paths",
    "Track progress with real-time insights",
    "Ensure regulatory compliance",
    "Generate verifiable certificates"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section - Inspired by SkillsWave */}
      <section className="relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-80 h-80 bg-pink-200/30 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>

        <div className="container mx-auto px-6 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 px-4 py-2 text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2" />
                  AI-Powered Training Platform
                </Badge>
                
                <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight">
                  Drive Skills-Based Learning With an{' '}
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    AI-Powered Platform
                  </span>
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed">
                  Reduce admin work, boost engagement, and deliver skills that stick. 
                  Connect learning to business needs with real-time insights—all without the admin burden.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-4 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => navigate('/ai-plan-builder')}
                >
                  Start Building Plans
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-4 text-lg rounded-full"
                  onClick={() => navigate('/diagnostic')}
                >
                  Try for Free
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
                {stats.map((stat, index) => (
                  <Card key={index} className="bg-white/60 backdrop-blur-sm border-0 shadow-lg">
                    <CardContent className="p-4 text-center">
                      <div className="flex items-center justify-center mb-2 text-blue-600">
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Right Side - Dashboard Preview */}
            <div className="relative">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-gray-900">Training Dashboard</h3>
                    <Badge className="bg-green-100 text-green-800">Live</Badge>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">AI Plan Generation</span>
                        <span className="text-gray-900 font-medium">95%</span>
                      </div>
                      <Progress value={95} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Module Completion</span>
                        <span className="text-gray-900 font-medium">87%</span>
                      </div>
                      <Progress value={87} className="h-2" />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Learner Engagement</span>
                        <span className="text-gray-900 font-medium">92%</span>
                      </div>
                      <Progress value={92} className="h-2" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">247</div>
                      <div className="text-sm text-gray-600">Active Learners</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">18</div>
                      <div className="text-sm text-gray-600">Active Plans</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need for Modern Training
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              From AI-powered planning to compliance tracking, our platform covers every aspect 
              of corporate training and workforce development.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group relative overflow-hidden hover:shadow-2xl transition-all duration-500 border-0 bg-white/80 backdrop-blur-sm cursor-pointer transform hover:-translate-y-2"
                onClick={() => navigate(feature.link)}
                onMouseEnter={() => setHoveredFeature(index)}
                onMouseLeave={() => setHoveredFeature(null)}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                
                <CardHeader className="relative z-10">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mb-6 text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-2 transition-transform duration-300">
                    Explore feature
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-white space-y-8">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                Transform Your Training Programs Today
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Join hundreds of organizations using TrainPro Academy to deliver 
                personalized, effective training that drives real business results.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle2 className="h-6 w-6 text-green-400 flex-shrink-0" />
                    <span className="text-lg text-blue-100">{benefit}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-4 pt-4">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3 rounded-full shadow-lg"
                  onClick={() => navigate('/ai-plan-builder')}
                >
                  Start Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 px-8 py-3 rounded-full"
                  onClick={() => navigate('/pricing')}
                >
                  View Pricing
                </Button>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-6">Why Choose TrainPro Academy?</h3>
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">AI-First Approach</h4>
                      <p className="text-blue-100 text-sm">Advanced AI models generate personalized training plans in minutes, not weeks.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Compliance Ready</h4>
                      <p className="text-blue-100 text-sm">Built-in OFPPT and GIAC compliance tracking ensures regulatory requirements are met.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Measurable Results</h4>
                      <p className="text-blue-100 text-sm">Real-time analytics and ROI tracking prove training effectiveness and business impact.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}