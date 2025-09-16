import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Brain, 
  Sparkles, 
  Target, 
  Clock, 
  DollarSign, 
  Users, 
  ArrowLeft, 
  RefreshCw,
  Rocket,
  Trophy,
  Shield,
  Zap,
  Globe,
  BookOpen,
  Code,
  TrendingUp,
  Heart,
  Camera,
  Edit,
  Mic,
  FileText,
  Repeat,
  Gamepad2,
  MessageSquare,
  Podcast,
  Settings,
  CheckCircle,
  FileCheck,
  Play,
  ClipboardCheck,
  Upload,
  ClipboardList,
  Award,
  CheckCircle2,
  AlertTriangle,
  Bell,
  RefreshCw as RefreshIcon,
  Mail as MailIcon,
  Calendar,
  BarChart3,
  Building,
  Briefcase,
  Star,
  Download,
  Copy,
  Video,
  PenTool,
  Headphones,
  MonitorPlay
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface TrainingTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  duration: string;
  budget: string;
  objectives: string[];
  targetSkills: string[];
  modules: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  industry: string[];
  popular: boolean;
}

interface TrainingPack {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  templates: string[];
  totalDuration: string;
  totalBudget: string;
  benefits: string[];
  bestFor: string[];
}

interface PlanRequirements {
  company: string;
  industry: string;
  companySize: string;
  budget: number;
  duration: number;
  objectives: string[];
  targetSkills: string[];
  constraints: string[];
  aiModel: string;
  context: string;
  template?: string;
  pack?: string;
  customizations: {
    deliveryMethods: string[];
    certification: boolean;
    mentorship: boolean;
    gamification: boolean;
    microlearning: boolean;
    socialLearning: boolean;
    videoProduction: boolean;
    interactiveContent: boolean;
    virtualReality: boolean;
    mobileApp: boolean;
  };
}

interface GeneratedPlan {
  title: string;
  description: string;
  modules: any[];
  timeline: string;
  budget_breakdown: any;
  kpis: any[];
  recommendations: string[];
  risk_assessment?: any;
  success_metrics?: string[];
}

export default function AIPlanBuilder() {
  const [step, setStep] = useState(0); // Start with template selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [requirements, setRequirements] = useState<PlanRequirements>({
    company: '',
    industry: '',
    companySize: '',
    budget: 50000,
    duration: 12,
    objectives: [],
    targetSkills: [],
    constraints: [],
    aiModel: 'gpt-4o',
    context: '',
    customizations: {
      deliveryMethods: ['online'],
      certification: false,
      mentorship: false,
      gamification: false,
      microlearning: false,
      socialLearning: false,
      videoProduction: false,
      interactiveContent: false,
      virtualReality: false,
      mobileApp: false
    }
  });
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedPlan | null>(null);
  const [newObjective, setNewObjective] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newConstraint, setNewConstraint] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Training Templates
  const trainingTemplates: TrainingTemplate[] = [
    {
      id: 'leadership-dev',
      name: 'Leadership Development Program',
      description: 'Comprehensive leadership training for managers and executives',
      category: 'Leadership',
      icon: <Trophy className="h-6 w-6" />,
      duration: '6-12 months',
      budget: '75,000-150,000 MAD',
      objectives: ['Develop leadership skills', 'Improve team management', 'Strategic thinking'],
      targetSkills: ['Leadership', 'Communication', 'Decision Making', 'Team Building'],
      modules: 8,
      level: 'Intermediate',
      industry: ['All'],
      popular: true
    },
    {
      id: 'tech-skills',
      name: 'Technology Skills Bootcamp',
      description: 'Intensive technical training for digital transformation',
      category: 'Technology',
      icon: <Code className="h-6 w-6" />,
      duration: '3-6 months',
      budget: '40,000-80,000 MAD',
      objectives: ['Master new technologies', 'Digital transformation', 'Innovation'],
      targetSkills: ['Programming', 'Cloud Computing', 'Data Analysis', 'Cybersecurity'],
      modules: 12,
      level: 'Intermediate',
      industry: ['Technology', 'Finance', 'Healthcare'],
      popular: true
    },
    {
      id: 'sales-excellence',
      name: 'Sales Excellence Program',
      description: 'Advanced sales training and customer relationship management',
      category: 'Sales',
      icon: <TrendingUp className="h-6 w-6" />,
      duration: '4-8 months',
      budget: '30,000-60,000 MAD',
      objectives: ['Increase sales performance', 'Customer retention', 'Negotiation skills'],
      targetSkills: ['Sales Techniques', 'CRM', 'Negotiation', 'Customer Service'],
      modules: 6,
      level: 'Intermediate',
      industry: ['Retail', 'Technology', 'Manufacturing'],
      popular: false
    },
    {
      id: 'digital-marketing',
      name: 'Digital Marketing Mastery',
      description: 'Complete digital marketing strategy and execution training',
      category: 'Marketing',
      icon: <Globe className="h-6 w-6" />,
      duration: '3-6 months',
      budget: '25,000-50,000 MAD',
      objectives: ['Digital marketing expertise', 'Brand awareness', 'ROI optimization'],
      targetSkills: ['SEO/SEM', 'Social Media', 'Content Marketing', 'Analytics'],
      modules: 10,
      level: 'Beginner',
      industry: ['Retail', 'Technology', 'Education'],
      popular: true
    },
    {
      id: 'project-management',
      name: 'Project Management Certification',
      description: 'PMP and Agile project management methodologies',
      category: 'Management',
      icon: <Briefcase className="h-6 w-6" />,
      duration: '4-6 months',
      budget: '35,000-70,000 MAD',
      objectives: ['Project management expertise', 'Team coordination', 'Risk management'],
      targetSkills: ['PMP', 'Agile', 'Scrum', 'Risk Management'],
      modules: 8,
      level: 'Intermediate',
      industry: ['All'],
      popular: false
    },
    {
      id: 'customer-service',
      name: 'Customer Service Excellence',
      description: 'World-class customer experience and service training',
      category: 'Customer Service',
      icon: <Heart className="h-6 w-6" />,
      duration: '2-4 months',
      budget: '20,000-40,000 MAD',
      objectives: ['Customer satisfaction', 'Service quality', 'Problem resolution'],
      targetSkills: ['Communication', 'Empathy', 'Problem Solving', 'CRM'],
      modules: 5,
      level: 'Beginner',
      industry: ['Retail', 'Healthcare', 'Finance'],
      popular: false
    },
    {
      id: 'compliance-training',
      name: 'Compliance & Risk Management',
      description: 'Regulatory compliance and risk assessment training',
      category: 'Compliance',
      icon: <Shield className="h-6 w-6" />,
      duration: '3-5 months',
      budget: '45,000-90,000 MAD',
      objectives: ['Regulatory compliance', 'Risk mitigation', 'Audit readiness'],
      targetSkills: ['Risk Assessment', 'Compliance', 'Audit', 'Legal Knowledge'],
      modules: 7,
      level: 'Advanced',
      industry: ['Finance', 'Healthcare', 'Manufacturing'],
      popular: false
    },
    {
      id: 'innovation-creativity',
      name: 'Innovation & Creativity Workshop',
      description: 'Foster innovation and creative thinking in teams',
      category: 'Innovation',
      icon: <Zap className="h-6 w-6" />,
      duration: '2-3 months',
      budget: '15,000-30,000 MAD',
      objectives: ['Innovation culture', 'Creative problem solving', 'Design thinking'],
      targetSkills: ['Design Thinking', 'Creativity', 'Innovation', 'Problem Solving'],
      modules: 4,
      level: 'Beginner',
      industry: ['Technology', 'Education', 'Consulting'],
      popular: true
    }
  ];

  // Training Packs
  const trainingPacks: TrainingPack[] = [
    {
      id: 'startup-growth',
      name: 'Startup Growth Pack',
      description: 'Essential training bundle for scaling startups',
      icon: <Rocket className="h-8 w-8" />,
      color: 'from-purple-500 to-pink-500',
      templates: ['leadership-dev', 'tech-skills', 'digital-marketing'],
      totalDuration: '12-18 months',
      totalBudget: '120,000-250,000 MAD',
      benefits: [
        'Comprehensive skill development',
        'Leadership pipeline creation',
        'Digital transformation readiness',
        'Market competitiveness'
      ],
      bestFor: ['Technology Startups', 'Growing Companies', 'Digital Businesses']
    },
    {
      id: 'enterprise-excellence',
      name: 'Enterprise Excellence Pack',
      description: 'Complete training solution for large organizations',
      icon: <Building className="h-8 w-8" />,
      color: 'from-blue-500 to-cyan-500',
      templates: ['leadership-dev', 'project-management', 'compliance-training', 'innovation-creativity'],
      totalDuration: '18-24 months',
      totalBudget: '200,000-400,000 MAD',
      benefits: [
        'Executive leadership development',
        'Operational excellence',
        'Risk management',
        'Innovation culture'
      ],
      bestFor: ['Large Corporations', 'Regulated Industries', 'Government Organizations']
    },
    {
      id: 'customer-focused',
      name: 'Customer-Focused Pack',
      description: 'Training to build customer-centric organizations',
      icon: <Heart className="h-8 w-8" />,
      color: 'from-green-500 to-emerald-500',
      templates: ['customer-service', 'sales-excellence', 'digital-marketing'],
      totalDuration: '8-12 months',
      totalBudget: '75,000-150,000 MAD',
      benefits: [
        'Enhanced customer experience',
        'Increased customer retention',
        'Sales performance improvement',
        'Brand loyalty development'
      ],
      bestFor: ['Retail Companies', 'Service Industries', 'B2C Businesses']
    },
    {
      id: 'digital-transformation',
      name: 'Digital Transformation Pack',
      description: 'Complete digital transformation training program',
      icon: <Globe className="h-8 w-8" />,
      color: 'from-orange-500 to-red-500',
      templates: ['tech-skills', 'digital-marketing', 'innovation-creativity', 'project-management'],
      totalDuration: '15-20 months',
      totalBudget: '150,000-300,000 MAD',
      benefits: [
        'Digital skills mastery',
        'Technology adoption',
        'Innovation mindset',
        'Digital marketing expertise'
      ],
      bestFor: ['Traditional Industries', 'Manufacturing', 'Healthcare', 'Education']
    }
  ];

  const aiModels = [
    { value: 'gpt-4o', label: 'GPT-4o (Balanced)', description: 'Best for comprehensive planning' },
    { value: 'gpt-5-2025-08-07', label: 'GPT-5 (Advanced)', description: 'Most sophisticated reasoning' },
    { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', description: 'Exceptional efficiency' },
    { value: 'perplexity', label: 'Perplexity AI', description: 'Real-time market insights' }
  ];

  // Enhanced detailed industry list
  const industries = [
    // Technology & Digital
    'Software Development', 'Information Technology', 'Cybersecurity', 'AI & Machine Learning', 
    'Cloud Computing', 'Data Analytics', 'Digital Marketing', 'E-commerce', 'Fintech',
    'Gaming & Entertainment', 'Telecommunications', 'EdTech',
    
    // Financial Services
    'Banking', 'Insurance', 'Investment Management', 'Real Estate', 'Accounting & Finance',
    'Credit & Lending', 'Wealth Management', 'Financial Planning',
    
    // Healthcare & Life Sciences
    'Hospitals & Healthcare', 'Pharmaceuticals', 'Medical Devices', 'Biotechnology',
    'Mental Health Services', 'Dental Care', 'Veterinary Services', 'Health Insurance',
    
    // Manufacturing & Industrial
    'Automotive', 'Aerospace & Defense', 'Heavy Machinery', 'Electronics Manufacturing',
    'Chemical & Petrochemical', 'Food & Beverage', 'Textiles & Apparel', 'Construction Materials',
    'Renewable Energy', 'Oil & Gas', 'Mining & Metals',
    
    // Retail & Consumer
    'Fashion & Luxury', 'Grocery & Supermarkets', 'Home & Garden', 'Sports & Recreation',
    'Beauty & Personal Care', 'Consumer Electronics', 'Furniture & Home Decor',
    
    // Services & Professional
    'Management Consulting', 'Legal Services', 'Human Resources', 'Marketing & Advertising',
    'Public Relations', 'Architecture & Design', 'Engineering Services', 'Research & Development',
    
    // Transportation & Logistics
    'Airlines', 'Shipping & Maritime', 'Trucking & Freight', 'Public Transportation',
    'Logistics & Supply Chain', 'Ride Sharing', 'Delivery Services',
    
    // Education & Training
    'K-12 Education', 'Higher Education', 'Vocational Training', 'Corporate Training',
    'Online Learning', 'Language Learning', 'Professional Certification',
    
    // Government & Public Sector
    'Federal Government', 'State & Local Government', 'Military & Defense',
    'Public Safety', 'Social Services', 'Regulatory Agencies',
    
    // Non-Profit & Social
    'Non-Profit Organizations', 'Charities', 'Religious Organizations', 'Foundations',
    'Social Impact', 'Environmental Organizations', 'International Development',
    
    // Media & Entertainment
    'Publishing', 'Broadcasting', 'Film & Television', 'Music Industry',
    'Social Media', 'Content Creation', 'News Media', 'Event Management',
    
    // Hospitality & Tourism
    'Hotels & Resorts', 'Restaurants', 'Travel & Tourism', 'Event Planning',
    'Cruise Lines', 'Theme Parks', 'Conference Centers',
    
    // Agriculture & Food
    'Farming & Agriculture', 'Food Production', 'Beverage Industry', 'Organic Products',
    'Agricultural Technology', 'Livestock', 'Fisheries & Aquaculture',
    
    // Other Industries
    'Waste Management', 'Security Services', 'Cleaning Services', 'Maintenance Services',
    'Photography', 'Art & Culture', 'Sports Organizations', 'Fitness & Wellness'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees', 
    '201-500 employees', '501-1000 employees', '1000+ employees'
  ];

  const deliveryMethods = [
    { id: 'online', label: 'Online Learning', description: 'Virtual classrooms and e-learning', icon: <MonitorPlay className="h-4 w-4" /> },
    { id: 'onsite', label: 'On-site Training', description: 'In-person training at your location', icon: <Building className="h-4 w-4" /> },
    { id: 'hybrid', label: 'Hybrid Learning', description: 'Combination of online and in-person', icon: <Globe className="h-4 w-4" /> },
    { id: 'mentorship', label: 'Mentorship Program', description: 'One-on-one expert guidance', icon: <Users className="h-4 w-4" /> },
    { id: 'workshops', label: 'Interactive Workshops', description: 'Hands-on learning sessions', icon: <PenTool className="h-4 w-4" /> },
    { id: 'microlearning', label: 'Micro-learning', description: 'Bite-sized learning modules', icon: <BookOpen className="h-4 w-4" /> }
  ];

  // Enhanced Studio Features
  const studioFeatures = [
    { id: 'videoProduction', label: 'Video Production', description: 'Professional video creation & editing', icon: <Video className="h-4 w-4" /> },
    { id: 'interactiveContent', label: 'Interactive Content', description: 'Quizzes, simulations & gamification', icon: <Gamepad2 className="h-4 w-4" /> },
    { id: 'virtualReality', label: 'VR/AR Training', description: 'Immersive learning experiences', icon: <Camera className="h-4 w-4" /> },
    { id: 'mobileApp', label: 'Mobile Learning App', description: 'Native mobile training app', icon: <MonitorPlay className="h-4 w-4" /> },
    { id: 'aiNarration', label: 'AI Voice Narration', description: 'Text-to-speech with multiple voices', icon: <Mic className="h-4 w-4" /> },
    { id: 'liveStreaming', label: 'Live Streaming', description: 'Real-time training sessions', icon: <Calendar className="h-4 w-4" /> }
  ];

  const categories = [...new Set(trainingTemplates.map(t => t.category))];

  const filteredTemplates = trainingTemplates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTemplate.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTemplate.toLowerCase());
    const matchesCategory = filterCategory === 'all' || template.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    const timer = setInterval(() => {
      if (isGenerating && progress < 90) {
        setProgress(prev => prev + Math.random() * 10);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isGenerating, progress]);

  const addToList = (list: string[], setList: (items: string[]) => void, newItem: string, setNewItem: (item: string) => void) => {
    if (newItem.trim() && !list.includes(newItem.trim())) {
      setList([...list, newItem.trim()]);
      setNewItem('');
    }
  };

  const removeFromList = (list: string[], setList: (items: string[]) => void, item: string) => {
    setList(list.filter(i => i !== item));
  };

  const applyTemplate = (templateId: string) => {
    const template = trainingTemplates.find(t => t.id === templateId);
    if (template) {
      setRequirements(prev => ({
        ...prev,
        template: templateId,
        objectives: [...template.objectives],
        targetSkills: [...template.targetSkills],
        duration: parseInt(template.duration.split('-')[0]) || 6,
        budget: parseInt(template.budget.split('-')[0].replace(/,/g, '')) || 50000
      }));
      setSelectedTemplate(templateId);
      setStep(1);
      toast({
        title: "Template Applied",
        description: `${template.name} template has been applied to your plan.`,
      });
    }
  };

  const applyPack = (packId: string) => {
    const pack = trainingPacks.find(p => p.id === packId);
    if (pack) {
      // Combine all templates in the pack
      const packTemplates = pack.templates.map(tid => trainingTemplates.find(t => t.id === tid)).filter(Boolean);
      const combinedObjectives = [...new Set(packTemplates.flatMap(t => t!.objectives))];
      const combinedSkills = [...new Set(packTemplates.flatMap(t => t!.targetSkills))];
      
      setRequirements(prev => ({
        ...prev,
        pack: packId,
        objectives: combinedObjectives,
        targetSkills: combinedSkills,
        duration: parseInt(pack.totalDuration.split('-')[0]) || 12,
        budget: parseInt(pack.totalBudget.split('-')[0].replace(/,/g, '')) || 100000
      }));
      setSelectedPack(packId);
      setStep(1);
      toast({
        title: "Training Pack Applied",
        description: `${pack.name} has been applied to your plan.`,
      });
    }
  };

  const generatePlan = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate training plans.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      const { data, error } = await supabase.functions.invoke('ai-advanced-planner', {
        body: {
          requirements,
          userId: user.id
        }
      });

      if (error) throw error;

      setProgress(100);
      setGeneratedPlan(data.plan);
      setStep(5);
      
      toast({
        title: "Plan Generated Successfully",
        description: "Your AI-powered training plan is ready for review.",
      });
    } catch (error) {
      console.error('Plan generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Could not generate the training plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan || !user) return;

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      const { data, error } = await supabase
        .from('training_plans')
        .insert({
          title: generatedPlan.title,
          description: generatedPlan.description,
          objectives: requirements.objectives,
          target_skills: requirements.targetSkills,
          duration_months: requirements.duration,
          budget: requirements.budget,
          created_by: user.id,
          company_id: profile?.company_id,
          ai_generated: true,
          modules: generatedPlan.modules,
          kpis: generatedPlan.kpis
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan Saved",
        description: "Your training plan has been saved successfully.",
      });

      navigate(`/training-plan/${data.id}`);
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: "Save Failed",
        description: "Could not save the training plan. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Hero Section */}
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Training Plan Builder
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Create comprehensive, AI-powered training programs tailored to your organization's needs. 
                Choose from expert templates or build from scratch.
              </p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="text-center">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{trainingTemplates.length}</div>
                  <div className="text-sm text-muted-foreground">Expert Templates</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">{trainingPacks.length}</div>
                  <div className="text-sm text-muted-foreground">Training Packs</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">4</div>
                  <div className="text-sm text-muted-foreground">AI Models</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="pt-4">
                  <div className="text-2xl font-bold text-primary">95%</div>
                  <div className="text-sm text-muted-foreground">Success Rate</div>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="templates" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="templates">Templates</TabsTrigger>
                <TabsTrigger value="packs">Training Packs</TabsTrigger>
                <TabsTrigger value="custom">Build Custom</TabsTrigger>
              </TabsList>

              <TabsContent value="templates" className="space-y-6">
                <div className="flex gap-4 items-center">
                  <Input
                    placeholder="Search templates..."
                    value={searchTemplate}
                    onChange={(e) => setSearchTemplate(e.target.value)}
                    className="max-w-md"
                  />
                  <Select value={filterCategory} onValueChange={setFilterCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredTemplates.map((template) => (
                    <Card key={template.id} className={`cursor-pointer transition-all hover:shadow-lg ${template.popular ? 'ring-2 ring-primary/20' : ''}`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              {template.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{template.name}</CardTitle>
                              {template.popular && (
                                <Badge className="mt-1">
                                  <Star className="h-3 w-3 mr-1" />
                                  Popular
                                </Badge>
                              )}
                            </div>
                          </div>
                          <Badge variant="outline">{template.level}</Badge>
                        </div>
                        <CardDescription className="text-sm">
                          {template.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">{template.duration}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Budget:</span>
                            <span className="font-medium">{template.budget}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Modules:</span>
                            <span className="font-medium">{template.modules} modules</span>
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm font-medium mb-2">Key Skills:</div>
                          <div className="flex flex-wrap gap-1">
                            {template.targetSkills.slice(0, 3).map((skill, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                            {template.targetSkills.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{template.targetSkills.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button 
                          onClick={() => applyTemplate(template.id)} 
                          className="w-full"
                          variant={template.popular ? "default" : "outline"}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Use Template
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="packs" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {trainingPacks.map((pack) => (
                    <Card key={pack.id} className="cursor-pointer transition-all hover:shadow-xl">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 bg-gradient-to-r ${pack.color} rounded-xl text-white`}>
                            {pack.icon}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl">{pack.name}</CardTitle>
                            <CardDescription className="mt-1">
                              {pack.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Duration:</span>
                            <div className="font-medium">{pack.totalDuration}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Investment:</span>
                            <div className="font-medium">{pack.totalBudget}</div>
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-2">Includes:</div>
                          <div className="space-y-1">
                            {pack.templates.map((templateId) => {
                              const template = trainingTemplates.find(t => t.id === templateId);
                              return template ? (
                                <div key={templateId} className="flex items-center gap-2 text-sm">
                                  <div className="w-2 h-2 bg-primary rounded-full" />
                                  {template.name}
                                </div>
                              ) : null;
                            })}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm font-medium mb-2">Benefits:</div>
                          <div className="space-y-1">
                            {pack.benefits.slice(0, 3).map((benefit, index) => (
                              <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                {benefit}
                              </div>
                            ))}
                          </div>
                        </div>

                        <Button onClick={() => applyPack(pack.id)} className="w-full">
                          <Rocket className="h-4 w-4 mr-2" />
                          Select Pack
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="custom" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      Build Custom Training Plan
                    </CardTitle>
                    <CardDescription>
                      Start from scratch and create a completely customized training program
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                        <div className="p-4 border rounded-lg">
                          <Brain className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="font-medium">AI-Powered</div>
                          <div className="text-sm text-muted-foreground">Intelligent recommendations</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="font-medium">Goal-Oriented</div>
                          <div className="text-sm text-muted-foreground">Aligned with objectives</div>
                        </div>
                        <div className="p-4 border rounded-lg">
                          <Zap className="h-8 w-8 mx-auto mb-2 text-primary" />
                          <div className="font-medium">Flexible</div>
                          <div className="text-sm text-muted-foreground">Fully customizable</div>
                        </div>
                      </div>
                      <Button onClick={() => setStep(1)} className="w-full" size="lg">
                        <Play className="h-4 w-4 mr-2" />
                        Start Building
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        );

      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Company & Objectives
              </CardTitle>
              <CardDescription>
                Tell us about your organization and training goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(selectedTemplate || selectedPack) && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-primary/10 text-primary">
                      {selectedTemplate ? 'Template Applied' : 'Pack Applied'}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {selectedTemplate && `Using: ${trainingTemplates.find(t => t.id === selectedTemplate)?.name}`}
                    {selectedPack && `Using: ${trainingPacks.find(p => p.id === selectedPack)?.name}`}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    value={requirements.company}
                    onChange={(e) => setRequirements({...requirements, company: e.target.value})}
                    placeholder="Enter company name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={requirements.industry} onValueChange={(value) => 
                    setRequirements({...requirements, industry: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Company Size</label>
                  <Select value={requirements.companySize} onValueChange={(value) => 
                    setRequirements({...requirements, companySize: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Training Objectives</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add training objective"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.objectives, (items) => 
                        setRequirements({...requirements, objectives: items}), newObjective, setNewObjective)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.objectives, (items) => 
                      setRequirements({...requirements, objectives: items}), newObjective, setNewObjective)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.objectives, (items) => 
                        setRequirements({...requirements, objectives: items}), objective)}>
                      {objective} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Additional Context</label>
                <Textarea
                  value={requirements.context}
                  onChange={(e) => setRequirements({...requirements, context: e.target.value})}
                  placeholder="Provide any additional context about your training needs, current challenges, or specific requirements..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Skills & Constraints
              </CardTitle>
              <CardDescription>
                Define target skills and any constraints or limitations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">Target Skills</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add target skill"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.targetSkills, (items) => 
                        setRequirements({...requirements, targetSkills: items}), newSkill, setNewSkill)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.targetSkills, (items) => 
                      setRequirements({...requirements, targetSkills: items}), newSkill, setNewSkill)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.targetSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.targetSkills, (items) => 
                        setRequirements({...requirements, targetSkills: items}), skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Constraints & Limitations</label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newConstraint}
                    onChange={(e) => setNewConstraint(e.target.value)}
                    placeholder="Add constraint (budget, time, location, etc.)"
                    onKeyPress={(e) => e.key === 'Enter' && 
                      addToList(requirements.constraints, (items) => 
                        setRequirements({...requirements, constraints: items}), newConstraint, setNewConstraint)}
                  />
                  <Button onClick={() => 
                    addToList(requirements.constraints, (items) => 
                      setRequirements({...requirements, constraints: items}), newConstraint, setNewConstraint)}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {requirements.constraints.map((constraint, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer"
                      onClick={() => removeFromList(requirements.constraints, (items) => 
                        setRequirements({...requirements, constraints: items}), constraint)}>
                      {constraint} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (months)</label>
                  <Input
                    type="number"
                    value={requirements.duration}
                    onChange={(e) => setRequirements({...requirements, duration: parseInt(e.target.value) || 0})}
                    min="1"
                    max="36"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Budget (MAD)</label>
                  <Input
                    type="number"
                    value={requirements.budget}
                    onChange={(e) => setRequirements({...requirements, budget: parseInt(e.target.value) || 0})}
                    min="1000"
                    step="1000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Model & Delivery
              </CardTitle>
              <CardDescription>
                Choose your AI model and customize delivery methods
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium">AI Model</label>
                <Select value={requirements.aiModel} onValueChange={(value) => 
                  setRequirements({...requirements, aiModel: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aiModels.map(model => (
                      <SelectItem key={model.value} value={model.value}>
                        <div>
                          <div className="font-medium">{model.label}</div>
                          <div className="text-xs text-muted-foreground">{model.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Delivery Methods</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deliveryMethods.map((method) => (
                    <div key={method.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={method.id}
                        checked={requirements.customizations.deliveryMethods.includes(method.id)}
                        onCheckedChange={(checked) => {
                          const methods = checked 
                            ? [...requirements.customizations.deliveryMethods, method.id]
                            : requirements.customizations.deliveryMethods.filter(m => m !== method.id);
                          setRequirements({
                            ...requirements,
                            customizations: {...requirements.customizations, deliveryMethods: methods}
                          });
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={method.id} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          {method.icon}
                          {method.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{method.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Engagement Features</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="certification"
                      checked={requirements.customizations.certification}
                      onCheckedChange={(checked) => 
                        setRequirements({
                          ...requirements,
                          customizations: {...requirements.customizations, certification: !!checked}
                        })}
                    />
                    <label htmlFor="certification" className="text-sm cursor-pointer">
                      Professional Certification
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="mentorship"
                      checked={requirements.customizations.mentorship}
                      onCheckedChange={(checked) => 
                        setRequirements({
                          ...requirements,
                          customizations: {...requirements.customizations, mentorship: !!checked}
                        })}
                    />
                    <label htmlFor="mentorship" className="text-sm cursor-pointer">
                      Expert Mentorship
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="gamification"
                      checked={requirements.customizations.gamification}
                      onCheckedChange={(checked) => 
                        setRequirements({
                          ...requirements,
                          customizations: {...requirements.customizations, gamification: !!checked}
                        })}
                    />
                    <label htmlFor="gamification" className="text-sm cursor-pointer">
                      Gamification & Badges
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="socialLearning"
                      checked={requirements.customizations.socialLearning}
                      onCheckedChange={(checked) => 
                        setRequirements({
                          ...requirements,
                          customizations: {...requirements.customizations, socialLearning: !!checked}
                        })}
                    />
                    <label htmlFor="socialLearning" className="text-sm cursor-pointer">
                      Social Learning Community
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Training Design Studio
              </CardTitle>
              <CardDescription>
                Advanced content creation and delivery options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-3 block">Studio Features</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {studioFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                      <Checkbox
                        id={feature.id}
                        checked={requirements.customizations[feature.id as keyof typeof requirements.customizations] as boolean}
                        onCheckedChange={(checked) => {
                          setRequirements({
                            ...requirements,
                            customizations: {
                              ...requirements.customizations,
                              [feature.id]: !!checked
                            }
                          });
                        }}
                      />
                      <div className="grid gap-1.5 leading-none">
                        <label htmlFor={feature.id} className="text-sm font-medium cursor-pointer flex items-center gap-2">
                          {feature.icon}
                          {feature.label}
                        </label>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI-Powered Content Generation
                </h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Automatic video script generation and storyboarding</p>
                  <p>• Interactive quiz and assessment creation</p>
                  <p>• Multi-language content localization</p>
                  <p>• Personalized learning paths based on learner progress</p>
                  <p>• Real-time content optimization using learner analytics</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Camera className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Video Studio</h4>
                  <p className="text-xs text-muted-foreground">Professional video production with AI editing</p>
                </Card>
                <Card className="p-4 text-center">
                  <Gamepad2 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Interactive Modules</h4>
                  <p className="text-xs text-muted-foreground">Gamified learning with simulations</p>
                </Card>
                <Card className="p-4 text-center">
                  <Headphones className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Audio Production</h4>
                  <p className="text-xs text-muted-foreground">AI voice narration and podcasts</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <div className="space-y-6">
            {generatedPlan ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="modules">Modules</TabsTrigger>
                  <TabsTrigger value="budget">Budget</TabsTrigger>
                  <TabsTrigger value="kpis">KPIs</TabsTrigger>
                  <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-2xl">{generatedPlan.title}</CardTitle>
                          <CardDescription className="mt-2">{generatedPlan.description}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={savePlan}>
                            <Download className="h-4 w-4 mr-2" />
                            Save Plan
                          </Button>
                          <Button variant="outline">
                            <Copy className="h-4 w-4 mr-2" />
                            Copy
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-primary/5 rounded-lg">
                          <div className="text-2xl font-bold text-primary">{generatedPlan.modules?.length || 0}</div>
                          <div className="text-sm text-muted-foreground">Training Modules</div>
                        </div>
                        <div className="text-center p-4 bg-green-500/5 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{requirements.duration}m</div>
                          <div className="text-sm text-muted-foreground">Duration</div>
                        </div>
                        <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{requirements.budget.toLocaleString()}</div>
                          <div className="text-sm text-muted-foreground">Budget (MAD)</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {generatedPlan.recommendations && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          AI Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {generatedPlan.recommendations.map((rec, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                              <p className="text-sm">{rec}</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
                  <div className="grid gap-4">
                    {generatedPlan.modules?.map((module, index) => (
                      <Card key={index}>
                        <CardHeader>
                          <CardTitle className="text-lg">{module.title || `Module ${index + 1}`}</CardTitle>
                          <CardDescription>{module.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Duration:</span>
                              <span>{module.duration || '2-4 weeks'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>Skills:</span>
                              <span>{module.skills?.join(', ') || 'Various'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="budget" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Budget Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {generatedPlan.budget_breakdown ? (
                        <div className="space-y-3">
                          {Object.entries(generatedPlan.budget_breakdown).map(([category, amount]) => (
                            <div key={category} className="flex justify-between">
                              <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                              <span className="font-medium">{String(amount)} MAD</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Budget breakdown will be generated with the plan.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="kpis" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Key Performance Indicators</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3">
                        {generatedPlan.kpis?.map((kpi, index) => (
                          <div key={index} className="p-3 border rounded-lg">
                            <div className="font-medium">{(kpi as any).name || `KPI ${index + 1}`}</div>
                            <div className="text-sm text-muted-foreground">{(kpi as any).description}</div>
                            <div className="text-sm font-medium text-primary">
                              Target: {(kpi as any).target || 'To be defined'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="risk" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {generatedPlan.risk_assessment ? (
                        <div className="space-y-4">
                          {Object.entries(generatedPlan.risk_assessment).map(([risk, details]) => (
                            <div key={risk} className="p-3 border rounded-lg">
                              <div className="font-medium capitalize">{risk.replace(/_/g, ' ')}</div>
                              <div className="text-sm text-muted-foreground">{String(details)}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">Risk assessment will be generated with the plan.</p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Generate Your Training Plan</CardTitle>
                  <CardDescription>
                    Review your configuration and generate an AI-powered training plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <Button onClick={generatePlan} disabled={isGenerating} size="lg">
                      {isGenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Generating Plan...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate AI Training Plan
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {isGenerating && (
                    <div className="space-y-2">
                      <Progress value={progress} className="w-full" />
                      <p className="text-sm text-center text-muted-foreground">
                        AI is analyzing your requirements and creating a customized training plan...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 6:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendar & Bookings
              </CardTitle>
              <CardDescription>
                Schedule sessions, manage attendees, and track completion
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <Calendar className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Session Scheduling</h4>
                  <p className="text-xs text-muted-foreground">Automated calendar integration</p>
                </Card>
                <Card className="p-4 text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Attendee Management</h4>
                  <p className="text-xs text-muted-foreground">Invites and check-in system</p>
                </Card>
                <Card className="p-4 text-center">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Completion Tracking</h4>
                  <p className="text-xs text-muted-foreground">Progress monitoring and certificates</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 7:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                KPI & ROI Dashboard
              </CardTitle>
              <CardDescription>
                xAPI-ready events, completion analytics, and business ROI calculation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4 text-center">
                  <BarChart3 className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Performance Analytics</h4>
                  <p className="text-xs text-muted-foreground">Completion rates and scores</p>
                </Card>
                <Card className="p-4 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">ROI Calculator</h4>
                  <p className="text-xs text-muted-foreground">Training investment returns</p>
                </Card>
                <Card className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-primary" />
                  <h4 className="font-medium">Business KPIs</h4>
                  <p className="text-xs text-muted-foreground">Strategic goal alignment</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      case 8:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                OFPPT/GIAC Module
              </CardTitle>
              <CardDescription>
                Step tracker for GIAC approval through submission with automated documentation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="font-medium">GIAC Approval</div>
                    <div className="text-sm text-muted-foreground">Initial qualification review</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-500" />
                  <div>
                    <div className="font-medium">Plan Approval</div>
                    <div className="text-sm text-muted-foreground">Training plan validation</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Play className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="font-medium">Execution</div>
                    <div className="text-sm text-muted-foreground">Training delivery phase</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <BarChart3 className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="font-medium">Evaluation</div>
                    <div className="text-sm text-muted-foreground">Assessment and validation</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <FileText className="h-5 w-5 text-orange-500" />
                  <div>
                    <div className="font-medium">Dossier Generation</div>
                    <div className="text-sm text-muted-foreground">Automated documentation</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Upload className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Submission</div>
                    <div className="text-sm text-muted-foreground">Final submission and tracking</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 9:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Admin & Integrations
              </CardTitle>
              <CardDescription>
                HRIS/LMS connectors, SSO setup, and security configurations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    HRIS Integration
                  </h4>
                  <p className="text-sm text-muted-foreground">Connect with HR systems for user management</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    LMS Connector
                  </h4>
                  <p className="text-sm text-muted-foreground">Integrate with existing learning platforms</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Single Sign-On
                  </h4>
                  <p className="text-sm text-muted-foreground">Secure authentication with SSO</p>
                </Card>
                <Card className="p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Security Settings
                  </h4>
                  <p className="text-sm text-muted-foreground">Advanced security configurations</p>
                </Card>
              </div>
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  const nextStep = () => {
    if (step < 9) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {step} of 9
              </span>
              <Progress value={(step / 9) * 100} className="w-32" />
            </div>
          )}
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        {step > 0 && step < 5 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep} disabled={step === 0}>
              Previous
            </Button>
            <Button onClick={nextStep} disabled={step === 9}>
              Next Step
            </Button>
          </div>
        )}

        {step >= 6 && step <= 9 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
            <Button onClick={nextStep} disabled={step === 9}>
              {step === 9 ? 'Complete Setup' : 'Next Step'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
