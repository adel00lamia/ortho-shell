import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, TrendingUp } from "lucide-react";
import { AssessmentReport } from "@/components/assessment/AssessmentReport";
import IndustryComparison from "@/components/benchmark/IndustryComparison";
import BestPractices from "@/components/benchmark/BestPractices";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AssessmentReportPage() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [diagnosticData, setDiagnosticData] = useState<any[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [companyData, setCompanyData] = useState<any>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (profile?.company_id) {
      setCompanyId(profile.company_id);

      const [companyRes, deptsRes, posRes, jdRes, evalsRes, diagRes] = await Promise.all([
        supabase.from("companies").select("name, domain").eq("id", profile.company_id).single(),
        supabase.from("departments").select("*").eq("company_id", profile.company_id),
        supabase.from("positions").select("*").eq("company_id", profile.company_id),
        supabase.from("job_descriptions").select("*").eq("company_id", profile.company_id),
        supabase.from("performance_evaluations").select("*").eq("company_id", profile.company_id),
        supabase.from("training_diagnostics").select("*").eq("company_id", profile.company_id),
      ]);

      if (companyRes.data) {
        setCompanyName(companyRes.data.name);
        setCompanyData(companyRes.data);
      }
      if (deptsRes.data) setDepartments(deptsRes.data);
      if (posRes.data) setPositions(posRes.data);
      if (jdRes.data) setJobDescriptions(jdRes.data);
      if (evalsRes.data) setEvaluations(evalsRes.data);
      if (diagRes.data) setDiagnosticData(diagRes.data);
    }
  };

  const industries = [
    "Technology", "Healthcare", "Finance", "Manufacturing",
    "Retail", "Education", "Hospitality", "Construction",
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === "fr" ? "Rapport 360° & Benchmark" : "360° Report & Benchmark"}
          </h1>
          <p className="text-muted-foreground">
            {language === "fr"
              ? "Rapport d'évaluation complet et comparaison sectorielle"
              : "Comprehensive assessment report and industry comparison"}
          </p>
        </div>

        <Tabs defaultValue="report" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[500px]">
            <TabsTrigger value="report" className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              {language === "fr" ? "Rapport IA 360°" : "AI 360° Report"}
            </TabsTrigger>
            <TabsTrigger value="benchmark" className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {language === "fr" ? "Benchmark sectoriel" : "Industry Benchmark"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="report" className="space-y-4">
            <AssessmentReport
              companyId={companyId}
              companyName={companyName}
              departments={departments}
              positions={positions}
              jobDescriptions={jobDescriptions}
              evaluations={evaluations}
            />
          </TabsContent>

          <TabsContent value="benchmark" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{language === "fr" ? "Benchmark sectoriel" : "Industry Benchmark"}</CardTitle>
                <CardDescription>
                  {language === "fr"
                    ? "Comparez vos pratiques avec votre industrie"
                    : "Compare your practices with your industry"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                  <SelectTrigger className="w-64 mb-6">
                    <SelectValue placeholder={language === "fr" ? "Sélectionner une industrie" : "Select industry"} />
                  </SelectTrigger>
                  <SelectContent>
                    {industries.map((ind) => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {selectedIndustry && (
              <>
                <IndustryComparison
                  industry={selectedIndustry}
                  companyData={companyData}
                  diagnosticData={diagnosticData}
                  evaluationData={evaluations}
                />
                <BestPractices industry={selectedIndustry} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
