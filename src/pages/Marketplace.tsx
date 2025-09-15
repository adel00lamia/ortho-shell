import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Star, Clock, Users, MapPin, Search, Filter } from 'lucide-react';
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
}

interface AIMatchRequest {
  skills: string[];
  budget: number;
  duration: string;
  type: string;
}

export default function Marketplace() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [aiMatches, setAiMatches] = useState<Course[]>([]);
  const { toast } = useToast();

  // Mock data for demonstration
  const mockCourses: Course[] = [
    {
      id: '1',
      title: 'Advanced Cybersecurity Training',
      description: 'Comprehensive security training covering threat detection, incident response, and security frameworks.',
      trainer: 'Dr. Sarah Johnson',
      rating: 4.8,
      duration: '40 hours',
      price: 2500,
      category: 'cybersecurity',
      skills: ['threat-detection', 'incident-response', 'security-frameworks'],
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
      skills: ['seo', 'social-media', 'analytics'],
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
      skills: ['project-planning', 'risk-management', 'agile'],
      participants: 20,
      location: 'Rabat',
      type: 'onsite'
    }
  ];

  useEffect(() => {
    setCourses(mockCourses);
    setFilteredCourses(mockCourses);
  }, []);

  useEffect(() => {
    let filtered = courses;

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.trainer.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(course => course.category === categoryFilter);
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(course => course.type === typeFilter);
    }

    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      filtered = filtered.filter(course => {
        if (max) {
          return course.price >= min && course.price <= max;
        }
        return course.price >= min;
      });
    }

    setFilteredCourses(filtered);
  }, [searchTerm, categoryFilter, typeFilter, priceRange, courses]);

  const handleAIMatch = async () => {
    setIsLoading(true);
    try {
      const matchRequest: AIMatchRequest = {
        skills: ['cybersecurity', 'management'],
        budget: 3000,
        duration: '40 hours',
        type: 'hybrid'
      };

      const { data, error } = await supabase.functions.invoke('ai-match', {
        body: matchRequest
      });

      if (error) throw error;

      setAiMatches(data.matches || []);
      toast({
        title: "AI Matches Found",
        description: `Found ${data.matches?.length || 0} courses matching your criteria.`,
      });
    } catch (error) {
      console.error('AI matching error:', error);
      toast({
        title: "AI Matching Failed",
        description: "Could not find AI matches. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Training Marketplace</h1>
        <p className="text-xl text-muted-foreground">
          Discover expert trainers and courses tailored to your organization's needs
        </p>
      </div>

      {/* AI Match Section */}
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            AI-Powered Course Matching
          </CardTitle>
          <CardDescription>
            Get personalized course recommendations based on your training needs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAIMatch} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? 'Finding Matches...' : 'Find Best Matches'}
          </Button>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="management">Management</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Delivery Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="onsite">On-site</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priceRange} onValueChange={setPriceRange}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="0-1000">0 - 1,000 MAD</SelectItem>
                <SelectItem value="1000-2500">1,000 - 2,500 MAD</SelectItem>
                <SelectItem value="2500-5000">2,500 - 5,000 MAD</SelectItem>
                <SelectItem value="5000">5,000+ MAD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* AI Matches Results */}
      {aiMatches.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">AI Recommended Matches</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aiMatches.map((course) => (
              <CourseCard key={`ai-${course.id}`} course={course} isAIMatch />
            ))}
          </div>
        </div>
      )}

      {/* Course Catalog */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Available Courses ({filteredCourses.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      </div>
    </div>
  );
}

function CourseCard({ course, isAIMatch = false }: { course: Course; isAIMatch?: boolean }) {
  return (
    <Card className={`h-full ${isAIMatch ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{course.title}</CardTitle>
          {isAIMatch && <Badge variant="secondary">AI Match</Badge>}
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

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.participants}</span>
          </div>
          <div className="flex items-center gap-1">
            <MapPin className="h-4 w-4" />
            <span>{course.location}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1">
          {course.skills.slice(0, 3).map((skill) => (
            <Badge key={skill} variant="outline" className="text-xs">
              {skill}
            </Badge>
          ))}
          {course.skills.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{course.skills.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-2xl font-bold">{course.price.toLocaleString()} MAD</div>
          <Button>View Details</Button>
        </div>
      </CardContent>
    </Card>
  );
}