import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, TrendingUp, Users, Target, BookOpen, Award } from "lucide-react";

interface BestPracticesProps {
  industry: string;
}

const industryBestPractices: Record<string, any> = {
  Technology: {
    practices: [
      {
        title: "Continuous Learning Culture",
        description: "Top tech companies allocate 10-15% of work time for learning and development",
        icon: BookOpen,
        impact: "High",
      },
      {
        title: "Mentorship Programs",
        description: "Pair junior developers with senior mentors for knowledge transfer",
        icon: Users,
        impact: "High",
      },
      {
        title: "Certification Support",
        description: "Cover costs for AWS, Azure, or Google Cloud certifications",
        icon: Award,
        impact: "Medium",
      },
      {
        title: "Hackathons & Innovation Days",
        description: "Quarterly innovation events to foster creativity and skill development",
        icon: Target,
        impact: "Medium",
      },
    ],
    kpis: [
      { name: "Training ROI", target: "300%", description: "Revenue increase per training dollar" },
      { name: "Skill Gap Reduction", target: "40%", description: "Year-over-year improvement" },
      { name: "Employee Satisfaction", target: "85%", description: "Post-training survey scores" },
      { name: "Internal Mobility", target: "25%", description: "Promotions from within" },
    ],
  },
  Healthcare: {
    practices: [
      {
        title: "Mandatory Clinical Updates",
        description: "Quarterly training on latest medical procedures and technologies",
        icon: BookOpen,
        impact: "High",
      },
      {
        title: "Simulation Training",
        description: "Use of medical simulators for hands-on practice",
        icon: Target,
        impact: "High",
      },
      {
        title: "Patient Safety Programs",
        description: "Regular training on patient safety protocols and best practices",
        icon: CheckCircle2,
        impact: "High",
      },
      {
        title: "Cross-Department Collaboration",
        description: "Joint training sessions between departments",
        icon: Users,
        impact: "Medium",
      },
    ],
    kpis: [
      { name: "Patient Satisfaction", target: "90%", description: "Post-care survey scores" },
      { name: "Incident Reduction", target: "50%", description: "Year-over-year decrease" },
      { name: "Compliance Rate", target: "98%", description: "Regulatory compliance" },
      { name: "Staff Retention", target: "85%", description: "Annual retention rate" },
    ],
  },
  Finance: {
    practices: [
      {
        title: "Regulatory Compliance Training",
        description: "Bi-annual updates on financial regulations and compliance",
        icon: CheckCircle2,
        impact: "High",
      },
      {
        title: "Risk Management Workshops",
        description: "Advanced training on risk assessment and mitigation",
        icon: Target,
        impact: "High",
      },
      {
        title: "Digital Banking Skills",
        description: "Training on fintech tools and digital transformation",
        icon: TrendingUp,
        impact: "High",
      },
      {
        title: "Soft Skills Development",
        description: "Client relationship and communication training",
        icon: Users,
        impact: "Medium",
      },
    ],
    kpis: [
      { name: "Compliance Score", target: "99%", description: "Audit performance" },
      { name: "Customer Retention", target: "92%", description: "Annual client retention" },
      { name: "Productivity Increase", target: "35%", description: "Post-training efficiency" },
      { name: "Error Reduction", target: "45%", description: "Operational errors" },
    ],
  },
  // Default practices for other industries
  default: {
    practices: [
      {
        title: "Structured Onboarding",
        description: "Comprehensive 90-day onboarding program for new hires",
        icon: BookOpen,
        impact: "High",
      },
      {
        title: "Skills Assessment",
        description: "Regular evaluation of employee competencies and gaps",
        icon: Target,
        impact: "High",
      },
      {
        title: "Leadership Development",
        description: "Training programs for emerging leaders and managers",
        icon: Users,
        impact: "Medium",
      },
      {
        title: "Performance Reviews",
        description: "Quarterly check-ins with development planning",
        icon: TrendingUp,
        impact: "Medium",
      },
    ],
    kpis: [
      { name: "Employee Engagement", target: "80%", description: "Engagement survey scores" },
      { name: "Skill Proficiency", target: "75%", description: "Competency assessments" },
      { name: "Training Completion", target: "90%", description: "Program completion rate" },
      { name: "Retention Rate", target: "85%", description: "Annual employee retention" },
    ],
  },
};

export default function BestPractices({ industry }: BestPracticesProps) {
  const data = industryBestPractices[industry] || industryBestPractices.default;

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Best Practices in {industry}</CardTitle>
          <CardDescription>
            Proven strategies from top-performing companies in your industry
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.practices.map((practice: any, index: number) => {
              const Icon = practice.icon;
              return (
                <div key={index} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{practice.title}</h3>
                        <Badge variant={practice.impact === "High" ? "default" : "secondary"}>
                          {practice.impact} Impact
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{practice.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Key Performance Indicators</CardTitle>
          <CardDescription>
            Industry benchmark targets for training effectiveness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {data.kpis.map((kpi: any, index: number) => (
              <div key={index} className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <h3 className="font-semibold">{kpi.name}</h3>
                </div>
                <div className="flex items-baseline gap-2 mb-1">
                  <p className="text-2xl font-bold text-primary">{kpi.target}</p>
                  <p className="text-sm text-muted-foreground">target</p>
                </div>
                <p className="text-xs text-muted-foreground">{kpi.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Implementation Recommendations</CardTitle>
          <CardDescription>
            Steps to align with industry best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              "Conduct a comprehensive skills gap analysis across all departments",
              "Establish a dedicated training budget (aim for 4-5% of payroll)",
              "Implement a learning management system (LMS) for tracking",
              "Create career development paths with clear training milestones",
              "Set up regular feedback loops with employees on training needs",
              "Partner with industry experts for specialized training programs",
            ].map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {index + 1}
                </div>
                <p className="text-sm flex-1">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
