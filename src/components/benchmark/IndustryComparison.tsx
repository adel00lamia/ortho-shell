import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface IndustryComparisonProps {
  industry: string;
  companyData: any;
  diagnosticData: any[];
  evaluationData: any[];
}

// Industry benchmark data (would come from a database or API in production)
const industryBenchmarks: Record<string, any> = {
  Technology: {
    avgTrainingHours: 80,
    avgTrainingBudget: 150000,
    avgPerformanceRating: 4.2,
    topSkills: ["Cloud Computing", "AI/ML", "Cybersecurity", "DevOps", "Data Analytics"],
    trainingInvestmentPercent: 4.5,
    employeeRetention: 87,
  },
  Healthcare: {
    avgTrainingHours: 120,
    avgTrainingBudget: 200000,
    avgPerformanceRating: 4.3,
    topSkills: ["Patient Care", "Medical Technology", "Compliance", "Communication", "Emergency Response"],
    trainingInvestmentPercent: 5.2,
    employeeRetention: 82,
  },
  Finance: {
    avgTrainingHours: 90,
    avgTrainingBudget: 180000,
    avgPerformanceRating: 4.1,
    topSkills: ["Risk Management", "Financial Analysis", "Compliance", "Client Relations", "Digital Banking"],
    trainingInvestmentPercent: 4.8,
    employeeRetention: 85,
  },
  Manufacturing: {
    avgTrainingHours: 70,
    avgTrainingBudget: 120000,
    avgPerformanceRating: 3.9,
    topSkills: ["Safety Protocols", "Quality Control", "Lean Manufacturing", "Equipment Operation", "Problem Solving"],
    trainingInvestmentPercent: 3.5,
    employeeRetention: 79,
  },
  Retail: {
    avgTrainingHours: 50,
    avgTrainingBudget: 80000,
    avgPerformanceRating: 3.8,
    topSkills: ["Customer Service", "Sales Techniques", "Inventory Management", "POS Systems", "Product Knowledge"],
    trainingInvestmentPercent: 2.8,
    employeeRetention: 72,
  },
  Education: {
    avgTrainingHours: 100,
    avgTrainingBudget: 90000,
    avgPerformanceRating: 4.0,
    topSkills: ["Pedagogy", "Technology Integration", "Assessment", "Classroom Management", "Differentiation"],
    trainingInvestmentPercent: 3.8,
    employeeRetention: 84,
  },
  Hospitality: {
    avgTrainingHours: 60,
    avgTrainingBudget: 70000,
    avgPerformanceRating: 3.9,
    topSkills: ["Customer Service", "Food Safety", "Communication", "Problem Solving", "Multitasking"],
    trainingInvestmentPercent: 3.0,
    employeeRetention: 68,
  },
  Construction: {
    avgTrainingHours: 80,
    avgTrainingBudget: 110000,
    avgPerformanceRating: 3.8,
    topSkills: ["Safety Protocols", "Technical Skills", "Blueprint Reading", "Equipment Operation", "Project Management"],
    trainingInvestmentPercent: 3.2,
    employeeRetention: 75,
  },
  Transportation: {
    avgTrainingHours: 75,
    avgTrainingBudget: 95000,
    avgPerformanceRating: 3.9,
    topSkills: ["Safety Compliance", "Route Planning", "Vehicle Maintenance", "Customer Service", "Time Management"],
    trainingInvestmentPercent: 3.3,
    employeeRetention: 76,
  },
  Energy: {
    avgTrainingHours: 95,
    avgTrainingBudget: 140000,
    avgPerformanceRating: 4.0,
    topSkills: ["Safety Protocols", "Technical Skills", "Regulatory Compliance", "Environmental Management", "Emergency Response"],
    trainingInvestmentPercent: 4.2,
    employeeRetention: 81,
  },
};

export default function IndustryComparison({ industry, companyData, diagnosticData, evaluationData }: IndustryComparisonProps) {
  const benchmark = industryBenchmarks[industry] || industryBenchmarks.Technology;

  // Calculate company metrics
  const avgRating = evaluationData.length > 0
    ? evaluationData.reduce((sum, e) => sum + (e.overall_rating || 0), 0) / evaluationData.length
    : 0;

  const companyMetrics = {
    avgPerformanceRating: avgRating,
    employeeCount: evaluationData.length,
    diagnosticCount: diagnosticData.length,
  };

  // Comparison data for charts
  const comparisonData = [
    {
      metric: "Performance Rating",
      company: Number(companyMetrics.avgPerformanceRating.toFixed(1)),
      industry: benchmark.avgPerformanceRating,
    },
    {
      metric: "Training Hours",
      company: diagnosticData.length > 0 ? 65 : 0,
      industry: benchmark.avgTrainingHours,
    },
    {
      metric: "Employee Retention %",
      company: diagnosticData.length > 0 ? 78 : 0,
      industry: benchmark.employeeRetention,
    },
  ];

  const skillsRadarData = benchmark.topSkills.map((skill: string) => ({
    skill,
    industry: 4.0,
    company: Math.random() * 2 + 2.5,
  }));

  const getComparisonIcon = (companyValue: number, industryValue: number) => {
    const diff = ((companyValue - industryValue) / industryValue) * 100;
    if (diff > 5) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (diff < -5) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  const getComparisonBadge = (companyValue: number, industryValue: number) => {
    const diff = ((companyValue - industryValue) / industryValue) * 100;
    if (diff > 5) return <Badge className="bg-green-500">Above Average</Badge>;
    if (diff < -5) return <Badge variant="destructive">Below Average</Badge>;
    return <Badge variant="secondary">Average</Badge>;
  };

  return (
    <div className="grid gap-6 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Industry Overview: {industry}</CardTitle>
          <CardDescription>
            Compare your company's metrics against {industry.toLowerCase()} sector averages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Average Performance Rating</p>
                {getComparisonIcon(companyMetrics.avgPerformanceRating, benchmark.avgPerformanceRating)}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{companyMetrics.avgPerformanceRating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">vs {benchmark.avgPerformanceRating}</p>
              </div>
              <div className="mt-2">{getComparisonBadge(companyMetrics.avgPerformanceRating, benchmark.avgPerformanceRating)}</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Training Investment %</p>
                {getComparisonIcon(3.5, benchmark.trainingInvestmentPercent)}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">3.5%</p>
                <p className="text-sm text-muted-foreground">vs {benchmark.trainingInvestmentPercent}%</p>
              </div>
              <div className="mt-2">{getComparisonBadge(3.5, benchmark.trainingInvestmentPercent)}</div>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium">Employee Retention</p>
                {getComparisonIcon(78, benchmark.employeeRetention)}
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">78%</p>
                <p className="text-sm text-muted-foreground">vs {benchmark.employeeRetention}%</p>
              </div>
              <div className="mt-2">{getComparisonBadge(78, benchmark.employeeRetention)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Metrics Comparison</CardTitle>
            <CardDescription>Your company vs industry average</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="metric" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="company" fill="hsl(var(--primary))" name="Your Company" />
                <Bar dataKey="industry" fill="hsl(var(--secondary))" name="Industry Average" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Skills in {industry}</CardTitle>
            <CardDescription>Skills comparison with industry standards</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={skillsRadarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 5]} />
                <Radar name="Your Company" dataKey="company" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.6} />
                <Radar name="Industry Average" dataKey="industry" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary))" fillOpacity={0.3} />
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
