import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  Mail, 
  Phone, 
  MapPin, 
  Clock,
  Building,
  Users,
  MessageSquare,
  Send,
  CheckCircle
} from 'lucide-react';

const Contact = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    role: '',
    message: '',
    requestType: 'demo'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    setTimeout(() => {
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you within 24 hours.",
      });
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        company: '',
        role: '',
        message: '',
        requestType: 'demo'
      });
    }, 1500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactOptions = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Demo Request",
      description: "See LMF Academy in action with a personalized demo",
      value: "demo"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Sales Inquiry",
      description: "Learn about pricing and enterprise solutions",
      value: "sales"
    },
    {
      icon: <Building className="h-6 w-6" />,
      title: "Partnership",
      description: "Explore partnership opportunities",
      value: "partnership"
    }
  ];

  const features = [
    "30-day free trial with full access",
    "Personalized onboarding support",
    "Integration with existing systems",
    "Dedicated customer success manager",
    "OFPPT & GIAC compliance guidance",
    "24/7 technical support"
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
            <Button variant="ghost" onClick={() => navigate('/about')}>About</Button>
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
            Contact Us
          </Badge>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Let's Transform Your{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Training Together
            </span>
          </h1>
          <p className="text-xl text-gray-600 leading-relaxed mb-8">
            Ready to revolutionize your corporate training? Get in touch with our team to 
            explore how LMF Academy can meet your organization's unique needs.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-6 max-w-6xl pb-20">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900">Get Started Today</CardTitle>
                <CardDescription className="text-lg text-gray-600">
                  Fill out the form below and we'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Request Type */}
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">What can we help you with?</Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      {contactOptions.map((option) => (
                        <Card 
                          key={option.value}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                            formData.requestType === option.value 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => handleInputChange('requestType', option.value)}
                        >
                          <CardContent className="p-4 text-center">
                            <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                              formData.requestType === option.value 
                                ? 'bg-blue-100 text-blue-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {option.icon}
                            </div>
                            <h3 className="font-semibold text-sm text-gray-900 mb-1">{option.title}</h3>
                            <p className="text-xs text-gray-600">{option.description}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Personal Information */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter your full name"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company">Company Name</Label>
                      <Input
                        id="company"
                        placeholder="Enter your company name"
                        value={formData.company}
                        onChange={(e) => handleInputChange('company', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Your Role</Label>
                      <Select value={formData.role} onValueChange={(value) => handleInputChange('role', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="hr-director">HR Director</SelectItem>
                          <SelectItem value="training-manager">Training Manager</SelectItem>
                          <SelectItem value="l&d-manager">L&D Manager</SelectItem>
                          <SelectItem value="ceo">CEO/Executive</SelectItem>
                          <SelectItem value="trainer">Independent Trainer</SelectItem>
                          <SelectItem value="consultant">Training Consultant</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your training needs, challenges, or questions..."
                      rows={4}
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Contact Information */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Email</p>
                    <p className="text-gray-600">contact@lmfacademy.ma</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Phone className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Phone</p>
                    <p className="text-gray-600">+212 5 22 XX XX XX</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Address</p>
                    <p className="text-gray-600">Casablanca, Morocco</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Business Hours</p>
                    <p className="text-gray-600">Mon-Fri: 9:00 AM - 6:00 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900">What to Expect</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-0 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold mb-2">Ready to Get Started?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Join hundreds of organizations already transforming their training programs.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full bg-white text-blue-700 hover:bg-gray-100"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;