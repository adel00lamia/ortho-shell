import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import IndustryComparison from "@/components/benchmark/IndustryComparison";
import BestPractices from "@/components/benchmark/BestPractices";

export default function Benchmark() {
  const [loading, setLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<string>("");
  const [companyData, setCompanyData] = useState<any>(null);
  const [diagnosticData, setDiagnosticData] = useState<any[]>([]);
  const [evaluationData, setEvaluationData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get user's company
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id, companies(id, name, domain)")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyData(profile.companies);

        // Load diagnostics
        const { data: diagnostics } = await supabase
          .from("training_diagnostics")
          .select("*")
          .eq("company_id", profile.company_id);

        setDiagnosticData(diagnostics || []);

        // Load evaluations
        const { data: evaluations } = await supabase
          .from("performance_evaluations")
          .select("*")
          .eq("company_id", profile.company_id);

        setEvaluationData(evaluations || []);

        // Set industry from most recent diagnostic
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
    "Technology",
    "Healthcare",
    "Finance",
    "Manufacturing",
    "Retail",
    "Education",
    "Hospitality",
    "Construction",
    "Transportation",
    "Energy"
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
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Industry Benchmark</h1>
        <p className="text-muted-foreground">
          Compare your training and performance metrics against industry best practices
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Industry Sector</CardTitle>
          <CardDescription>
            Choose your industry to see relevant benchmarks and best practices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select your industry" />
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
        </>
      )}

      {!selectedIndustry && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              Select an industry sector above to view benchmarks and best practices
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
