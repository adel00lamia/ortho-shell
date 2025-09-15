import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Star, ExternalLink, ShoppingCart, BookOpen, Users, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Course {
  id: string;
  title: string;
  description: string;
  trainer: string;
  rating: number;
  duration: string;
  price: number;
  category: string;
  skills: string[];
  participants: number;
  location: string;
  type: 'online' | 'onsite' | 'hybrid';
  matchScore?: number;
  matchReason?: string;
}

interface MarketplaceIntegrationProps {
  planSkills: string[];
  planBudget?: number;
  onCourseSelect?: (course: Course) => void;
}

export default function MarketplaceIntegration({ planSkills, planBudget, onCourseSelect }: MarketplaceIntegrationProps) {
  const [recommendedCourses, setRecommendedCourses] = useState<Course[]>([]);
  const [popularCourses, setPopularCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Mock courses data
  const allCourses: Course[] = [
    {
      id: '1',
      title: 'Advanced Cybersecurity Training',
      description: 'Comprehensive security training covering threat detection, incident response, and security frameworks.',
      trainer: 'Dr. Sarah Johnson',
      rating: 4.8,
      duration: '40 hours',
      price: 2500,
      category: 'cybersecurity',
      skills: ['threat-detection', 'incident-response', 'security-frameworks', 'cybersecurity'],
      participants: 25,
      location: 'Casablanca',
      type: 'hybrid'
    },
    {
      id: '2',
      title: 'Digital Marketing Mastery',
      description: 'Complete digital marketing course including SEO, social media, and analytics.',
      trainer: 'Ahmed Benali',
      rating: 4.6,
      duration: '30 hours',
      price: 1800,
      category: 'marketing',
      skills: ['seo', 'social-media', 'analytics', 'digital-marketing'],
      participants: 30,
      location: 'Online',
      type: 'online'
    },
    {
      id: '3',
      title: 'Project Management Professional',
      description: 'PMP certification preparation with real-world project scenarios.',
      trainer: 'Fatima El Mansouri',
      rating: 4.9,
      duration: '60 hours',
      price: 3200,
      category: 'management',
      skills: ['project-planning', 'risk-management', 'agile', 'management'],
      participants: 20,
      location: 'Rabat',
      type: 'onsite'
    },
    {
      id: '4',
      title: 'Data Analytics & Visualization',
      description: 'Learn advanced data analysis techniques and visualization tools.',
      trainer: 'Youssef Alami',
      rating: 4.7,
      duration: '45 hours',
      price: 2800,
      category: 'analytics',
      skills: ['data-analysis', 'visualization', 'python', 'tableau'],
      participants: 15,
      location: 'Online',
      type: 'online'
    },
    {
      id: '5',
      title: 'Leadership Excellence Program',
      description: 'Develop exceptional leadership skills for senior management.',
      trainer: 'Dr. Amina Zahra',
      rating: 4.9,
      duration: '35 hours',
      price: 4500,
      category: 'leadership',
      skills: ['leadership', 'team-management', 'strategic-thinking', 'communication'],
      participants: 12,
      location: 'Casablanca',
      type: 'hybrid'
    },
    {
      id: '6',
      title: 'Cloud Architecture Fundamentals',
      description: 'Master cloud architecture principles and best practices.',
      trainer: 'Hassan Oudghiri',
      rating: 4.5,
      duration: '50 hours',
      price: 3500,
      category: 'technology',
      skills: ['cloud-computing', 'architecture', 'aws', 'azure'],
      participants: 18,
      location: 'Online',
      type: 'online'
    }
  ];

  useEffect(() => {
    findRecommendedCourses();
    setPopularCourses(allCourses.slice(0, 3));
  }, [planSkills, planBudget]);

  const findRecommendedCourses = async () => {
    setIsLoading(true);
    try {
      // AI-powered matching
      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: {
          skills: planSkills,
          budget: planBudget || 50000,
          duration: '40 hours',
          type: 'any'
        }
      });

      if (error) {
        console.error('AI matching error:', error);
        // Fallback to simple matching
        const matched = allCourses
          .filter(course => {
            const skillsMatch = planSkills.some(skill => 
              course.skills.some(courseSkill => 
                courseSkill.toLowerCase().includes(skill.toLowerCase()) ||
                skill.toLowerCase().includes(courseSkill.toLowerCase())
              )
            );
            const budgetMatch = !planBudget || course.price <= planBudget * 0.3; // 30% of budget per course
            return skillsMatch || budgetMatch;
          })
          .slice(0, 4)
          .map(course => ({
            ...course,
            matchScore: 0.8,
            matchReason: "Matched based on skills and budget criteria"
          }));
        
        setRecommendedCourses(matched);
      } else {
        setRecommendedCourses(data.matches || []);
      }
    } catch (error) {
      console.error('Error finding recommended courses:', error);
      // Fallback matching
      const matched = allCourses.slice(0, 4).map(course => ({
        ...course,
        matchScore: 0.7,
        matchReason: "Popular course recommendation"
      }));
      setRecommendedCourses(matched);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseAction = (course: Course, action: 'view' | 'add') => {
    if (action === 'add' && onCourseSelect) {
      onCourseSelect(course);
      toast({
        title: "Course Added",
        description: `${course.title} has been added to your training plan.`,
      });
    } else {
      toast({
        title: "Course Details",
        description: `View full details for ${course.title}`,
      });
    }
  };

  const CourseCard = ({ course, showMatch = false }: { course: Course; showMatch?: boolean }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
          {showMatch && course.matchScore && (
            <Badge variant="secondary" className="ml-2">
              {Math.round(course.matchScore * 100)}% match
            </Badge>
          )}
        </div>
        <CardDescription className="line-clamp-2">{course.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          <span>{course.rating}</span>
          <span>•</span>
          <span>{course.trainer}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4 text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span>{course.participants}</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {course.type}
            </Badge>
          </div>
          <div className="text-lg font-bold">{course.price.toLocaleString()} MAD</div>
        </div>

        <div className="flex flex-wrap gap-1">
          {course.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {course.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{course.skills.length - 3}
            </Badge>
          )}
        </div>

        {showMatch && course.matchReason && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {course.matchReason}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleCourseAction(course, 'view')}
            className="flex-1"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Details
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleCourseAction(course, 'add')}
            className="flex-1"
          >
            <ShoppingCart className="w-3 h-3 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">External Training Opportunities</h3>
          <p className="text-sm text-muted-foreground">
            Complement your training plan with external courses
          </p>
        </div>
        <Button variant="outline" size="sm">
          <BookOpen className="w-4 h-4 mr-2" />
          Browse All Courses
        </Button>
      </div>

      <Tabs defaultValue="recommended" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">
            <TrendingUp className="w-4 h-4 mr-2" />
            AI Recommended
          </TabsTrigger>
          <TabsTrigger value="popular">
            <Star className="w-4 h-4 mr-2" />
            Popular
          </TabsTrigger>
          <TabsTrigger value="budget">
            Budget Friendly
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-64 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <>
              {recommendedCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recommendedCourses.map(course => (
                    <CourseCard key={course.id} course={course} showMatch />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      No matching courses found. Try browsing our popular courses instead.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="popular" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allCourses
              .filter(course => course.price <= (planBudget || 50000) * 0.2)
              .slice(0, 6)
              .map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}