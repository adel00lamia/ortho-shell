import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
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
  MonitorPlay,
  FileDown,
  ArrowLeftRight,
  Calculator,
  History,
  Save,
  Share2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import type { GeneratedPlan, GeneratedPlanSnapshot, PlanRequirements, PreviousPlanFile } from '@/types/trainingPlan';
import { useCompanyFactbase } from '@/hooks/useCompanyFactbase';

import { ContextualActions } from '@/components/ContextualActions';
import { 
  exportPlanToPDF, 
  PlanGanttChart, 
  PlanROICalculator, 
  PlanComparison,
  PlanComments,
  PlanTemplateSaver,
  PlanVersionHistory,
  SWOTAnalysis,
  PESTELAnalysis,
  MarketResearchView
} from '@/components/plan';
import { CompanyResearch, CompanyResearchData } from '@/components/CompanyResearch';
import { ObjectiveAlignmentCard } from '@/components/plan/ObjectiveAlignmentCard';
import { suggestedSkillsFromObjectives } from '@/lib/objectiveAlignment';

import {
  PREDEFINED_OBJECTIVES,
  SKILL_CATEGORIES_DETAILED,
  PREDEFINED_SKILLS,
  CONSTRAINT_CATEGORIES,
  PREDEFINED_CONSTRAINTS,
  AI_MODELS,
  INDUSTRIES,
  COUNTRIES,
  CURRENCY_MAP,
  COMPANY_SIZES,
} from '@/data/diagnosticConstants';

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

export default function AIPlanBuilder() {
  const { factbase } = useCompanyFactbase();
  const [step, setStep] = useState(0); // Start with template selection
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [searchTemplate, setSearchTemplate] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [requirements, setRequirements] = useState<PlanRequirements>({
    company: '',
    country: '',
    industry: '',
    companySize: '',
    budget: 50000,
    duration: 12,
    objectives: [],
    targetSkills: [],
    constraints: [],
    aiModel: 'openai/gpt-6-astra',
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
  const [activeSnapshot, setActiveSnapshot] = useState<GeneratedPlanSnapshot | null>(null);
  const [generatedPlans, setGeneratedPlans] = useState<GeneratedPlanSnapshot[]>([]);
  const [researchData, setResearchData] = useState<CompanyResearchData | null>(null);
  const [budgetEdited, setBudgetEdited] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [planVersions, setPlanVersions] = useState<any[]>([]);
  const [planComments, setPlanComments] = useState<any[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newConstraint, setNewConstraint] = useState('');
  const [previousPlanFiles, setPreviousPlanFiles] = useState<PreviousPlanFile[]>([]);
  const [uploadingPlan, setUploadingPlan] = useState(false);

  const predefinedObjectives = PREDEFINED_OBJECTIVES as readonly string[];
  const skillCategories = SKILL_CATEGORIES_DETAILED as readonly { name: string; skills: readonly string[] }[];
  const predefinedSkills = PREDEFINED_SKILLS as readonly string[];
  const constraintCategories = CONSTRAINT_CATEGORIES as readonly { name: string; constraints: readonly string[] }[];
  const predefinedConstraints = PREDEFINED_CONSTRAINTS as readonly string[];
  
  const { user } = useAuth();
  const { language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  // Receive gap analysis data from Skills & Gaps module
  useEffect(() => {
    const state = location.state as any;
    if (state?.gapAnalysisData) {
      const gapData = state.gapAnalysisData;
      // Pre-populate target skills from top gaps
      const gapSkills = (gapData.topGaps || []).map((g: any) => g.skill).filter(Boolean);
      if (gapSkills.length > 0) {
        setRequirements(prev => ({
          ...prev,
          targetSkills: [...new Set([...prev.targetSkills, ...gapSkills])],
          context: prev.context
            ? prev.context
            : `Skills gap analysis: ${gapData.summary?.criticalGapsCount || 0} critical gaps across ${gapData.summary?.totalEmployees || 0} employees. Top gaps: ${gapSkills.slice(0, 5).join(', ')}.`,
        }));
        setStep(1); // Skip template selection, go to config
      }
      // Clear navigation state to prevent re-trigger
      window.history.replaceState({}, document.title);
    } else if (state?.diagnosticData || state?.performanceData) {
      // Legacy support for other data sources
      const data = state.diagnosticData || state.performanceData;
      if (data?.targetSkills) {
        setRequirements(prev => ({
          ...prev,
          targetSkills: [...new Set([...prev.targetSkills, ...data.targetSkills])],
        }));
      }
      setStep(1);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

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

  const aiModels = AI_MODELS as readonly { value: string; label: string; description: string }[];
  const industries = INDUSTRIES as readonly string[];
  const countries = COUNTRIES as readonly string[];
  const currencyMap = CURRENCY_MAP;
  const companySizes = COMPANY_SIZES as readonly string[];

  const getCurrency = () => (currencyMap as Record<string, { code: string; symbol: string }>)[requirements.country] || { code: 'MAD', symbol: 'MAD' };

  const deliveryMethods = [
    { id: 'online', label: 'Online Learning', description: 'Virtual classrooms and e-learning', icon: <MonitorPlay className="h-4 w-4" /> },
    { id: 'onsite', label: 'On-site Training', description: 'In-person training at your location', icon: <Building className="h-4 w-4" /> },
    { id: 'hybrid', label: 'Hybrid Learning', description: 'Combination of online and in-person', icon: <Globe className="h-4 w-4" /> },
    { id: 'mentorship', label: 'Mentorship Program', description: 'One-on-one expert guidance', icon: <Users className="h-4 w-4" /> },
    { id: 'workshops', label: 'Interactive Workshops', description: 'Hands-on learning sessions', icon: <PenTool className="h-4 w-4" /> },
    { id: 'microlearning', label: 'Micro-learning', description: 'Bite-sized learning modules', icon: <BookOpen className="h-4 w-4" /> }
  ];

  const deliveryMethodLabels: Record<string, string> = deliveryMethods.reduce(
    (acc, m) => ({ ...acc, [m.id]: m.label }),
    {} as Record<string, string>
  );


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

  // Load saved templates and company profile from database
  useEffect(() => {
    const loadInitialData = async () => {
      if (!user) return;
      try {
        // Load templates
        const { data: templates, error } = await supabase
          .from('plan_templates')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error) setSavedTemplates(templates || []);

        // Load company profile to auto-fill requirements
        const { data: profile } = await supabase
          .from('profiles')
          .select('company_id')
          .eq('id', user.id)
          .single();

        if (profile?.company_id) {
          const [companyRes, evalsRes] = await Promise.all([
            supabase.from('companies').select('name, industry, company_size, city').eq('id', profile.company_id).single(),
            supabase.from('performance_evaluations').select('areas_for_improvement, training_recommendations').eq('company_id', profile.company_id),
          ]);

          const company = companyRes.data;
          if (company) {
            // Aggregate training needs and skill gaps from evaluations
            const needsCounts: Record<string, number> = {};
            const gapCounts: Record<string, number> = {};
            (evalsRes.data || []).forEach((ev: any) => {
              (ev.training_recommendations || []).forEach((t: string) => { needsCounts[t] = (needsCounts[t] || 0) + 1; });
              (ev.areas_for_improvement || []).forEach((g: string) => { gapCounts[g] = (gapCounts[g] || 0) + 1; });
            });
            const topNeeds = Object.entries(needsCounts).sort(([,a],[,b]) => b - a).slice(0, 5).map(([s]) => s);
            const topGaps = Object.entries(gapCounts).sort(([,a],[,b]) => b - a).slice(0, 3).map(([g]) => g);

            setRequirements(prev => ({
              ...prev,
              company: company.name || prev.company,
              industry: company.industry || prev.industry,
              companySize: company.company_size || prev.companySize,
              country: prev.country || 'Morocco',
              // Auto-populate objectives from evaluation gaps
              objectives: prev.objectives.length === 0 && topGaps.length > 0
                ? topGaps.map(g => `Address skill gap: ${g}`)
                : prev.objectives,
              // Auto-populate target skills from training recommendations
              targetSkills: prev.targetSkills.length === 0 ? topNeeds : prev.targetSkills,
              context: prev.context,
            }));
          }
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };
    loadInitialData();
  }, [user]);

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

  const handleSaveTemplate = async (name: string, description: string, isPublic: boolean, configuration: any) => {
    if (!user) {
      toast({ title: 'Sign in required', description: 'Please sign in to save templates.', variant: 'destructive' });
      return;
    }
    const { data, error } = await supabase.from('plan_templates').insert({
      name,
      description,
      is_public: isPublic,
      configuration,
      user_id: user.id,
    }).select().single();
    if (error) throw error;
    setSavedTemplates(prev => [data, ...prev]);
  };

  const handleDeleteTemplate = async (templateId: string) => {
    const { error } = await supabase.from('plan_templates').delete().eq('id', templateId);
    if (error) throw error;
    setSavedTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleLoadTemplate = (template: any) => {
    const config = template.configuration;
    if (config) {
      setRequirements(prev => ({
        ...prev,
        objectives: Array.isArray(config.objectives) ? config.objectives : prev.objectives,
        targetSkills: Array.isArray(config.targetSkills) ? config.targetSkills : prev.targetSkills,
        constraints: Array.isArray(config.constraints) ? config.constraints : prev.constraints,
        duration: typeof config.duration === 'number' ? config.duration : prev.duration,
        budget: !budgetEdited && typeof config.budget === 'number' ? config.budget : prev.budget,
        context: typeof config.context === 'string' ? config.context : prev.context,
        template: typeof config.template === 'string' ? config.template : prev.template,
        pack: typeof config.pack === 'string' ? config.pack : prev.pack,
        customizations: { ...prev.customizations, ...(config.customizations || {}) }
      }));
      toast({ title: 'Template Loaded', description: `Configuration from "${template.name}" applied.` });
    }
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
        budget: budgetEdited ? prev.budget : parseInt(template.budget.split('-')[0].replace(/,/g, '')) || 50000
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
        budget: budgetEdited ? prev.budget : parseInt(pack.totalBudget.split('-')[0].replace(/,/g, '')) || 100000
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
    setIsGenerating(true);
    setProgress(10);

    try {
      // Keep the payload inside the service limits: a large company must never
      // block the generation.
      const trimmedFactbase = factbase
        ? {
            ...factbase,
            headcount: undefined,
            departments: [],
            positions: (factbase.positions ?? []).slice(0, 60).map(position => ({ ...position, headcount: 0 })),
            skills: (factbase.skills ?? []).slice(0, 60),
          }
        : undefined;

      const safeRequirements = {
        ...requirements,
        duration: Math.min(60, Math.max(1, Number(requirements.duration) || 12)),
        budget: Math.max(0, Number(requirements.budget) || 0),
        objectives: requirements.objectives.slice(0, 40),
        targetSkills: requirements.targetSkills.slice(0, 80),
        constraints: requirements.constraints.slice(0, 40),
        context: (requirements.context || '').slice(0, 15000),
        customizations: {
          ...requirements.customizations,
          // The server rejects delivery method labels longer than 50 chars.
          deliveryMethods: (requirements.customizations?.deliveryMethods || [])
            .slice(0, 10)
            .map((m) => String(m).slice(0, 50)),
        },
        // Relevant company facts only; staffing and department totals are excluded.
        companyData: trimmedFactbase,
      };

      // The generation service streams keepalive bytes while the plan is being written,
      // so the connection is never cut on long generations.
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token || env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${env.VITE_SUPABASE_URL}/functions/v1/ai-advanced-planner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          requirements: {
            ...safeRequirements,
            previousPlans: previousPlanFiles.length > 0 ? previousPlanFiles : undefined
          },
          userId: user?.id || 'anonymous',
          language: language
        }),
      });

      if (!response.ok || !response.body) {
        let serverMessage = '';
        try {
          const body = await response.text();
          serverMessage = body ? (JSON.parse(body)?.error || '') : '';
        } catch { /* keep generic message */ }
        throw new Error(serverMessage || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let data: { plan?: unknown; error?: string } | null = null;
      while (!data) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload) continue;
          try { data = JSON.parse(payload); } catch { /* ignore partial frames */ }
        }
      }

      if (data?.error) throw new Error(data.error);
      if (!data?.plan) throw new Error(language === 'fr' ? 'Réponse incomplète du service de génération.' : 'Incomplete response from the generation service.');



      const generatedAt = new Date();
      const snapshotRequirements: PlanRequirements = {
        ...safeRequirements,
        objectives: [...safeRequirements.objectives],
        targetSkills: [...safeRequirements.targetSkills],
        constraints: [...safeRequirements.constraints],
        previousPlans: previousPlanFiles.length > 0 ? previousPlanFiles.map(plan => ({ ...plan })) : undefined,
        customizations: { ...safeRequirements.customizations, deliveryMethods: [...safeRequirements.customizations.deliveryMethods] },
      };
      const snapshot: GeneratedPlanSnapshot = { plan: data.plan, requirements: snapshotRequirements, generatedAt };

      setProgress(100);
      
      // Store previous plan for comparison
      setGeneratedPlan(data.plan);
      setActiveSnapshot(snapshot);
      setGeneratedPlans(prev => [...prev, snapshot]);
      setStep(5);
      
      toast({
        title: "Plan Generated Successfully",
        description: "Your AI-powered training plan is ready for review.",
      });
    } catch (error) {
      console.error('Plan generation error:', error);
      const raw = error instanceof Error ? error.message : String(error);
      const fallback = language === 'fr'
        ? "Impossible de générer le plan. Vérifiez la durée, le budget et le modèle sélectionné, puis réessayez."
        : 'Could not generate the training plan. Check duration, budget and the selected model, then try again.';
      toast({
        title: language === 'fr' ? 'Échec de la génération' : 'Generation Failed',
        description: raw && raw !== 'Failed to fetch' ? raw : fallback,
        variant: "destructive",
      });

    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const savePlan = async () => {
    if (!generatedPlan) {
      toast({
        title: "No Plan to Save",
        description: "Please generate a plan first.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Plan Generated Successfully",
        description: "Sign in to save your training plan for later access.",
      });
      return;
    }

    try {
      let { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .maybeSingle();

      let companyId = profile?.company_id;

      // Auto-create a company if user doesn't have one
      if (!companyId) {
        const { data: newCompany, error: companyError } = await supabase
          .from('companies')
          .insert({ name: user.email?.split('@')[0] || 'My Company' })
          .select('id')
          .single();

        if (companyError) throw companyError;

        companyId = newCompany.id;

        // Link company to user profile
        await supabase
          .from('profiles')
          .update({ company_id: companyId })
          .eq('id', user.id);
      }

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
          company_id: companyId,
          ai_generated: true,
          modules: generatedPlan.modules,
          kpis: generatedPlan.kpis
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Plan Saved",
        description: "Your training plan has been saved successfully.",
      });

      navigate(`/workflow/plan/plans/${data.id}`);
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

              {/* Company Research */}
              <CompanyResearch 
                initialCompanyName={requirements.company}
                country={requirements.country}
                onResearchComplete={(data: CompanyResearchData) => {
                  setResearchData(data);
                  setRequirements(prev => ({
                    ...prev,
                    company: prev.company.trim() || data.company.name,
                    industry: prev.industry || data.company.industry,
                    companySize: prev.companySize || data.company.companySize,
                    objectives: [...new Set([...prev.objectives, ...data.recommendations.suggestedObjectives])],
                    targetSkills: [...new Set([...prev.targetSkills, ...data.recommendations.prioritySkills])],
                    duration: parseInt(data.recommendations.suggestedDuration) || prev.duration,
                    context: `${data.company.description}\n\nIndustry: ${data.industryAnalysis.overview}`,
                    customizations: {
                      ...prev.customizations,
                      deliveryMethods: data.recommendations.deliveryMethods.length > 0 
                        ? data.recommendations.deliveryMethods 
                        : prev.customizations.deliveryMethods,
                    }
                  }));
                }}
              />

              <Separator />

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
                  <label className="text-sm font-medium">Country / Market</label>
                  <Select value={requirements.country} onValueChange={(value) => 
                    setRequirements({...requirements, country: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {countries.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

               {/* Industry Benchmark Section */}
               {requirements.industry && (
                 <Card className="border-primary/20 bg-primary/5">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <BarChart3 className="h-5 w-5" />
                       {requirements.industry} Training Benchmark
                     </CardTitle>
                     <CardDescription>
                       Market insights and training trends in your sector
                     </CardDescription>
                   </CardHeader>
                   <CardContent>
                     <IndustryBenchmarkInsights industry={requirements.industry} researchData={researchData} />
                   </CardContent>
                 </Card>
               )}

               <div>
                 <label className="text-sm font-medium">Training Objectives</label>
                <div className="space-y-3 mt-2">
                  <div className="flex gap-2 w-full">
                    <Select onValueChange={(value) => {
                      if (!requirements.objectives.includes(value)) {
                        setRequirements({...requirements, objectives: [...requirements.objectives, value]});
                      }
                    }}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select predefined objective" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {predefinedObjectives.map((obj, idx) => (
                          <SelectItem key={idx} value={obj}>{obj}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newObjective}
                      onChange={(e) => setNewObjective(e.target.value)}
                      placeholder="Or add custom training objective"
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
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {requirements.objectives.map((objective, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer py-2 px-3"
                      onClick={() => removeFromList(requirements.objectives, (items) => 
                        setRequirements({...requirements, objectives: items}), objective)}>
                      {objective} ×
                    </Badge>
                  ))}
                </div>
                {requirements.objectives.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select from predefined objectives or add your own custom objectives
                  </p>
                )}
              </div>

              {/* Objectives → training choices alignment */}
              <ObjectiveAlignmentCard
                objectives={requirements.objectives}
                targetSkills={requirements.targetSkills}
                deliveryMethods={requirements.customizations.deliveryMethods}
                deliveryLabels={deliveryMethodLabels}
                onAddSkills={(skills) => setRequirements(prev => ({
                  ...prev,
                  targetSkills: [...new Set([...prev.targetSkills, ...skills])],
                }))}
                onAddDeliveryMethods={(methods) => setRequirements(prev => ({
                  ...prev,
                  customizations: {
                    ...prev.customizations,
                    deliveryMethods: [...new Set([...prev.customizations.deliveryMethods, ...methods])],
                  },
                }))}
              />


              {/* Previous Training Plan Upload */}
              <Separator />
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Previous Training Plans (Optional)
                </label>
                <p className="text-sm text-muted-foreground mt-1 mb-3">
                  Upload your last training plans (up to 3 years) so the AI can avoid redundancy and build on previous efforts.
                </p>

                {previousPlanFiles.length < 3 && (
                  <div className="border-2 border-dashed border-border/60 rounded-lg p-4 text-center hover:border-primary/40 transition-colors">
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
                      className="hidden"
                      id="previous-plan-upload"
                      disabled={uploadingPlan}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        if (file.size > 10 * 1024 * 1024) {
                          toast({ title: 'File too large', description: 'Maximum file size is 10MB.', variant: 'destructive' });
                          return;
                        }

                        setUploadingPlan(true);
                        try {
                          let content = '';
                          
                          if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
                            content = await file.text();
                          } else {
                            // For PDF/DOC files, read as text (best effort)
                            content = await file.text();
                          }

                          // Truncate to avoid exceeding AI context
                          const maxChars = 8000;
                          if (content.length > maxChars) {
                            content = content.substring(0, maxChars) + '\n\n[... content truncated for analysis ...]';
                          }

                          const currentYear = new Date().getFullYear();
                          const yearOptions = [
                            String(currentYear - 1),
                            String(currentYear - 2),
                            String(currentYear - 3)
                          ];
                          const defaultYear = yearOptions.find(y => 
                            !previousPlanFiles.some(p => p.year === y)
                          ) || String(currentYear - 1);

                          setPreviousPlanFiles(prev => [...prev, {
                            name: file.name,
                            year: defaultYear,
                            content
                          }]);

                          toast({ title: 'Plan uploaded', description: `"${file.name}" added for redundancy analysis.` });
                        } catch (err) {
                          console.error('File upload error:', err);
                          toast({ title: 'Upload failed', description: 'Could not read the file.', variant: 'destructive' });
                        } finally {
                          setUploadingPlan(false);
                          e.target.value = '';
                        }
                      }}
                    />
                    <label htmlFor="previous-plan-upload" className="cursor-pointer flex flex-col items-center gap-2">
                      {uploadingPlan ? (
                        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                      <span className="text-sm text-muted-foreground">
                        {uploadingPlan ? 'Processing...' : 'Click to upload a previous training plan'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        PDF, DOC, TXT, CSV, XLSX — Max 10MB — {3 - previousPlanFiles.length} remaining
                      </span>
                    </label>
                  </div>
                )}

                {previousPlanFiles.length > 0 && (
                  <div className="space-y-2 mt-3">
                    {previousPlanFiles.map((plan, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border">
                        <FileText className="h-4 w-4 text-primary shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{plan.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {Math.round(plan.content.length / 1000)}K chars extracted
                          </p>
                        </div>
                        <Select
                          value={plan.year}
                          onValueChange={(value) => {
                            setPreviousPlanFiles(prev => prev.map((p, i) => 
                              i === index ? { ...p, year: value } : p
                            ));
                          }}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[...Array(3)].map((_, i) => {
                              const y = String(new Date().getFullYear() - 1 - i);
                              return <SelectItem key={y} value={y}>{y}</SelectItem>;
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviousPlanFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

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
              {(() => {
                const aligned = suggestedSkillsFromObjectives(requirements.objectives, requirements.targetSkills);
                if (aligned.length === 0) return null;
                return (
                  <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="text-sm font-medium">
                        {language === 'fr' ? 'Recommandé par vos objectifs' : 'Recommended by your objectives'}
                      </p>
                      <Button type="button" size="sm" variant="outline" onClick={() => setRequirements(prev => ({
                        ...prev,
                        targetSkills: [...new Set([...prev.targetSkills, ...aligned])],
                      }))}>
                        {language === 'fr' ? 'Tout ajouter' : 'Add all'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {aligned.map(skill => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="cursor-pointer py-1.5 px-3"
                          onClick={() => setRequirements(prev => ({
                            ...prev,
                            targetSkills: [...new Set([...prev.targetSkills, skill])],
                          }))}
                        >
                          + {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="text-sm font-medium">Target Skills</label>

                <div className="space-y-2 mt-2">
                  <div>
                    <Select onValueChange={(value) => {
                      if (value && !requirements.targetSkills.includes(value)) {
                        setRequirements({...requirements, targetSkills: [...requirements.targetSkills, value]});
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from skills by category..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[400px]">
                        {skillCategories.map((category) => (
                          <SelectGroup key={category.name}>
                            <SelectLabel className="font-semibold text-primary py-2">
                              {category.name}
                            </SelectLabel>
                            {category.skills.map((skill) => (
                              <SelectItem 
                                key={skill} 
                                value={skill}
                                disabled={requirements.targetSkills.includes(skill)}
                                className="pl-6"
                              >
                                {skill}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      placeholder="Or add custom skill"
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
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {requirements.targetSkills.map((skill, index) => (
                    <Badge key={index} variant="secondary" className="cursor-pointer py-2 px-3"
                      onClick={() => removeFromList(requirements.targetSkills, (items) => 
                        setRequirements({...requirements, targetSkills: items}), skill)}>
                      {skill} ×
                    </Badge>
                  ))}
                </div>
                {requirements.targetSkills.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select from predefined skills or add your own custom skills
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium">Constraints & Limitations</label>
                <div className="space-y-2 mt-2">
                  <div>
                    <Select onValueChange={(value) => {
                      if (value && !requirements.constraints.includes(value)) {
                        setRequirements({...requirements, constraints: [...requirements.constraints, value]});
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select from common constraints..." />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {constraintCategories.map((category) => (
                          <SelectGroup key={category.name}>
                            <SelectLabel className="font-semibold text-primary">{category.name}</SelectLabel>
                            {category.constraints.map((constraint, idx) => (
                              <SelectItem key={`${category.name}-${idx}`} value={constraint}>
                                {constraint}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newConstraint}
                      onChange={(e) => setNewConstraint(e.target.value)}
                      placeholder="Or add custom constraint"
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
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {requirements.constraints.map((constraint, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer py-2 px-3"
                      onClick={() => removeFromList(requirements.constraints, (items) => 
                        setRequirements({...requirements, constraints: items}), constraint)}>
                      {constraint} ×
                    </Badge>
                  ))}
                </div>
                {requirements.constraints.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Select from common constraints or add your own specific limitations
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Duration (months)</label>
                  <Input
                    type="number"
                    value={requirements.duration}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      setRequirements({ ...requirements, duration: Number.isFinite(n) ? Math.min(60, Math.max(1, n)) : 1 });
                    }}
                    min="1"
                    max="36"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Budget ({getCurrency().code})</label>
                  <Input
                    type="number"
                    value={requirements.budget}
                    onChange={(e) => {
                      const n = parseInt(e.target.value);
                      setBudgetEdited(true);
                      setRequirements({ ...requirements, budget: Number.isFinite(n) ? Math.max(0, n) : 0 });
                    }}
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
              <>
                {/* Action Buttons */}
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      const snapshot = activeSnapshot;
                      if (!snapshot) return;
                      exportPlanToPDF(snapshot.plan, snapshot.requirements, snapshot.generatedAt);
                    }}
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                  <Button variant="outline" onClick={savePlan}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Plan
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={generatePlan}
                    disabled={isGenerating}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </Button>
                </div>
                
                {isGenerating && (
                  <div className="space-y-2">
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-center text-muted-foreground">
                      Regenerating plan with your configuration...
                    </p>
                  </div>
                )}

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="flex flex-wrap w-full h-auto gap-1 p-1">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="executive">Executive</TabsTrigger>
                    <TabsTrigger value="market">Market</TabsTrigger>
                    <TabsTrigger value="swot">SWOT</TabsTrigger>
                    <TabsTrigger value="pestel">PESTEL</TabsTrigger>
                    <TabsTrigger value="modules">Modules</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="budget">Budget</TabsTrigger>
                    <TabsTrigger value="roi">ROI</TabsTrigger>
                    <TabsTrigger value="kpis">KPIs</TabsTrigger>
                    <TabsTrigger value="risk">Risk</TabsTrigger>
                    <TabsTrigger value="innovation">Innovation</TabsTrigger>
                    <TabsTrigger value="collaborate">Collaborate</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <CardTitle className="text-2xl">{generatedPlan.title}</CardTitle>
                            <CardDescription className="mt-2">{generatedPlan.description}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-4 bg-primary/5 rounded-lg">
                            <div className="text-2xl font-bold text-primary">{generatedPlan.modules?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">Training Modules</div>
                          </div>
                          <div className="text-center p-4 bg-green-500/5 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">{requirements.duration}m</div>
                            <div className="text-sm text-muted-foreground">Duration</div>
                          </div>
                          <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                            <div className="text-2xl font-bold text-blue-600">{getCurrency().symbol} {requirements.budget.toLocaleString()}</div>
                            <div className="text-sm text-muted-foreground">Budget ({getCurrency().code})</div>
                          </div>
                          <div className="text-center p-4 bg-purple-500/5 rounded-lg">
                            <div className="text-2xl font-bold text-purple-600">{generatedPlan.kpis?.length || 0}</div>
                            <div className="text-sm text-muted-foreground">KPIs Defined</div>
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
                                <div className="text-sm">
                                  <p className="font-medium">{typeof rec === 'string' ? rec : rec.recommendation}</p>
                                  {typeof rec !== 'string' && <p className="text-muted-foreground">{rec.horizon} · {rec.rationale}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {generatedPlan.regulatory_framework && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Regulatory Framework — {generatedPlan.regulatory_framework.country || requirements.country}
                          </CardTitle>
                          <CardDescription>
                            Country-specific training regulations, funding programs, and compliance requirements
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          {generatedPlan.regulatory_framework.governing_bodies && generatedPlan.regulatory_framework.governing_bodies.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Building className="h-4 w-4 text-primary" />
                                Governing Bodies
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {generatedPlan.regulatory_framework.governing_bodies.map((body, i) => (
                                  <Badge key={i} variant="secondary">{body}</Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedPlan.regulatory_framework.key_regulations && generatedPlan.regulatory_framework.key_regulations.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Key Regulations
                              </h4>
                              <div className="space-y-1">
                                {generatedPlan.regulatory_framework.key_regulations.map((reg, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                                    <p className="text-sm">{reg}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedPlan.regulatory_framework.funding_programs && generatedPlan.regulatory_framework.funding_programs.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                Funding Programs & Incentives
                              </h4>
                              <div className="space-y-1">
                                {generatedPlan.regulatory_framework.funding_programs.map((prog, i) => (
                                  <div key={i} className="flex items-start gap-2 p-2 bg-green-500/5 rounded-md">
                                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                                    <p className="text-sm">{prog}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedPlan.regulatory_framework.mandatory_training && generatedPlan.regulatory_framework.mandatory_training.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                Mandatory Training Requirements
                              </h4>
                              <div className="space-y-1">
                                {generatedPlan.regulatory_framework.mandatory_training.map((req, i) => (
                                  <div key={i} className="flex items-start gap-2 p-2 bg-orange-500/5 rounded-md">
                                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 shrink-0" />
                                    <p className="text-sm">{req}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedPlan.regulatory_framework.certification_standards && generatedPlan.regulatory_framework.certification_standards.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <Award className="h-4 w-4 text-primary" />
                                Certification Standards
                              </h4>
                              <div className="flex flex-wrap gap-2">
                                {generatedPlan.regulatory_framework.certification_standards.map((cert, i) => (
                                  <Badge key={i} variant="outline" className="gap-1">
                                    <Award className="h-3 w-3" />
                                    {cert}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {generatedPlan.regulatory_framework.compliance_checklist && generatedPlan.regulatory_framework.compliance_checklist.length > 0 && (
                            <div>
                              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-primary" />
                                Compliance Checklist
                              </h4>
                              <div className="space-y-1">
                                {generatedPlan.regulatory_framework.compliance_checklist.map((item, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <Checkbox className="mt-0.5" />
                                    <p className="text-sm">{item}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="executive" className="space-y-4">
                    {generatedPlan.executive_summary && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5 text-primary" />
                            Executive Summary
                          </CardTitle>
                          <CardDescription>Strategic rationale, key objectives, and ROI justification</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="prose prose-sm max-w-none">
                            {generatedPlan.executive_summary.split('\n').map((paragraph, i) => (
                              <p key={i} className="text-sm leading-relaxed text-muted-foreground mb-3">{paragraph}</p>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {generatedPlan.implementation_roadmap?.phases && generatedPlan.implementation_roadmap.phases.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Rocket className="h-5 w-5 text-primary" />
                            Implementation Roadmap
                          </CardTitle>
                          <CardDescription>Phased rollout with activities and deliverables</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="relative space-y-0">
                            {generatedPlan.implementation_roadmap.phases.map((phase, index) => (
                              <div key={index} className="relative pl-8 pb-8 last:pb-0">
                                {/* Timeline connector */}
                                {index < (generatedPlan.implementation_roadmap?.phases?.length ?? 0) - 1 && (
                                  <div className="absolute left-[15px] top-8 bottom-0 w-0.5 bg-border" />
                                )}
                                {/* Phase dot */}
                                <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center">
                                  <span className="text-xs font-bold text-primary">{index + 1}</span>
                                </div>

                                <div className="bg-muted/30 rounded-lg p-4 border">
                                  <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                                    <h4 className="font-semibold text-sm">{phase.name}</h4>
                                    <Badge variant="outline" className="text-xs">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {phase.duration}
                                    </Badge>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Activities</h5>
                                      <ul className="space-y-1">
                                        {phase.activities.map((activity, ai) => (
                                          <li key={ai} className="flex items-start gap-2 text-sm">
                                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                            <span>{activity}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                    <div>
                                      <h5 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Deliverables</h5>
                                      <ul className="space-y-1">
                                        {phase.deliverables.map((deliverable, di) => (
                                          <li key={di} className="flex items-start gap-2 text-sm">
                                            <FileCheck className="h-3.5 w-3.5 text-green-600 mt-0.5 shrink-0" />
                                            <span>{deliverable}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!generatedPlan.executive_summary && !generatedPlan.implementation_roadmap?.phases?.length && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground">No executive summary or roadmap data available. Try regenerating the plan.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="market" className="space-y-4">
                    {generatedPlan.market_research ? (
                      <MarketResearchView data={generatedPlan.market_research} />
                    ) : (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">Market research data not available. Try regenerating the plan.</CardContent></Card>
                    )}
                  </TabsContent>

                  <TabsContent value="swot" className="space-y-4">
                    {generatedPlan.swot_analysis ? (
                      <SWOTAnalysis data={generatedPlan.swot_analysis} />
                    ) : (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">SWOT analysis not available. Try regenerating the plan.</CardContent></Card>
                    )}
                  </TabsContent>

                  <TabsContent value="pestel" className="space-y-4">
                    {generatedPlan.pestel_analysis ? (
                      <PESTELAnalysis data={generatedPlan.pestel_analysis} />
                    ) : (
                      <Card><CardContent className="py-8 text-center text-muted-foreground">PESTEL analysis not available. Try regenerating the plan.</CardContent></Card>
                    )}
                  </TabsContent>

                  <TabsContent value="modules" className="space-y-4">
                    <div className="grid gap-4">
                      {generatedPlan.modules?.map((module, index) => (
                        <Card key={index}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div>
                                <CardTitle className="text-lg">{module.title || `Module ${index + 1}`}</CardTitle>
                                <CardDescription>{module.description}</CardDescription>
                              </div>
                              <Badge variant="outline">{module.certification_level || 'Standard'}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Duration:</span>
                                <p className="font-medium">{module.duration || '2-4 weeks'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Type:</span>
                                <p className="font-medium">{module.type || module.delivery_method || 'Mixed'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Est. Cost:</span>
                                <p className="font-medium">{module.estimated_cost ? `${getCurrency().symbol} ${module.estimated_cost.toLocaleString()}` : 'TBD'}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Skills:</span>
                                <p className="font-medium">{module.skills_covered?.slice(0, 2).join(', ') || 'Various'}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="timeline" className="space-y-4">
                    {generatedPlan.modules && generatedPlan.modules.length > 0 && (
                      <PlanGanttChart 
                        modules={generatedPlan.modules} 
                        totalDuration={requirements.duration} 
                      />
                    )}
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
                              <div key={category} className="flex justify-between items-center p-2 hover:bg-muted/50 rounded">
                                <span className="capitalize">{category.replace(/_/g, ' ')}</span>
                                <span className="font-medium">{typeof amount === 'number' ? `${getCurrency().symbol} ${amount.toLocaleString()}` : String(amount)}</span>
                              </div>
                            ))}
                            <Separator />
                            <div className="flex justify-between items-center p-2 font-bold">
                              <span>Total</span>
                              <span className="text-primary">
                                {getCurrency().symbol} {Object.values(generatedPlan.budget_breakdown).reduce<number>((sum, val) => sum + (typeof val === 'number' ? val : 0), 0).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Budget breakdown will be generated with the plan.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="roi" className="space-y-4">
                    <PlanROICalculator 
                      budget={requirements.budget}
                      duration={requirements.duration}
                      modules={generatedPlan.modules || []}
                    />
                  </TabsContent>

                  <TabsContent value="kpis" className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Key Performance Indicators</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-3">
                          {generatedPlan.kpis?.map((kpi, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="font-medium">{(kpi as any).name || `KPI ${index + 1}`}</div>
                                  <div className="text-sm text-muted-foreground mt-1">{(kpi as any).description}</div>
                                </div>
                                <Badge variant="secondary">{(kpi as any).measurement_frequency || 'Quarterly'}</Badge>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <span className="text-muted-foreground">Target:</span>
                                  <p className="font-medium text-primary">{(kpi as any).target || 'To be defined'}</p>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">Baseline:</span>
                                  <p className="font-medium">{(kpi as any).baseline || 'To be measured'}</p>
                                </div>
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
                            {generatedPlan.risk_assessment.high_risks && (
                              <div>
                                <h4 className="font-semibold text-red-600 mb-2">High Risks</h4>
                                <div className="space-y-2">
                                  {generatedPlan.risk_assessment.high_risks.map((risk: string, idx: number) => (
                                    <div key={idx} className="p-3 border border-red-200 bg-red-50 rounded-lg text-sm">
                                      {risk}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {generatedPlan.risk_assessment.medium_risks && (
                              <div>
                                <h4 className="font-semibold text-yellow-600 mb-2">Medium Risks</h4>
                                <div className="space-y-2">
                                  {generatedPlan.risk_assessment.medium_risks.map((risk: string, idx: number) => (
                                    <div key={idx} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg text-sm">
                                      {risk}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {generatedPlan.risk_assessment.mitigation_strategies && (
                              <div>
                                <h4 className="font-semibold text-green-600 mb-2">Mitigation Strategies</h4>
                                <div className="space-y-2">
                                  {generatedPlan.risk_assessment.mitigation_strategies.map((strategy: string, idx: number) => (
                                    <div key={idx} className="p-3 border border-green-200 bg-green-50 rounded-lg text-sm">
                                      {strategy}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-muted-foreground">Risk assessment will be generated with the plan.</p>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="innovation" className="space-y-4">
                    {generatedPlan.innovation_features && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5 text-primary" />
                            Innovation Features
                          </CardTitle>
                          <CardDescription>Technology-driven enhancements powering the learning experience</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                              { key: 'ai_integration', label: 'AI Integration', icon: <Brain className="h-5 w-5" />, color: 'text-purple-600' },
                              { key: 'personalization', label: 'Personalization', icon: <Target className="h-5 w-5" />, color: 'text-blue-600' },
                              { key: 'social_learning', label: 'Social Learning', icon: <Users className="h-5 w-5" />, color: 'text-green-600' },
                              { key: 'microlearning', label: 'Microlearning', icon: <BookOpen className="h-5 w-5" />, color: 'text-orange-600' },
                              { key: 'gamification', label: 'Gamification', icon: <Gamepad2 className="h-5 w-5" />, color: 'text-pink-600' },
                              { key: 'virtual_reality', label: 'Virtual Reality', icon: <MonitorPlay className="h-5 w-5" />, color: 'text-indigo-600' },
                              { key: 'mobile_learning', label: 'Mobile Learning', icon: <Globe className="h-5 w-5" />, color: 'text-teal-600' },
                            ]
                              .filter(item => generatedPlan.innovation_features?.[item.key as keyof typeof generatedPlan.innovation_features])
                              .map(item => (
                                <div key={item.key} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                                  <div className="flex items-center gap-2">
                                    <span className={item.color}>{item.icon}</span>
                                    <h4 className="font-semibold text-sm">{item.label}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {String(generatedPlan.innovation_features?.[item.key] ?? '')}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {generatedPlan.sustainability_plan && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            Sustainability Plan
                          </CardTitle>
                          <CardDescription>Long-term strategy for continuous learning and organizational growth</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[
                              { key: 'long_term_vision', label: 'Long-Term Vision', icon: <Star className="h-5 w-5 text-amber-500" /> },
                              { key: 'continuous_improvement', label: 'Continuous Improvement', icon: <RefreshCw className="h-5 w-5 text-blue-500" /> },
                              { key: 'knowledge_retention', label: 'Knowledge Retention', icon: <BookOpen className="h-5 w-5 text-green-500" /> },
                              { key: 'culture_transformation', label: 'Culture Transformation', icon: <Users className="h-5 w-5 text-purple-500" /> },
                            ]
                              .filter(item => generatedPlan.sustainability_plan?.[item.key as keyof typeof generatedPlan.sustainability_plan])
                              .map(item => (
                                <div key={item.key} className="p-4 rounded-lg border bg-muted/30 space-y-2">
                                  <div className="flex items-center gap-2">
                                    {item.icon}
                                    <h4 className="font-semibold text-sm">{item.label}</h4>
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {String(generatedPlan.sustainability_plan?.[item.key] ?? '')}
                                  </p>
                                </div>
                              ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {!generatedPlan.innovation_features && !generatedPlan.sustainability_plan && (
                      <Card>
                        <CardContent className="py-12 text-center">
                          <Zap className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                          <p className="text-muted-foreground">No innovation or sustainability data available. Try regenerating the plan.</p>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="collaborate" className="space-y-4">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <PlanTemplateSaver
                        currentRequirements={requirements}
                        templates={savedTemplates}
                        onSaveTemplate={handleSaveTemplate}
                        onLoadTemplate={handleLoadTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                      />
                      
                      <PlanVersionHistory
                        versions={planVersions}
                        onRestoreVersion={(version) => {
                          setGeneratedPlan(version.plan_data);
                          toast({
                            title: "Version Restored",
                            description: `Restored to version ${version.version_number}`,
                          });
                        }}
                      />
                    </div>

                    <PlanComments
                      comments={planComments}
                      currentUserId={user?.id}
                      onAddComment={async (content, parentId) => {
                        const newComment = {
                          id: crypto.randomUUID(),
                          content,
                          user_id: user?.id || 'anonymous',
                          user_name: 'You',
                          parent_id: parentId,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        };
                        setPlanComments(prev => [...prev, newComment]);
                      }}
                      onDeleteComment={async (commentId) => {
                        setPlanComments(prev => prev.filter(c => c.id !== commentId));
                      }}
                    />

                    {generatedPlans.length >= 2 && (
                      <PlanComparison 
                        plans={generatedPlans}
                        onSelectPlan={(index) => {
                          const snapshot = generatedPlans[index];
                          if (!snapshot) return;
                          setGeneratedPlan(snapshot.plan);
                          setActiveSnapshot(snapshot);
                          setRequirements(snapshot.requirements);
                          toast({
                            title: "Plan Selected",
                            description: `Now viewing: ${snapshot.plan.title}`,
                          });
                        }}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </>
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

      default:
        return null;
    }
  };

  const totalSteps = 5;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 via-background to-muted/30 p-6">
      <div className="max-w-4xl mx-auto">

        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          {step > 0 && step < 5 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Step {step} of 4
              </span>
              <Progress value={(step / 4) * 100} className="w-32" />
            </div>
          )}
        </div>

        {/* Step Content */}
        {renderStep()}

        {/* Navigation Buttons */}
        {step > 0 && step < 5 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={prevStep}>
              Previous
            </Button>
            {step < 4 ? (
              <Button onClick={nextStep}>
                Next Step
              </Button>
            ) : (
              <Button onClick={generatePlan} disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Plan
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {step === 5 && (
          <div className="flex justify-between mt-8">
            <Button variant="outline" onClick={() => setStep(4)}>
              Back to Configuration
            </Button>
            <Button variant="outline" onClick={generatePlan} disabled={isGenerating}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Regenerate Plan
            </Button>
          </div>
        )}

        {/* Contextual Actions */}
        {step === 5 && requirements.industry && requirements.companySize && (
          <div className="mt-8">
            <ContextualActions currentPage="plan-builder" data={requirements} />
          </div>
        )}
      </div>
    </div>
  );
}
// Industry Benchmark Insights Component
const IndustryBenchmarkInsights = ({ industry, researchData }: { industry: string; researchData?: CompanyResearchData | null }) => {
  // If research data is available, use it; otherwise fall back to static defaults
  if (researchData) {
    const b = researchData.benchmark;
    const ia = researchData.industryAnalysis;
    const data = {
      avgTrainingHours: parseInt(b.avgTrainingHoursPerYear?.replace(/[^\d]/g, '')) || 0,
      avgBudget: b.avgTrainingBudgetPerEmployee || 'N/A',
      topTrends: ia.topTrends || [],
      commonPrograms: b.topTrainingAreas || [],
      investment: b.digitalLearningAdoption || b.industryCompletionRate || 'N/A',
      retention: b.avgROI || 'N/A',
    };

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Avg Training Hours</p>
            <p className="text-xl font-bold">{data.avgTrainingHours ? `${data.avgTrainingHours}h` : 'N/A'}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Avg Budget/Employee</p>
            <p className="text-xl font-bold">{data.avgBudget}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Completion Rate</p>
            <p className="text-xl font-bold">{b.industryCompletionRate || 'N/A'}</p>
          </div>
          <div className="p-3 bg-background rounded-lg border">
            <p className="text-xs text-muted-foreground mb-1">Avg ROI</p>
            <p className="text-xl font-bold">{b.avgROI || 'N/A'}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Training Trends
          </h4>
          <div className="flex flex-wrap gap-2">
            {data.topTrends.map((trend: string, idx: number) => (
              <Badge key={idx} variant="secondary">{trend}</Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Top Training Areas
          </h4>
          <ul className="space-y-2">
            {data.commonPrograms.map((program: string, idx: number) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {program}
              </li>
            ))}
          </ul>
        </div>

        {b.competitorTrainingFocus && b.competitorTrainingFocus.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Competitor Training Focus
            </h4>
            <div className="flex flex-wrap gap-2">
              {b.competitorTrainingFocus.map((item: string, idx: number) => (
                <Badge key={idx} variant="outline">{item}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Fallback: static hardcoded data
  const industryData: Record<string, any> = {
    Technology: {
      avgTrainingHours: 80,
      avgBudget: "$150,000",
      topTrends: ["AI & Machine Learning", "Cloud Computing", "Cybersecurity", "DevOps"],
      commonPrograms: ["Technical Certifications", "Agile Training", "Leadership Development"],
      investment: "4.5%",
      retention: "87%",
    },
    Healthcare: {
      avgTrainingHours: 120,
      avgBudget: "$200,000",
      topTrends: ["Patient Safety", "Medical Technology", "Telemedicine", "Compliance"],
      commonPrograms: ["Clinical Skills", "Patient Care", "Regulatory Compliance"],
      investment: "5.2%",
      retention: "82%",
    },
    Finance: {
      avgTrainingHours: 90,
      avgBudget: "$180,000",
      topTrends: ["FinTech", "Risk Management", "Digital Banking", "Compliance"],
      commonPrograms: ["Regulatory Training", "Financial Analysis", "Client Relations"],
      investment: "4.8%",
      retention: "85%",
    },
    Manufacturing: {
      avgTrainingHours: 70,
      avgBudget: "$120,000",
      topTrends: ["Lean Manufacturing", "Safety Protocols", "Quality Control", "Automation"],
      commonPrograms: ["Equipment Operation", "Safety Training", "Process Improvement"],
      investment: "3.5%",
      retention: "79%",
    },
    Retail: {
      avgTrainingHours: 50,
      avgBudget: "$80,000",
      topTrends: ["Customer Experience", "E-commerce", "Inventory Management", "Sales"],
      commonPrograms: ["Customer Service", "Product Knowledge", "POS Systems"],
      investment: "2.8%",
      retention: "72%",
    },
    Education: {
      avgTrainingHours: 100,
      avgBudget: "$90,000",
      topTrends: ["EdTech Integration", "Pedagogy", "Online Learning", "Assessment"],
      commonPrograms: ["Teaching Methods", "Technology Tools", "Classroom Management"],
      investment: "3.8%",
      retention: "84%",
    },
    Hospitality: {
      avgTrainingHours: 60,
      avgBudget: "$70,000",
      topTrends: ["Guest Experience", "Food Safety", "Service Excellence", "Digital Tools"],
      commonPrograms: ["Customer Service", "Food Handling", "Communication Skills"],
      investment: "3.0%",
      retention: "68%",
    },
    Construction: {
      avgTrainingHours: 80,
      avgBudget: "$110,000",
      topTrends: ["Safety Standards", "New Technologies", "Project Management", "Sustainability"],
      commonPrograms: ["Safety Protocols", "Equipment Training", "Blueprint Reading"],
      investment: "3.2%",
      retention: "75%",
    },
    Transportation: {
      avgTrainingHours: 75,
      avgBudget: "$95,000",
      topTrends: ["Safety Compliance", "Route Optimization", "Vehicle Technology", "Customer Service"],
      commonPrograms: ["Safety Training", "Route Planning", "Vehicle Maintenance"],
      investment: "3.3%",
      retention: "76%",
    },
    Energy: {
      avgTrainingHours: 95,
      avgBudget: "$140,000",
      topTrends: ["Renewable Energy", "Safety Standards", "Environmental Compliance", "Technology"],
      commonPrograms: ["Safety Protocols", "Technical Skills", "Regulatory Training"],
      investment: "4.2%",
      retention: "81%",
    },
  };

  const data = industryData[industry] || industryData.Technology;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-3 bg-background rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Avg Training Hours</p>
          <p className="text-xl font-bold">{data.avgTrainingHours}h</p>
        </div>
        <div className="p-3 bg-background rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Avg Budget</p>
          <p className="text-xl font-bold">{data.avgBudget}</p>
        </div>
        <div className="p-3 bg-background rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Training Investment</p>
          <p className="text-xl font-bold">{data.investment}</p>
        </div>
        <div className="p-3 bg-background rounded-lg border">
          <p className="text-xs text-muted-foreground mb-1">Retention Rate</p>
          <p className="text-xl font-bold">{data.retention}</p>
        </div>
      </div>

      <Separator />

      {/* Training Trends */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Top Training Trends
        </h4>
        <div className="flex flex-wrap gap-2">
          {data.topTrends.map((trend: string, idx: number) => (
            <Badge key={idx} variant="secondary">{trend}</Badge>
          ))}
        </div>
      </div>

      {/* Common Programs */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          Common Training Programs
        </h4>
        <ul className="space-y-2">
          {data.commonPrograms.map((program: string, idx: number) => (
            <li key={idx} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {program}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
