import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Award, 
  Users, 
  BarChart3,
  Globe,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Shield,
  BookOpen,
  Palette,
  TrendingUp,
  FileCheck,
  Building,
  Settings
} from 'lucide-react';

const Features = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('companies');

  const companyFeatures = [
    {
      icon: <Brain className="h-8 w-8" />,
      title: "AI-Powered Diagnostic",
      description: "Advanced skills assessment and automatic training plan generation using GPT-5, Claude Sonnet 4, and Perplexity AI models.",
      benefits: ["Instant skills gap analysis", "Personalized learning paths", "Industry-specific recommendations", "Budget optimization"]
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Compliance Tracking",
      description: "Automated OFPPT and GIAC compliance monitoring with document management and checklist tracking.",
      benefits: ["OFPPT dossier management", "GIAC compliance tracking", "Automated reporting", "Audit-ready documentation"]
    },
    {
      icon: <TrendingUp className="h-8 w-8" />,
      title: "KPI & ROI Dashboard",
      description: "Comprehensive analytics to measure training effectiveness, engagement metrics, and return on investment.",
      benefits: ["Real-time KPI tracking", "ROI calculations", "Engagement analytics", "Performance insights"]
    },
    {
      icon: <Award className="h-8 w-8" />,
      title: "Certificate Manager",
      description: "Issue verifiable digital certificates and badges with blockchain verification and custom branding.",
      benefits: ["Digital badge creation", "Blockchain verification", "Custom branding", "Automatic issuance"]
    }
  ];

  const trainerFeatures = [
    {
      icon: <Users className="h-8 w-8" />,
      title: "Profile Manager",
      description: "Create and manage your public-facing trainer profile with portfolio showcase and client testimonials.",
      benefits: ["Professional portfolio", "Client testimonials", "Certification display", "SEO optimization"]
    },
    {
      icon: <BookOpen className="h-8 w-8" />,
      title: "Training Catalog",
      description: "Manage your complete training offerings with pricing, schedules, and capacity management.",
      benefits: ["Course management", "Pricing control", "Schedule planning", "Capacity tracking"]
    },
    {
      icon: <Palette className="h-8 w-8" />,
      title: "AI Studio",
      description: "Digitize your training content, convert slides to interactive modules, and create engaging materials.",
      benefits: ["Content digitization", "Interactive modules", "Slide conversion", "AI enhancement"]
    },
    {
      icon: <FileCheck className="h-8 w-8" />,
      title: "Evaluation Forms",
      description: "AI-powered evaluation and assessment form creation with automatic scoring and feedback generation.",
      benefits: ["Smart form creation", "Auto-scoring", "Instant feedback", "Progress tracking"]
    }
  ];

  const platformFeatures = [
    {
      icon: <Globe className="h-8 w-8" />,
      title: "Marketplace Integration",
      description: "Seamless connection between companies and trainers with smart matching algorithms.",
      benefits: ["Smart matching", "Verified providers", "Secure transactions", "Quality assurance"]
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Advanced Analytics",
      description: "Comprehensive platform analytics for all stakeholders with customizable dashboards.",
      benefits: ["Custom dashboards", "Performance metrics", "Usage analytics", "Predictive insights"]
    },
    {
      icon: <Settings className="h-8 w-8" />,
      title: "Admin Controls",
      description: "Powerful administration tools for platform management, user oversight, and quality control.",
      benefits: ["User management", "Quality control", "Platform oversight", "Compliance monitoring"]
    }
  ];

  const benefits = [
    "95% reduction in administrative workload",
    "300% average ROI increase on training investments",
    "40+ hours saved per month on training planning",
    "100% compliance with OFPPT and GIAC standards",
    "Real-time progress tracking and analytics",
    "Automated certificate and badge generation"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">LMF Academy</span>
          </div>
          <nav className="hidden md:flex space-x-8">
            <Button variant="ghost" onClick={() => navigate('/')}>Home</Button>
            <Button variant="ghost" onClick={() => navigate('/marketplace')}>Marketplace</Button>
            <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
            <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
            <Button variant="ghost" onClick={() => navigate('/contact')}>Contact</Button>
          </nav>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Platform Features
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Everything You Need for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Modern Training Success
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Discover how LMF Academy's comprehensive feature set transforms corporate training 
            for companies, trainers, and organizations of all sizes.
          </p>
        </div>
      </section>

      {/* Features Tabs */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-12">
              <TabsTrigger value="companies" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                For Companies
              </TabsTrigger>
              <TabsTrigger value="trainers" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                For Trainers
              </TabsTrigger>
              <TabsTrigger value="platform" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Platform Tools
              </TabsTrigger>
            </TabsList>

            <TabsContent value="companies" className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Empower Your Organization</h2>
                <p className="text-lg text-gray-600">Advanced tools for companies to plan, manage, and measure training success</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {companyFeatures.map((feature, index) => (
                  <Card key={index} className="border-0 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                        <div className="text-blue-600">
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="trainers" className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Grow Your Training Business</h2>
                <p className="text-lg text-gray-600">Professional tools to showcase expertise and deliver exceptional training experiences</p>
              </div>
              <div className="grid md:grid-cols-2 gap-8">
                {trainerFeatures.map((feature, index) => (
                  <Card key={index} className="border-0 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
                        <div className="text-purple-600">
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="platform" className="space-y-8">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Platform Excellence</h2>
                <p className="text-lg text-gray-600">Core platform features that make everything work seamlessly together</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {platformFeatures.map((feature, index) => (
                  <Card key={index} className="border-0 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                        <div className="text-green-600">
                          {feature.icon}
                        </div>
                      </div>
                      <CardTitle className="text-xl font-semibold text-gray-900">
                        {feature.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {feature.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-center text-sm text-gray-600">
                            <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Measurable Results from Day One
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                LMF Academy delivers immediate value through automation, intelligent matching, 
                and comprehensive analytics that prove training ROI.
              </p>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500 flex-shrink-0" />
                    <span className="text-lg text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Training Efficiency</h3>
                    <Badge className="bg-green-100 text-green-800">+95%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full" style={{ width: '95%' }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">ROI Improvement</h3>
                    <Badge className="bg-blue-100 text-blue-800">+300%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Compliance Rate</h3>
                    <Badge className="bg-purple-100 text-purple-800">100%</Badge>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{ width: '100%' }}></div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Experience the Future of Corporate Training
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join hundreds of organizations and trainers already transforming their approach to professional development.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3"
              onClick={() => navigate('/auth')}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3"
              onClick={() => navigate('/contact')}
            >
              Book Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Features;