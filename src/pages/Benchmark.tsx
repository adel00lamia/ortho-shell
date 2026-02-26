import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import IndustryComparison from "@/components/benchmark/IndustryComparison";
import BestPractices from "@/components/benchmark/BestPractices";
import { WorkflowIndicator } from "@/components/WorkflowIndicator";
import { ContextualActions } from "@/components/ContextualActions";
import { useLanguage } from '@/contexts/LanguageContext';

export default function Benchmark() {
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [companyData, setCompanyData] = useState<any>(null);
  const [diagnosticData, setDiagnosticData] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any[]>([]);
  const { t } = useLanguage();
  const b = t.benchmark;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, companies(id, name, domain)")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyData(profile.companies);

        const { data: diagnostics } = await supabase
          .from("training_diagnostics")
          .select("*")
          .eq("company_id", profile.company_id);

        setDiagnosticData(diagnostics || []);

        const { data: evaluations } = await supabase
          .from("performance_evaluations")
          .select("*")
          .eq("company_id", profile.company_id);

        setEvaluationData(evaluations || []);

        if (diagnostics && diagnostics.length > 0 && diagnostics[0].industry) {
          setSelectedIndustry(diagnostics[0].industry);
        }
      }
    } catch (error) {
      console.error("Error loading benchmark data:", error);
      toast.error("Failed to load benchmark data");
    } finally {
      setLoading(false);
    }
  };

  const industries = [
    "Technology", "Healthcare", "Finance", "Manufacturing",
    "Retail", "Education", "Hospitality", "Construction",
    "Transportation", "Energy"
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <WorkflowIndicator />
      
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{b.title}</h1>
        <p className="text-muted-foreground">{b.subtitle}</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{b.selectIndustrySector}</CardTitle>
          <CardDescription>{b.selectIndustrySectorDesc}</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder={b.selectYourIndustry} />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
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
            evaluationData={evaluationData}
          />
          
          <BestPractices industry={selectedIndustry} />
          
          <div className="mt-6">
            <ContextualActions currentPage="benchmark" />
          </div>
        </>
      )}

      {!selectedIndustry && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{b.selectIndustryAbove}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
