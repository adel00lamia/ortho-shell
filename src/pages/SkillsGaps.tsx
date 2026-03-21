import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { BarChart3, GraduationCap, TrendingUp, Brain } from "lucide-react";
import { SkillsMatrixView } from "@/components/assessment/SkillsMatrixView";
import { SkillsTaxonomyEditor } from "@/components/skills/SkillsTaxonomyEditor";
import { SkillsHeatmap } from "@/components/skills/SkillsHeatmap";
import { GapAnalysisPanel } from "@/components/skills/GapAnalysisPanel";
import { CompanyProfileSync } from "@/components/skills/CompanyProfileSync";
import { EmployeeSkillProfiler } from "@/components/diagnostic/EmployeeSkillProfiler";

export default function SkillsGaps() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [positions, setPositions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<any[]>([]);

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
      const [posRes, evalsRes, jdRes] = await Promise.all([
        supabase.from("positions").select("*").eq("company_id", profile.company_id),
        supabase.from("performance_evaluations").select("*").eq("company_id", profile.company_id),
        supabase.from("job_descriptions").select("*").eq("company_id", profile.company_id),
      ]);
      if (posRes.data) setPositions(posRes.data);
      if (evalsRes.data) setEvaluations(evalsRes.data);
      if (jdRes.data) setJobDescriptions(jdRes.data);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === "fr" ? "Compétences & Écarts" : "Skills & Gaps"}
          </h1>
          <p className="text-muted-foreground">
            {language === "fr"
              ? "Analysez les compétences de votre organisation et identifiez les écarts à combler"
              : "Analyze your organization's skills and identify gaps to address"}
          </p>
        </div>

        <Tabs defaultValue="matrix" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-[700px]">
            <TabsTrigger value="matrix" className="flex items-center gap-1">
              <BarChart3 className="h-3.5 w-3.5" />
              {language === "fr" ? "Matrice" : "Skills Matrix"}
            </TabsTrigger>
            <TabsTrigger value="taxonomy" className="flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {language === "fr" ? "Taxonomie" : "Taxonomy"}
            </TabsTrigger>
            <TabsTrigger value="gaps" className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" />
              {language === "fr" ? "Analyse des écarts" : "Gap Analysis"}
            </TabsTrigger>
            <TabsTrigger value="profiler" className="flex items-center gap-1">
              <Brain className="h-3.5 w-3.5" />
              {language === "fr" ? "Profilage IA" : "AI Profiler"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="matrix" className="space-y-4">
            <SkillsMatrixView
              positions={positions}
              evaluations={evaluations}
              jobDescriptions={jobDescriptions}
            />
          </TabsContent>

          <TabsContent value="taxonomy" className="space-y-6">
            <CompanyProfileSync />
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList>
                <TabsTrigger value="editor">{language === "fr" ? "Éditeur" : "Taxonomy Editor"}</TabsTrigger>
                <TabsTrigger value="heatmap">{language === "fr" ? "Carte thermique" : "Skills Heatmap"}</TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <SkillsTaxonomyEditor />
              </TabsContent>
              <TabsContent value="heatmap">
                <SkillsHeatmap />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="gaps" className="space-y-4">
            <GapAnalysisPanel />
          </TabsContent>

          <TabsContent value="profiler">
            <EmployeeSkillProfiler />
          </TabsContent>
        </Tabs>

        <div className="mt-8">
          <ContextualActions currentPage="diagnostic" />
        </div>
      </div>
    </div>
  );
}
