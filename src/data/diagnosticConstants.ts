// ── Shared constants used across Diagnostic, AI Plan Builder, and other modules ──

export const SKILL_CATEGORIES_SIMPLE = [
  'Leadership', 'Communication', 'Technical Skills', 'Project Management',
  'Sales', 'Marketing', 'Data Analysis', 'Cybersecurity', 'AI/ML',
  'Customer Service', 'Financial Management', 'Operations',
] as const;

export const SKILL_CATEGORIES_DETAILED = [
  {
    name: 'Leadership & Management',
    skills: ['Leadership', 'Team Management', 'Strategic Planning', 'Decision Making', 'Conflict Resolution',
      'Change Management', 'Delegation', 'Performance Management', 'Coaching & Mentoring'],
  },
  {
    name: 'Communication',
    skills: ['Communication', 'Public Speaking', 'Presentation Skills', 'Written Communication', 'Negotiation',
      'Active Listening', 'Cross-cultural Communication', 'Stakeholder Management'],
  },
  {
    name: 'Technical',
    skills: ['Programming', 'Data Analysis', 'Cloud Computing', 'Cybersecurity', 'AI & Machine Learning',
      'Software Development', 'Database Management', 'DevOps', 'Web Development', 'Mobile Development'],
  },
  {
    name: 'Business',
    skills: ['Project Management', 'Agile/Scrum', 'Business Analysis', 'Financial Analysis', 'Risk Management',
      'Process Improvement', 'Quality Assurance', 'Supply Chain Management', 'Operations Management'],
  },
  {
    name: 'Digital',
    skills: ['Digital Marketing', 'SEO/SEM', 'Social Media Marketing', 'Content Creation', 'E-commerce',
      'UX/UI Design', 'Data Visualization', 'CRM Systems', 'Marketing Automation'],
  },
  {
    name: 'Soft Skills',
    skills: ['Problem Solving', 'Critical Thinking', 'Creativity', 'Emotional Intelligence', 'Time Management',
      'Adaptability', 'Teamwork', 'Customer Service', 'Sales Techniques'],
  },
] as const;

export const PREDEFINED_SKILLS = SKILL_CATEGORIES_DETAILED.flatMap(cat => cat.skills);

export const BUDGET_RANGES = [
  '10,000 - 50,000 MAD',
  '50,000 - 100,000 MAD',
  '100,000 - 250,000 MAD',
  '250,000 - 500,000 MAD',
  '500,000+ MAD',
] as const;

export const TRAINING_LANGUAGES = ['Arabic', 'French', 'English', 'Spanish'] as const;

export const PRIORITIES = ['Quick ROI', 'Skill Certification', 'Team Building', 'Compliance', 'Innovation'] as const;

export const CONSTRAINTS_SIMPLE = ['Remote Only', 'Limited Budget', 'Time Constraints', 'Location Specific'] as const;

export const CONSTRAINT_CATEGORIES = [
  {
    name: 'Budget',
    constraints: ['Limited training budget', 'No external trainer budget', 'Cost-per-employee cap',
      'Fixed annual training allocation', 'No budget for travel expenses', 'Shared budget with other departments'],
  },
  {
    name: 'Time',
    constraints: ['Maximum 2 hours per week for training', 'Training only during work hours',
      'No training during peak business periods', 'Must complete within 3 months',
      'Employees cannot be absent for full-day sessions', 'Limited to after-hours training',
      'Seasonal availability restrictions', 'Project deadline conflicts'],
  },
  {
    name: 'Location',
    constraints: ['Remote employees only', 'Multiple geographic locations', 'No travel allowed',
      'Limited physical training space', 'Distributed workforce across time zones',
      'Field workers with no fixed location', 'International offices coordination'],
  },
  {
    name: 'Technology',
    constraints: ['Limited internet connectivity', 'No access to external platforms',
      'Mobile-only access for some employees', 'Legacy systems constraints',
      'No video conferencing capabilities', 'Restricted software installation',
      'BYOD (Bring Your Own Device) policy', 'No cloud storage access'],
  },
  {
    name: 'Organizational',
    constraints: ['High employee turnover', 'Multilingual workforce', 'Shift workers availability',
      'Union regulations on training time', 'Regulatory certification requirements',
      'Accessibility requirements for disabled employees', 'Hierarchical approval processes',
      'Cross-departmental coordination needed', 'Management buy-in required'],
  },
  {
    name: 'Resources',
    constraints: ['No dedicated training department', 'Limited internal subject matter experts',
      'Seasonal workforce variations', 'Part-time employee inclusion required',
      'Contractors and temporary staff inclusion', 'No dedicated L&D team',
      'Shared HR resources across locations', 'Limited administrative support'],
  },
] as const;

export const PREDEFINED_CONSTRAINTS = CONSTRAINT_CATEGORIES.flatMap(cat => cat.constraints);

export const PREDEFINED_OBJECTIVES = [
  'Improve employee productivity and efficiency',
  'Develop leadership and management skills',
  'Enhance technical expertise and capabilities',
  'Strengthen customer service excellence',
  'Build effective communication skills',
  'Foster innovation and creative thinking',
  'Ensure regulatory compliance and risk management',
  'Advance digital transformation initiatives',
  'Develop sales and negotiation skills',
  'Improve project management capabilities',
] as const;

export const DIAGNOSTIC_TEMPLATES = [
  {
    name: 'Digital Transformation',
    objectives: 'Upgrade team digital skills to modernize operations and improve efficiency through cloud, automation, and data analytics training.',
    priorities: ['Innovation', 'Quick ROI'],
  },
  {
    name: 'Leadership Development',
    objectives: 'Build strong management pipeline through leadership, strategic thinking, and team management training programs.',
    priorities: ['Team Building', 'Skill Certification'],
  },
  {
    name: 'Technical Skills Upskilling',
    objectives: 'Enhance technical capabilities in programming, cybersecurity, and AI/ML to stay competitive in the tech landscape.',
    priorities: ['Innovation', 'Skill Certification'],
  },
  {
    name: 'Customer Service Excellence',
    objectives: 'Improve customer satisfaction through communication, problem-solving, and service quality training.',
    priorities: ['Quick ROI', 'Team Building'],
  },
] as const;

export const INDUSTRIES = [
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
  'Photography', 'Art & Culture', 'Sports Organizations', 'Fitness & Wellness',
] as const;

export const COUNTRIES = [
  // Africa
  'Morocco', 'Tunisia', 'Algeria', 'Egypt', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Senegal', 'Ivory Coast', 'Cameroon', 'Ethiopia',
  // Middle East
  'UAE', 'Saudi Arabia', 'Qatar', 'Kuwait', 'Bahrain', 'Oman', 'Jordan', 'Lebanon',
  // Europe
  'France', 'Germany', 'United Kingdom', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland', 'Portugal', 'Sweden', 'Norway', 'Denmark', 'Poland', 'Austria', 'Ireland',
  // Americas
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Colombia', 'Chile',
  // Asia-Pacific
  'China', 'Japan', 'India', 'South Korea', 'Singapore', 'Malaysia', 'Indonesia', 'Thailand', 'Vietnam', 'Philippines', 'Australia', 'New Zealand',
  // Other
  'Turkey', 'Russia', 'Pakistan', 'Bangladesh',
] as const;

export const CURRENCY_MAP: Record<string, { code: string; symbol: string }> = {
  Morocco: { code: 'MAD', symbol: 'MAD' },
  Tunisia: { code: 'TND', symbol: 'TND' },
  Algeria: { code: 'DZD', symbol: 'DZD' },
  Egypt: { code: 'EGP', symbol: 'EGP' },
  'South Africa': { code: 'ZAR', symbol: 'R' },
  Nigeria: { code: 'NGN', symbol: '₦' },
  Kenya: { code: 'KES', symbol: 'KSh' },
  Ghana: { code: 'GHS', symbol: 'GH₵' },
  Senegal: { code: 'XOF', symbol: 'CFA' },
  'Ivory Coast': { code: 'XOF', symbol: 'CFA' },
  Cameroon: { code: 'XAF', symbol: 'FCFA' },
  Ethiopia: { code: 'ETB', symbol: 'ETB' },
  UAE: { code: 'AED', symbol: 'AED' },
  'Saudi Arabia': { code: 'SAR', symbol: 'SAR' },
  Qatar: { code: 'QAR', symbol: 'QAR' },
  Kuwait: { code: 'KWD', symbol: 'KWD' },
  Bahrain: { code: 'BHD', symbol: 'BHD' },
  Oman: { code: 'OMR', symbol: 'OMR' },
  Jordan: { code: 'JOD', symbol: 'JOD' },
  Lebanon: { code: 'LBP', symbol: 'LBP' },
  France: { code: 'EUR', symbol: '€' },
  Germany: { code: 'EUR', symbol: '€' },
  'United Kingdom': { code: 'GBP', symbol: '£' },
  Spain: { code: 'EUR', symbol: '€' },
  Italy: { code: 'EUR', symbol: '€' },
  Netherlands: { code: 'EUR', symbol: '€' },
  Belgium: { code: 'EUR', symbol: '€' },
  Switzerland: { code: 'CHF', symbol: 'CHF' },
  Portugal: { code: 'EUR', symbol: '€' },
  Sweden: { code: 'SEK', symbol: 'kr' },
  Norway: { code: 'NOK', symbol: 'kr' },
  Denmark: { code: 'DKK', symbol: 'kr' },
  Poland: { code: 'PLN', symbol: 'zł' },
  Austria: { code: 'EUR', symbol: '€' },
  Ireland: { code: 'EUR', symbol: '€' },
  'United States': { code: 'USD', symbol: '$' },
  Canada: { code: 'CAD', symbol: 'CA$' },
  Mexico: { code: 'MXN', symbol: 'MX$' },
  Brazil: { code: 'BRL', symbol: 'R$' },
  Argentina: { code: 'ARS', symbol: 'AR$' },
  Colombia: { code: 'COP', symbol: 'COL$' },
  Chile: { code: 'CLP', symbol: 'CLP' },
  China: { code: 'CNY', symbol: '¥' },
  Japan: { code: 'JPY', symbol: '¥' },
  India: { code: 'INR', symbol: '₹' },
  'South Korea': { code: 'KRW', symbol: '₩' },
  Singapore: { code: 'SGD', symbol: 'S$' },
  Malaysia: { code: 'MYR', symbol: 'RM' },
  Indonesia: { code: 'IDR', symbol: 'Rp' },
  Thailand: { code: 'THB', symbol: '฿' },
  Vietnam: { code: 'VND', symbol: '₫' },
  Philippines: { code: 'PHP', symbol: '₱' },
  Australia: { code: 'AUD', symbol: 'A$' },
  'New Zealand': { code: 'NZD', symbol: 'NZ$' },
  Turkey: { code: 'TRY', symbol: '₺' },
  Russia: { code: 'RUB', symbol: '₽' },
  Pakistan: { code: 'PKR', symbol: 'Rs' },
  Bangladesh: { code: 'BDT', symbol: '৳' },
};

export const COMPANY_SIZES = [
  '1-10 employees', '11-50 employees', '51-200 employees',
  '201-500 employees', '501-1000 employees', '1000+ employees',
] as const;

export const AI_MODELS = [
  { value: 'openai/gpt-6-astra', label: 'Qimatak Strategic AI', description: 'Executive analysis and structured training engineering' },
] as const;


export const PROFILE_FIELDS = [
  { key: 'name', label: 'fieldName' },
  { key: 'cnss_number', label: 'fieldCnss' },
  { key: 'rc_number', label: 'fieldRc' },
  { key: 'ice_number', label: 'fieldIce' },
  { key: 'industry', label: 'fieldIndustry' },
  { key: 'company_size', label: 'fieldSize' },
  { key: 'address', label: 'fieldAddress' },
  { key: 'city', label: 'fieldCity' },
  { key: 'contact_email', label: 'fieldContact' },
  { key: 'logo_url', label: 'fieldLogo' },
] as const;
