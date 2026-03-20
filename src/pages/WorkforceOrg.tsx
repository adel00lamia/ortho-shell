import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Briefcase, Plus, X, FileText, Building2, Users, UserCheck, AlertTriangle, TrendingUp, Download, Languages, Loader2 } from "lucide-react";
import { exportJDToWord } from "@/lib/exportJDWord";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { JDTemplateLibrary } from "@/components/assessment/JDTemplateLibrary";
import { OrgChartView } from "@/components/assessment/OrgChartView";
import EmployeeList from "@/components/company/EmployeeList";
import type { JDTemplate } from "@/data/jobDescriptionTemplates";

interface JobDescription {
  id: string;
  title: string;
  department: string;
  level: string;
  description: string;
  competencies: any;
}

export default function WorkforceOrg() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("employees");
  const [fixingLanguage, setFixingLanguage] = useState(false);

  const handleAILanguageFix = async () => {
    if (!companyId) return;
    setFixingLanguage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-language-fix', {
        body: {
          departments,
          positions,
          jobDescriptions,
          targetLanguage: language,
        },
      });
      if (error) throw error;
      const result = data?.result;
      if (!result) throw new Error('No result from AI');

      let updated = 0;

      // Apply department translations
      for (const dept of result.departments || []) {
        const updateData: any = { name: dept.name };
        if (dept.description !== undefined) updateData.description = dept.description;
        const { error: e } = await supabase.from('departments').update(updateData).eq('id', dept.id);
        if (!e) updated++;
      }

      // Apply position translations
      for (const pos of result.positions || []) {
        const { error: e } = await supabase.from('positions').update({ title: pos.title }).eq('id', pos.id);
        if (!e) updated++;
      }

      // Apply job description translations
      for (const jd of result.jobDescriptions || []) {
        const updateData: any = { title: jd.title };
        if (jd.department) updateData.department = jd.department;
        if (jd.description) updateData.description = jd.description;
        const { error: e } = await supabase.from('job_descriptions').update(updateData).eq('id', jd.id);
        if (!e) updated++;
      }

      if (updated > 0) {
        toast.success(
          language === 'fr'
            ? `${updated} élément(s) traduit(s) en français`
            : `${updated} item(s) translated to English`
        );
        loadData();
      } else {
        toast.info(
          language === 'fr'
            ? 'Tout est déjà en français !'
            : 'Everything is already in English!'
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'AI language fix failed');
    } finally {
      setFixingLanguage(false);
    }
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("company_id")
        .eq("id", user.id)
        .single();

      if (profile?.company_id) {
        setCompanyId(profile.company_id);

        const [jobsRes, deptsRes, posRes, evalsRes, empRes] = await Promise.all([
          supabase.from("job_descriptions").select("*").eq("company_id", profile.company_id),
          supabase.from("departments").select("*").eq("company_id", profile.company_id),
          supabase.from("positions").select("*").eq("company_id", profile.company_id),
          supabase.from("performance_evaluations").select("*").eq("company_id", profile.company_id),
          (supabase as any).from("company_employees").select("*").eq("company_id", profile.company_id),
        ]);

        if (jobsRes.data) setJobDescriptions(jobsRes.data as any);
        if (deptsRes.data) setDepartments(deptsRes.data);
        if (posRes.data) setPositions(posRes.data);
        if (evalsRes.data) setEvaluations(evalsRes.data);
        if (empRes.data) setEmployees(empRes.data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const handleSaveJobDescription = async (data: any) => {
    try {
      if (!companyId || !user) return;
      const jobData = {
        company_id: companyId,
        created_by: user.id,
        title: data.title,
        department: data.department,
        level: data.level,
        description: data.description,
        responsibilities: data.responsibilities,
        required_skills: data.requiredSkills || [],
        preferred_skills: data.preferredSkills || [],
        competencies: data.competencies,
      };

      if (editingJob) {
        const { error } = await supabase.from("job_descriptions").update(jobData).eq("id", editingJob.id);
        if (error) throw error;
        toast.success(language === "fr" ? "Fiche de poste mise à jour" : "Job description updated");
      } else {
        const { error } = await supabase.from("job_descriptions").insert(jobData);
        if (error) throw error;
        toast.success(language === "fr" ? "Fiche de poste créée" : "Job description created");
      }
      setShowJobForm(false);
      setEditingJob(null);
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteJobDescription = async (id: string) => {
    try {
      const { error } = await supabase.from("job_descriptions").delete().eq("id", id);
      if (error) throw error;
      toast.success(language === "fr" ? "Fiche de poste supprimée" : "Job description deleted");
      loadData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleApplyTemplate = (template: JDTemplate) => {
    setActiveTab("jobs");
    setShowJobForm(true);
    setEditingJob({
      title: template.title,
      department: template.department,
      level: template.level,
      description: template.description,
      competencies: template.competencies,
      responsibilities: template.responsibilities,
      required_skills: template.technicalSkills.map((s) => ({ name: s })),
      preferred_skills: template.softSkills.map((s) => ({ name: s })),
    });
    toast.success(language === "fr" ? "Template appliqué - modifiez et sauvegardez" : "Template applied - edit and save");
  };

  const openPositions = positions.filter(p => p.status === 'open').length;
  const criticalPositions = positions.filter(p => p.is_critical).length;
  const activeEmployees = employees.filter(e => e.status === 'active').length;

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {language === "fr" ? "Effectifs & Organisation" : "Workforce & Organization"}
          </h1>
          <p className="text-muted-foreground">
            {language === "fr"
              ? "Gérez vos employés, fiches de poste, organigramme et structure organisationnelle"
              : "Manage employees, job descriptions, org chart, and organizational structure"}
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4 border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{activeEmployees}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "fr" ? "Employés actifs" : "Active Employees"}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Briefcase className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{jobDescriptions.length}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "fr" ? "Fiches de poste" : "Job Descriptions"}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{openPositions}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "fr" ? "Postes ouverts" : "Open Positions"}
                </div>
              </div>
            </div>
          </Card>
          <Card className="p-4 border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Building2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{departments.length}</div>
                <div className="text-xs text-muted-foreground">
                  {language === "fr" ? "Départements" : "Departments"}
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 max-w-[700px]">
            <TabsTrigger value="employees" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {language === "fr" ? "Employés" : "Employees"}
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex items-center gap-1">
              <Briefcase className="h-3.5 w-3.5" />
              {language === "fr" ? "Fiches de poste" : "Job Descriptions"}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="orgchart" className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              {language === "fr" ? "Organigramme" : "Org Chart"}
            </TabsTrigger>
          </TabsList>

          {/* Employees Tab */}
          <TabsContent value="employees" className="space-y-4">
            {companyId ? (
              <EmployeeList companyId={companyId} fr={language === "fr"} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    {language === "fr"
                      ? "Configurez votre profil d'entreprise pour gérer les employés"
                      : "Set up your company profile to manage employees"}
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Job Descriptions Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {showJobForm ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingJob ? (language === "fr" ? "Modifier" : "Edit") : (language === "fr" ? "Créer" : "Create")}{" "}
                    {language === "fr" ? "une fiche de poste" : "Job Description"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <JobDescriptionForm
                    onSave={handleSaveJobDescription}
                    onCancel={() => { setShowJobForm(false); setEditingJob(null); }}
                    initialData={editingJob}
                    language={language}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{language === "fr" ? "Fiches de poste" : "Job Descriptions"}</CardTitle>
                      <CardDescription>
                        {language === "fr" ? "Définissez les rôles et compétences requises" : "Define roles and required competencies"}
                      </CardDescription>
                    </div>
                    <Button onClick={() => setShowJobForm(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      {language === "fr" ? "Ajouter" : "Add Job Description"}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {jobDescriptions.length === 0 ? (
                    <div className="text-center py-8">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">
                        {language === "fr" ? "Aucune fiche de poste" : "No job descriptions yet"}
                      </p>
                      <Button onClick={() => setShowJobForm(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "fr" ? "Créer la première" : "Create First Job Description"}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {jobDescriptions.map((job) => (
                        <Card key={job.id} className="border">
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h3 className="font-semibold text-lg">{job.title}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {job.department} • {job.level}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    exportJDToWord({
                                      title: job.title,
                                      department: job.department,
                                      level: job.level,
                                      description: job.description,
                                      responsibilities: (job as any).responsibilities,
                                      required_skills: (job as any).required_skills,
                                      preferred_skills: (job as any).preferred_skills,
                                      competencies: job.competencies,
                                    }, language);
                                    toast.success(language === "fr" ? "Téléchargement Word en cours..." : "Downloading Word file...");
                                  }}
                                >
                                  <Download className="w-4 h-4 mr-1" />
                                  Word
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => { setEditingJob(job); setShowJobForm(true); }}>
                                  {t.common.edit}
                                </Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDeleteJobDescription(job.id)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {job.description && <p className="text-sm mb-4">{job.description}</p>}
                            {job.competencies && job.competencies.length > 0 && (
                              <div>
                                <Label className="text-xs mb-2 block">
                                  {language === "fr" ? "Compétences requises" : "Required Competencies"}
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                  {job.competencies.map((comp: any, idx: number) => (
                                    <Badge key={idx} variant="secondary">
                                      {comp.name} ({language === "fr" ? "Niveau" : "Level"} {comp.requiredLevel})
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <JDTemplateLibrary companyId={companyId} onApplyTemplate={handleApplyTemplate} />
          </TabsContent>

          {/* Org Chart Tab */}
          <TabsContent value="orgchart" className="space-y-4">
            <OrgChartView
              companyId={companyId}
              departments={departments}
              positions={positions}
              onRefresh={loadData}
              jobDescriptions={jobDescriptions}
              evaluations={evaluations}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
