import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Briefcase, Plus, X, FileText, Building2, Users, UserCheck, AlertTriangle, TrendingUp, Download, Languages, Loader2, Wand2 } from "lucide-react";
import { JD_TEMPLATES } from "@/data/jobDescriptionTemplates";
import { exportJDToWord } from "@/lib/exportJDWord";
import JobDescriptionForm from "@/components/JobDescriptionForm";
import { useLanguage } from "@/contexts/LanguageContext";
import { JDTemplateLibrary } from "@/components/assessment/JDTemplateLibrary";
import { OrgChartView } from "@/components/assessment/OrgChartView";
import EmployeeList from "@/components/company/EmployeeList";
import { TranslationPreviewDialog } from "@/components/workforce/TranslationPreviewDialog";
import type { JDTemplate } from "@/data/jobDescriptionTemplates";

interface JobDescription {
  id: string;
  title: string;
  department: string;
  level: string;
  description: string;
  competencies: any;
}

interface TranslationChange {
  id: string;
  type: "department" | "position" | "jobDescription";
  field: string;
  original: string;
  translated: string;
  accepted: boolean;
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
  const [translationChanges, setTranslationChanges] = useState<TranslationChange[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [applyingTranslations, setApplyingTranslations] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  const handleAutoFillJDs = async () => {
    if (!companyId || !user) return;
    
    // Find positions without a job_description_id
    const vacantNoJD = positions.filter(p => !p.job_description_id);
    if (vacantNoJD.length === 0) {
      toast.info(language === "fr" ? "Tous les postes ont déjà une fiche de poste" : "All positions already have a job description");
      return;
    }

    setAutoFilling(true);
    let created = 0;
    let linked = 0;
    let reused = 0;

    try {
      // Cache of already-created JDs by template id to avoid duplicates
      const jdCache: Record<string, string> = {};

      // Also index existing JDs by normalized title for reuse
      for (const existingJd of jobDescriptions) {
        const key = (existingJd.title || '').toLowerCase().trim();
        if (key && existingJd.id) {
          jdCache[`title:${key}`] = existingJd.id;
        }
      }

      for (const pos of vacantNoJD) {
        // Try to match by title similarity
        const posTitle = pos.title.toLowerCase().trim();
        let bestMatch: typeof JD_TEMPLATES[0] | null = null;
        let bestScore = 0;

        for (const tpl of JD_TEMPLATES) {
          const tplTitle = tpl.title.toLowerCase();
          const tplTitleFr = tpl.titleFr.toLowerCase();
          let score = 0;
          if (posTitle.includes(tplTitle) || tplTitle.includes(posTitle)) score = 3;
          else if (posTitle.includes(tplTitleFr) || tplTitleFr.includes(posTitle)) score = 3;
          else {
            const posWords = posTitle.split(/\s+/);
            const tplWords = [...tplTitle.split(/\s+/), ...tplTitleFr.split(/\s+/)];
            for (const w of posWords) {
              if (w.length > 2 && tplWords.some(tw => tw.includes(w) || w.includes(tw))) score++;
            }
          }
          if (pos.department_id) {
            const dept = departments.find(d => d.id === pos.department_id);
            if (dept && tpl.department.toLowerCase().includes(dept.name.toLowerCase().split(' ')[0])) score += 1;
          }
          if (score > bestScore) { bestScore = score; bestMatch = tpl; }
        }

        if (bestMatch && bestScore >= 1) {
          const fr = language === "fr";
          const jdTitle = fr ? bestMatch.titleFr : bestMatch.title;
          const titleKey = `title:${jdTitle.toLowerCase().trim()}`;
          const templateKey = `tpl:${bestMatch.id}`;

          // Check if we already have a JD for this template or title
          let jdId = jdCache[templateKey] || jdCache[titleKey];

          if (jdId) {
            // Reuse existing JD — just link the position
            reused++;
          } else {
            // Create new JD
            const { data: jd, error } = await supabase.from("job_descriptions").insert({
              company_id: companyId,
              created_by: user.id,
              title: jdTitle,
              department: bestMatch.department,
              level: bestMatch.level,
              description: fr ? bestMatch.descriptionFr : bestMatch.description,
              responsibilities: fr ? bestMatch.responsibilitiesFr : bestMatch.responsibilities,
              required_skills: bestMatch.technicalSkills.map(s => ({ name: s })),
              preferred_skills: bestMatch.softSkills.map(s => ({ name: s })),
              competencies: bestMatch.competencies,
            }).select().single();

            if (!error && jd) {
              jdId = jd.id;
              jdCache[templateKey] = jd.id;
              jdCache[titleKey] = jd.id;
              created++;
            }
          }

          if (jdId) {
            const { error: linkError } = await supabase
              .from("positions")
              .update({ job_description_id: jdId })
              .eq("id", pos.id);
            if (!linkError) linked++;
          }
        }
      }

      if (created > 0 || reused > 0) {
        const parts: string[] = [];
        if (created > 0) parts.push(language === "fr" ? `${created} fiche(s) créée(s)` : `${created} JD(s) created`);
        if (reused > 0) parts.push(language === "fr" ? `${reused} réutilisée(s)` : `${reused} reused`);
        parts.push(language === "fr" ? `${linked} poste(s) lié(s)` : `${linked} position(s) linked`);
        toast.success(parts.join(", "));
        loadData();
      } else {
        toast.info(
          language === "fr"
            ? "Aucun template correspondant trouvé pour les postes vacants"
            : "No matching templates found for vacant positions"
        );
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setAutoFilling(false);
    }
  };

  const handleAILanguageFix = async () => {
    if (!companyId) return;
    setFixingLanguage(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-language-fix', {
        body: { departments, positions, jobDescriptions, targetLanguage: language },
      });
      if (error) throw error;
      const result = data?.result;
      if (!result) throw new Error('No result from AI');

      // Build change list for preview
      const changes: TranslationChange[] = [];

      for (const dept of result.departments || []) {
        const orig = departments.find((d: any) => d.id === dept.id);
        if (orig && dept.name !== orig.name) {
          changes.push({ id: dept.id, type: "department", field: "name", original: orig.name, translated: dept.name, accepted: true });
        }
        if (orig && dept.description && dept.description !== orig.description) {
          changes.push({ id: dept.id, type: "department", field: "description", original: orig.description || "", translated: dept.description, accepted: true });
        }
      }
      for (const pos of result.positions || []) {
        const orig = positions.find((p: any) => p.id === pos.id);
        if (orig && pos.title !== orig.title) {
          changes.push({ id: pos.id, type: "position", field: "title", original: orig.title, translated: pos.title, accepted: true });
        }
      }
      for (const jd of result.jobDescriptions || []) {
        const orig = jobDescriptions.find((j: any) => j.id === jd.id);
        if (orig && jd.title !== orig.title) {
          changes.push({ id: jd.id, type: "jobDescription", field: "title", original: orig.title, translated: jd.title, accepted: true });
        }
        if (orig && jd.department && jd.department !== orig.department) {
          changes.push({ id: jd.id, type: "jobDescription", field: "department", original: orig.department || "", translated: jd.department, accepted: true });
        }
        if (orig && jd.description && jd.description !== orig.description) {
          changes.push({ id: jd.id, type: "jobDescription", field: "description", original: orig.description || "", translated: jd.description, accepted: true });
        }
      }

      if (changes.length === 0) {
        toast.info(language === 'fr' ? 'Tout est déjà dans la bonne langue !' : 'Everything is already in the correct language!');
      } else {
        setTranslationChanges(changes);
        setPreviewOpen(true);
      }
    } catch (err: any) {
      toast.error(err.message || 'AI language fix failed');
    } finally {
      setFixingLanguage(false);
    }
  };

  const handleApplyTranslations = async (accepted: TranslationChange[]) => {
    setApplyingTranslations(true);
    let updated = 0;
    try {
      // Group by id+type for batch updates
      const deptUpdates = new Map<string, any>();
      const posUpdates = new Map<string, any>();
      const jdUpdates = new Map<string, any>();

      for (const c of accepted) {
        if (c.type === "department") {
          const u = deptUpdates.get(c.id) || {};
          u[c.field] = c.translated;
          deptUpdates.set(c.id, u);
        } else if (c.type === "position") {
          const u = posUpdates.get(c.id) || {};
          u[c.field] = c.translated;
          posUpdates.set(c.id, u);
        } else {
          const u = jdUpdates.get(c.id) || {};
          u[c.field] = c.translated;
          jdUpdates.set(c.id, u);
        }
      }

      for (const [id, data] of deptUpdates) {
        const { error } = await supabase.from('departments').update(data).eq('id', id);
        if (!error) updated++;
      }
      for (const [id, data] of posUpdates) {
        const { error } = await supabase.from('positions').update(data).eq('id', id);
        if (!error) updated++;
      }
      for (const [id, data] of jdUpdates) {
        const { error } = await supabase.from('job_descriptions').update(data).eq('id', id);
        if (!error) updated++;
      }

      toast.success(language === 'fr' ? `${updated} élément(s) mis à jour` : `${updated} item(s) updated`);
      setPreviewOpen(false);
      setTranslationChanges([]);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setApplyingTranslations(false);
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
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">
              {language === "fr" ? "Effectifs & Organisation" : "Workforce & Organization"}
            </h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAILanguageFix}
              disabled={fixingLanguage || (!departments.length && !positions.length && !jobDescriptions.length)}
              className="gap-2"
            >
              {fixingLanguage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Languages className="h-4 w-4" />}
              {language === "fr" ? "Uniformiser la langue (AI)" : "Fix Language (AI)"}
            </Button>
          </div>
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
                    <div className="flex gap-2">
                      {positions.filter(p => !p.job_description_id).length > 0 && (
                        <Button
                          variant="outline"
                          onClick={handleAutoFillJDs}
                          disabled={autoFilling}
                        >
                          {autoFilling ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                          {language === "fr"
                            ? `Auto-remplir (${positions.filter(p => !p.job_description_id).length})`
                            : `Auto-fill (${positions.filter(p => !p.job_description_id).length})`}
                        </Button>
                      )}
                      <Button onClick={() => setShowJobForm(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "fr" ? "Ajouter" : "Add Job Description"}
                      </Button>
                    </div>
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
              employees={employees}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Translation Preview Dialog */}
      <TranslationPreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        changes={translationChanges}
        onApply={handleApplyTranslations}
        fr={language === "fr"}
        isApplying={applyingTranslations}
      />
    </div>
  );
}
