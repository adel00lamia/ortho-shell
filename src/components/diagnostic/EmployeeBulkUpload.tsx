import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, Download, FileText, X, Loader2, Users, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  name: string;
  jobDescriptionId: string | null;
  performanceEvaluationId: string | null;
  currentCompetencies: Record<string, number>;
  targetCompetencies: Record<string, number>;
  priority: 'low' | 'medium' | 'high';
  department?: string;
  email?: string;
  position?: string;
  cvPath?: string;
  cvExtracting?: boolean;
}

interface EmployeeBulkUploadProps {
  companyId: string | null;
  employees: Employee[];
  onEmployeesChange: (employees: Employee[]) => void;
}

interface ParsedRow {
  name: string;
  email?: string;
  department?: string;
  position?: string;
  priority?: string;
  skills?: string;
}

const CSV_TEMPLATE = `name,email,department,position,priority,current_skills
Ahmed Benali,ahmed@company.ma,IT,Developer,high,"JavaScript:4,Python:3,React:4"
Sara Idrissi,sara@company.ma,Marketing,Marketing Manager,medium,"SEO:3,Content:4,Analytics:2"
Karim Tazi,karim@company.ma,Finance,Accountant,low,"Excel:5,SAP:3,Reporting:4"`;

export default function EmployeeBulkUpload({ companyId, employees, onEmployeesChange }: EmployeeBulkUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [cvUploading, setCvUploading] = useState(false);
  const [extractingAll, setExtractingAll] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employee_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Modèle téléchargé");
  };

  const parseCSV = (text: string): ParsedRow[] => {
    const lines = text.trim().split("\n");
    if (lines.length < 2) throw new Error("Le fichier doit contenir un en-tête et au moins une ligne de données");

    const headers = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
    const nameIdx = headers.findIndex(h => h === "name" || h === "nom");
    if (nameIdx === -1) throw new Error("Colonne 'name' (ou 'nom') manquante");

    const rows: ParsedRow[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle quoted fields with commas
      const values: string[] = [];
      let current = "";
      let inQuotes = false;
      for (const char of line) {
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "," && !inQuotes) {
          values.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      values.push(current.trim());

      const name = values[nameIdx];
      if (!name) {
        errors.push(`Ligne ${i + 1}: nom manquant`);
        continue;
      }

      const emailIdx = headers.findIndex(h => h === "email");
      const deptIdx = headers.findIndex(h => h === "department" || h === "departement");
      const posIdx = headers.findIndex(h => h === "position" || h === "poste");
      const prioIdx = headers.findIndex(h => h === "priority" || h === "priorite");
      const skillsIdx = headers.findIndex(h => h.includes("skill") || h.includes("competence"));

      rows.push({
        name,
        email: emailIdx >= 0 ? values[emailIdx] : undefined,
        department: deptIdx >= 0 ? values[deptIdx] : undefined,
        position: posIdx >= 0 ? values[posIdx] : undefined,
        priority: prioIdx >= 0 ? values[prioIdx] : undefined,
        skills: skillsIdx >= 0 ? values[skillsIdx] : undefined,
      });
    }

    setParseErrors(errors);
    return rows;
  };

  const parseSkillsString = (skills: string | undefined): Record<string, number> => {
    if (!skills) return {};
    const result: Record<string, number> = {};
    skills.split(",").forEach(s => {
      const parts = s.trim().split(":");
      if (parts.length === 2) {
        const score = parseInt(parts[1]);
        if (!isNaN(score)) result[parts[0].trim()] = Math.min(5, Math.max(1, score));
      }
    });
    return result;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Veuillez utiliser un fichier CSV");
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      const rows = parseCSV(text);

      if (rows.length === 0) {
        toast.error("Aucun employé valide trouvé dans le fichier");
        return;
      }

      const newEmployees: Employee[] = rows.map(row => ({
        id: crypto.randomUUID(),
        name: row.name,
        email: row.email,
        department: row.department,
        position: row.position,
        jobDescriptionId: null,
        performanceEvaluationId: null,
        currentCompetencies: parseSkillsString(row.skills),
        targetCompetencies: {},
        priority: (["low", "medium", "high"].includes(row.priority?.toLowerCase() || "") 
          ? row.priority!.toLowerCase() as 'low' | 'medium' | 'high' 
          : "medium"),
      }));

      onEmployeesChange([...employees, ...newEmployees]);
      toast.success(`${newEmployees.length} employé(s) importé(s)`);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'import");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !companyId) return;

    setCvUploading(true);
    let successCount = 0;

    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`${file.name}: fichier trop volumineux (max 10MB)`);
          continue;
        }

        const fileName = `${companyId}/${Date.now()}-${file.name}`;
        const { data, error } = await supabase.storage
          .from("employee-cvs")
          .upload(fileName, file);

        if (error) {
          toast.error(`Erreur upload ${file.name}`);
          continue;
        }

        // Try to match by filename to existing employee, or create new
        const baseName = file.name.replace(/\.(pdf|doc|docx)$/i, "").replace(/[-_]/g, " ");
        const existingIdx = employees.findIndex(emp => 
          emp.name.toLowerCase().includes(baseName.toLowerCase()) || 
          baseName.toLowerCase().includes(emp.name.toLowerCase())
        );

        if (existingIdx >= 0) {
          const updated = [...employees];
          updated[existingIdx] = { ...updated[existingIdx], cvPath: data.path };
          onEmployeesChange(updated);
        } else {
          // Create new employee from CV
          const newEmp: Employee = {
            id: crypto.randomUUID(),
            name: baseName,
            jobDescriptionId: null,
            performanceEvaluationId: null,
            currentCompetencies: {},
            targetCompetencies: {},
            priority: "medium",
            cvPath: data.path,
          };
          onEmployeesChange([...employees, newEmp]);
        }
        successCount++;
      }

      if (successCount > 0) {
        toast.success(`${successCount} CV(s) uploadé(s)`);
      }
    } catch (error) {
      toast.error("Erreur lors de l'upload des CVs");
    } finally {
      setCvUploading(false);
      if (cvInputRef.current) cvInputRef.current.value = "";
    }
  };

  const extractSkillsFromCV = async (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp?.cvPath) return;

    const updated = employees.map(e => e.id === empId ? { ...e, cvExtracting: true } : e);
    onEmployeesChange(updated);

    try {
      const { data, error } = await supabase.functions.invoke("ai-resume-extract", {
        body: { filePath: emp.cvPath, employeeName: emp.name },
      });

      if (error) throw error;

      if (data?.extracted) {
        const skills: Record<string, number> = {};
        data.extracted.skills?.forEach((skill: string) => {
          skills[skill] = 3; // Default level from CV
        });

        const finalUpdated = employees.map(e =>
          e.id === empId
            ? { ...e, currentCompetencies: { ...e.currentCompetencies, ...skills }, cvExtracting: false }
            : e
        );
        onEmployeesChange(finalUpdated);
        toast.success(`Compétences extraites pour ${emp.name}`);
      }
    } catch (error) {
      const finalUpdated = employees.map(e => e.id === empId ? { ...e, cvExtracting: false } : e);
      onEmployeesChange(finalUpdated);
      toast.error(`Erreur extraction pour ${emp.name}`);
    }
  };

  const extractAllCVs = async () => {
    const empsWithCV = employees.filter(e => e.cvPath && !e.cvExtracting);
    if (empsWithCV.length === 0) {
      toast.info("Aucun CV à analyser");
      return;
    }

    setExtractingAll(true);
    for (const emp of empsWithCV) {
      await extractSkillsFromCV(emp.id);
    }
    setExtractingAll(false);
    toast.success("Extraction terminée");
  };

  const empsWithCV = employees.filter(e => e.cvPath);
  const empsWithSkills = employees.filter(e => Object.keys(e.currentCompetencies).length > 0);

  return (
    <div className="space-y-4">
      {/* Upload Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Download Template */}
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={downloadTemplate}>
          <CardContent className="pt-6 text-center">
            <Download className="w-8 h-8 mx-auto mb-2 text-primary" />
            <h4 className="font-semibold text-sm">Télécharger le modèle</h4>
            <p className="text-xs text-muted-foreground mt-1">Fichier CSV avec colonnes préremplies</p>
          </CardContent>
        </Card>

        {/* Upload CSV */}
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <CardContent className="pt-6 text-center">
            {uploading ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            ) : (
              <Upload className="w-8 h-8 mx-auto mb-2 text-primary" />
            )}
            <h4 className="font-semibold text-sm">Importer fichier CSV</h4>
            <p className="text-xs text-muted-foreground mt-1">Liste des employés avec compétences</p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Upload CVs */}
        <Card
          className="cursor-pointer hover:border-primary transition-colors"
          onClick={() => cvInputRef.current?.click()}
        >
          <CardContent className="pt-6 text-center">
            {cvUploading ? (
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
            ) : (
              <FileText className="w-8 h-8 mx-auto mb-2 text-primary" />
            )}
            <h4 className="font-semibold text-sm">Uploader des CVs</h4>
            <p className="text-xs text-muted-foreground mt-1">PDF/DOC — extraction IA auto</p>
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              multiple
              onChange={handleCVUpload}
              className="hidden"
            />
          </CardContent>
        </Card>
      </div>

      {/* Parse Errors */}
      {parseErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 rounded-lg text-sm space-y-1">
          <div className="flex items-center gap-2 text-destructive font-medium">
            <AlertCircle className="w-4 h-4" />
            Erreurs d'import
          </div>
          {parseErrors.map((err, i) => (
            <p key={i} className="text-destructive/80 text-xs">• {err}</p>
          ))}
        </div>
      )}

      {/* Stats */}
      {employees.length > 0 && (
        <div className="flex items-center gap-4 flex-wrap">
          <Badge variant="secondary" className="gap-1">
            <Users className="w-3 h-3" />
            {employees.length} employé(s)
          </Badge>
          <Badge variant="outline" className="gap-1">
            <FileText className="w-3 h-3" />
            {empsWithCV.length} CV(s)
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle2 className="w-3 h-3" />
            {empsWithSkills.length} avec compétences
          </Badge>

          {empsWithCV.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={extractAllCVs}
              disabled={extractingAll}
            >
              {extractingAll ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {extractingAll ? "Extraction en cours..." : "Extraire compétences de tous les CVs"}
            </Button>
          )}
        </div>
      )}

      {/* Employee List */}
      {employees.length > 0 && (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="flex items-center gap-3 p-3 border rounded-lg bg-card"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{emp.name}</span>
                  {emp.department && (
                    <Badge variant="secondary" className="text-xs">{emp.department}</Badge>
                  )}
                  {emp.position && (
                    <Badge variant="outline" className="text-xs">{emp.position}</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant={emp.priority === "high" ? "destructive" : emp.priority === "medium" ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {emp.priority}
                  </Badge>
                  {Object.keys(emp.currentCompetencies).length > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {Object.keys(emp.currentCompetencies).length} compétences
                    </span>
                  )}
                  {emp.cvPath && (
                    <Badge variant="outline" className="text-xs gap-1">
                      <FileText className="w-3 h-3" /> CV
                    </Badge>
                  )}
                </div>
              </div>

              {emp.cvPath && !emp.cvExtracting && Object.keys(emp.currentCompetencies).length === 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => extractSkillsFromCV(emp.id)}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
              {emp.cvExtracting && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onEmployeesChange(employees.filter(e => e.id !== emp.id))}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
