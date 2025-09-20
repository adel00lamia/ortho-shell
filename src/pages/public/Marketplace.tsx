import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Search, 
  MapPin, 
  Star, 
  Users, 
  Clock,
  Award,
  Filter,
  ChevronRight
} from 'lucide-react';

const PublicMarketplace = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('all');

  const trainers = [
    {
      id: 1,
      name: 'Dr. Sarah Johnson',
      title: 'Digital Transformation Expert',
      location: 'Casablanca',
      rating: 4.9,
      reviews: 127,
      specialties: ['AI Strategy', 'Change Management', 'Leadership'],
      image: '/api/placeholder/100/100',
      price: 'From 2,500 MAD/day',
      experience: '12+ years',
      languages: ['French', 'English', 'Arabic'],
      verified: true
    },
    {
      id: 2,
      name: 'Ahmed Benali',
      title: 'Cybersecurity Specialist',
      location: 'Rabat',
      rating: 4.8,
      reviews: 94,
      specialties: ['Network Security', 'Risk Assessment', 'GDPR Compliance'],
      image: '/api/placeholder/100/100',
      price: 'From 2,000 MAD/day',
      experience: '8+ years',
      languages: ['Arabic', 'French', 'English'],
      verified: true
    },
    {
      id: 3,
      name: 'Fatima El Mansouri',
      title: 'HR & Soft Skills Coach',
      location: 'Marrakech',
      rating: 4.9,
      reviews: 156,
      specialties: ['Communication', 'Team Building', 'Conflict Resolution'],
      image: '/api/placeholder/100/100',
      price: 'From 1,800 MAD/day',
      experience: '10+ years',
      languages: ['Arabic', 'French'],
      verified: true
    },
    {
      id: 4,
      name: 'Youssef Alami',
      title: 'Business Intelligence Expert',
      location: 'Casablanca',
      rating: 4.7,
      reviews: 83,
      specialties: ['Data Analytics', 'Power BI', 'Business Strategy'],
      image: '/api/placeholder/100/100',
      price: 'From 2,200 MAD/day',
      experience: '6+ years',
      languages: ['French', 'English', 'Arabic'],
      verified: true
    },
    {
      id: 5,
      name: 'Dr. Amina Zahra',
      title: 'Quality Management Consultant',
      location: 'Fès',
      rating: 4.8,
      reviews: 72,
      specialties: ['ISO Standards', 'Process Improvement', 'Audit'],
      image: '/api/placeholder/100/100',
      price: 'From 2,800 MAD/day',
      experience: '15+ years',
      languages: ['Arabic', 'French', 'English'],
      verified: true
    },
    {
      id: 6,
      name: 'Hassan Oudghiri',
      title: 'Project Management Trainer',
      location: 'Tangier',
      rating: 4.6,
      reviews: 45,
      specialties: ['Agile', 'Scrum', 'PMP Certification'],
      image: '/api/placeholder/100/100',
      price: 'From 1,900 MAD/day',
      experience: '7+ years',
      languages: ['French', 'English', 'Spanish'],
      verified: false
    }
  ];

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'technology', label: 'Technology & IT' },
    { value: 'management', label: 'Management & Leadership' },
    { value: 'hr', label: 'Human Resources' },
    { value: 'finance', label: 'Finance & Accounting' },
    { value: 'marketing', label: 'Marketing & Sales' },
    { value: 'quality', label: 'Quality & Compliance' }
  ];

  const locations = [
    { value: 'all', label: 'All Locations' },
    { value: 'casablanca', label: 'Casablanca' },
    { value: 'rabat', label: 'Rabat' },
    { value: 'marrakech', label: 'Marrakech' },
    { value: 'fes', label: 'Fès' },
    { value: 'tangier', label: 'Tangier' }
  ];

  const filteredTrainers = trainers.filter(trainer => {
    const matchesSearch = trainer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trainer.specialties.some(spec => spec.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = selectedLocation === 'all' || 
                           trainer.location.toLowerCase() === selectedLocation;
    
    return matchesSearch && matchesLocation;
  });

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
            <Button variant="ghost" onClick={() => navigate('/home')}>Home</Button>
            <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
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
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 mb-6">
            Trainer Marketplace
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            Find Expert Trainers for{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Your Organization
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Connect with verified, experienced trainers across Morocco. 
            From technical skills to leadership development, find the perfect match for your training needs.
          </p>

          {/* Search & Filters */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border max-w-4xl mx-auto">
            <div className="grid md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search trainers, skills..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {locations.map(loc => (
                    <SelectItem key={loc.value} value={loc.value}>{loc.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Trainers Grid */}
      <section className="py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              {filteredTrainers.length} Expert Trainers Found
            </h2>
            <Button variant="outline" onClick={() => navigate('/contact')}>
              Can't find what you need? Contact us
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTrainers.map((trainer) => (
              <Card key={trainer.id} className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 group">
                <CardHeader className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                      <Users className="h-10 w-10 text-blue-600" />
                    </div>
                    {trainer.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Award className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                  
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                    {trainer.name}
                  </CardTitle>
                  <CardDescription className="text-blue-600 font-medium">
                    {trainer.title}
                  </CardDescription>

                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600 mt-2">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      {trainer.location}
                    </div>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1 text-yellow-500" />
                      {trainer.rating} ({trainer.reviews})
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Specialties</h4>
                    <div className="flex flex-wrap gap-2">
                      {trainer.specialties.slice(0, 3).map((specialty) => (
                        <Badge key={specialty} variant="secondary" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {trainer.experience}
                    </div>
                    <div className="font-semibold text-blue-600">
                      {trainer.price}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 mb-2">Languages:</p>
                    <p className="text-sm text-gray-700">{trainer.languages.join(', ')}</p>
                  </div>

                  <Button 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 group-hover:shadow-md transition-all"
                    onClick={() => navigate('/contact')}
                  >
                    Contact Trainer
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Transform Your Team's Skills?
          </h2>
          <p className="text-xl mb-8 text-blue-100">
            Join LMF Academy to access our full trainer network, AI-powered matching, 
            and comprehensive training management tools.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3"
              onClick={() => navigate('/auth')}
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3"
              onClick={() => navigate('/contact')}
            >
              Schedule Demo
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PublicMarketplace;