import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Brain, 
  Target, 
  Award, 
  Users, 
  Globe,
  ArrowRight,
  CheckCircle,
  Heart,
  Lightbulb,
  Rocket
} from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: <Lightbulb className="h-8 w-8" />,
      title: "Innovation",
      description: "We leverage cutting-edge AI technology to revolutionize corporate training and make learning more effective and accessible."
    },
    {
      icon: <Heart className="h-8 w-8" />,
      title: "Impact",
      description: "We're committed to creating measurable impact through training that drives real business results and personal growth."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Connection",
      description: "We build bridges between companies and expert trainers, fostering meaningful learning relationships."
    },
    {
      icon: <Rocket className="h-8 w-8" />,
      title: "Excellence",
      description: "We maintain the highest standards in compliance, quality, and user experience to exceed expectations."
    }
  ];

  const team = [
    {
      name: "Dr. Laila Medouri",
      role: "Founder & CEO",
      bio: "Former L&D Director with 15+ years experience in corporate training and AI applications in education.",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Mohamed Fakir",
      role: "CTO",
      bio: "AI/ML expert with extensive background in educational technology and platform development.",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Fatima Benali",
      role: "Head of Training Operations",
      bio: "OFPPT certification expert and training compliance specialist with 12+ years experience.",
      image: "/api/placeholder/150/150"
    },
    {
      name: "Ahmed Zouani",
      role: "Head of Product",
      bio: "UX/Product leader focused on creating intuitive, effective learning experiences.",
      image: "/api/placeholder/150/150"
    }
  ];

  const milestones = [
    { year: "2023", title: "Company Founded", description: "LMF Academy launched with vision to transform corporate training" },
    { year: "2023", title: "AI Integration", description: "Integrated advanced AI models for automated training plan generation" },
    { year: "2024", title: "Compliance Ready", description: "Achieved OFPPT and GIAC compliance certification capabilities" },
    { year: "2024", title: "Marketplace Launch", description: "Connected 500+ expert trainers with companies across Morocco" },
    { year: "2024", title: "500+ Organizations", description: "Reached milestone of serving 500+ organizations nationwide" }
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
            <Button variant="ghost" onClick={() => navigate('/features')}>Features</Button>
            <Button variant="ghost" onClick={() => navigate('/marketplace')}>Marketplace</Button>
            <Button variant="ghost" onClick={() => navigate('/pricing')}>Pricing</Button>
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
            About LMF Academy
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Transforming Corporate Training Through{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Innovation & Connection
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            We're on a mission to revolutionize how organizations approach training and development. 
            By connecting companies with expert trainers and leveraging AI technology, we make 
            effective training accessible, compliant, and measurable.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12">
            <Card className="border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To democratize access to high-quality corporate training by creating a seamless 
                  platform that connects organizations with expert trainers, while leveraging 
                  AI to reduce administrative burden and ensure compliance with industry standards.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl text-gray-900">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 leading-relaxed">
                  To become the leading platform for corporate training across Morocco and beyond, 
                  where every organization has access to world-class training resources and every 
                  trainer can reach their full potential through technology.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">The principles that guide everything we do</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="border-0 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                    <div className="text-blue-600">
                      {value.icon}
                    </div>
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {value.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 leading-relaxed">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6 max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
            <p className="text-xl text-gray-600">The experts driving innovation in corporate training</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {team.map((member, index) => (
              <Card key={index} className="border-0 bg-gradient-to-br from-gray-50 to-white hover:shadow-lg transition-all duration-300 text-center">
                <CardHeader>
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Users className="h-12 w-12 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {member.name}
                  </CardTitle>
                  <p className="text-blue-600 font-medium">{member.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm leading-relaxed">{member.bio}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Journey */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6 max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Our Journey</h2>
            <p className="text-xl text-gray-600">Key milestones in our mission to transform training</p>
          </div>

          <div className="space-y-8">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start space-x-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                    {milestone.year}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{milestone.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-6 max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Join Our Mission</h2>
          <p className="text-xl mb-8 text-blue-100">
            Whether you're a company looking for training solutions or a trainer wanting to expand your reach, 
            we'd love to have you as part of the LMF Academy community.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="bg-white text-blue-700 hover:bg-gray-100 px-8 py-3"
              onClick={() => navigate('/auth')}
            >
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="border-white text-white hover:bg-white/10 px-8 py-3"
              onClick={() => navigate('/contact')}
            >
              Contact Us
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;