import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, Target, BarChart3, Zap, CheckCircle, ArrowRight, Star, Play, Award, TrendingUp, Globe, BookOpen
} from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const l = t.landing;

  const user = { email: 'demo@trainpro.com', user_metadata: { first_name: 'Demo User' } };

  const features = [
    { icon: <Brain className="h-6 w-6" />, title: l.aiPoweredPlanning, description: l.aiPlanningDesc, link: "/ai-plan-builder" },
    { icon: <Target className="h-6 w-6" />, title: l.skillsDiagnostics, description: l.skillsDiagnosticsDesc, link: "/diagnostic" },
    { icon: <BookOpen className="h-6 w-6" />, title: l.contentStudio, description: l.contentStudioDesc, link: "/module-studio" },
    { icon: <Globe className="h-6 w-6" />, title: l.externalMarketplace, description: l.marketplaceDesc, link: "/marketplace" },
    { icon: <Award className="h-6 w-6" />, title: l.certsBadges, description: l.certsDesc, link: "/certificate-generator" },
    { icon: <BarChart3 className="h-6 w-6" />, title: l.analyticsROI, description: l.analyticsDesc, link: "/analytics" },
  ];

  const stats = [
    { value: "95%", label: l.completionRate, icon: <TrendingUp className="h-5 w-5" /> },
    { value: "300%", label: l.averageROI, icon: <BarChart3 className="h-5 w-5" /> },
    { value: "40h", label: l.timeSaved, icon: <Zap className="h-5 w-5" /> },
    { value: "99%", label: l.userSatisfaction, icon: <Star className="h-5 w-5" /> },
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
            <span className="text-xl font-bold text-gray-900">{l.platformName}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {l.welcome}, {user.user_metadata?.first_name || user.email}
            </span>
            <Button variant="ghost" onClick={() => navigate('/dashboard')}>
              {t.nav.dashboard}
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  {l.aiBadge}
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  {l.heroTitle}{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {l.heroTitleHighlight}
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">{l.heroSubtitle}</p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3" onClick={() => navigate('/ai-plan-builder')}>
                  {l.startBuildingPlans}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 px-8 py-3" onClick={() => navigate('/diagnostic')}>
                  <Play className="mr-2 h-5 w-5" />
                  {l.takeDiagnostic}
                </Button>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center mb-2 text-blue-600">{stat.icon}</div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-4">{l.platformOverview}</h3>
                  <div className="space-y-3">
                    {[l.aiGeneratedPlans, l.complianceTracking, l.digitalCertificates, l.realtimeAnalytics].map((item) => (
                      <div key={item} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="secondary" className="mt-6 bg-white text-blue-700 hover:bg-gray-100" onClick={() => navigate('/marketplace')}>
                    {l.exploreFeatures}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{l.everythingYouNeed}</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">{l.everythingDesc}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-gradient-to-br from-gray-50 to-white hover:from-blue-50 hover:to-indigo-50 cursor-pointer" onClick={() => navigate(feature.link)}>
                <CardHeader>
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all">
                    <div className="text-blue-600">{feature.icon}</div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-blue-600 font-medium group-hover:translate-x-1 transition-transform">
                    {t.common.learnMore}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">{l.trustedBy}</h3>
            <p className="text-gray-600">{l.trustedByDesc}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center opacity-60">
            {['Microsoft', 'Google', 'Amazon', 'IBM', 'Oracle', 'Salesforce'].map((company) => (
              <div key={company} className="text-center">
                <div className="text-2xl font-bold text-gray-400">{company}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">{l.ctaTitle}</h2>
          <p className="text-xl mb-8 text-blue-100">{l.ctaSubtitle}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3" onClick={() => navigate('/ai-plan-builder')}>
              {l.startFreeTrial}
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 px-8 py-3" onClick={() => navigate('/pricing')}>
              {l.viewPricing}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
