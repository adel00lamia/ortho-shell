import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, FileText, Plus, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ResumeSummary {
  experience: string;
  education: string;
  skills: string[];
  certifications: string[];
}

interface ResumeSectionProps {
  resumeUrl: string;
  resumeSummary: ResumeSummary;
  onResumeUrlChange: (url: string) => void;
  onResumeSummaryChange: (summary: ResumeSummary) => void;
  companyId: string;
  employeeName: string;
}

export default function ResumeSection({
  resumeUrl,
  resumeSummary,
  onResumeUrlChange,
  onResumeSummaryChange,
  companyId,
  employeeName,
}: ResumeSectionProps) {
  const { t } = useLanguage();
  const r = t.performance.resume;
  const [uploading, setUploading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [newCert, setNewCert] = useState("");

  const extractFromCV = async (filePath: string) => {
    setExtracting(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-resume-extract", {
        body: { filePath, employeeName },
      });

      if (error) throw error;

      if (data?.extracted) {
        const ext = data.extracted;
        onResumeSummaryChange({
          experience: ext.experience || resumeSummary.experience,
          education: ext.education || resumeSummary.education,
          skills: ext.skills?.length ? ext.skills : resumeSummary.skills,
          certifications: ext.certifications?.length ? ext.certifications : resumeSummary.certifications,
        });
        toast.success(r.extractSuccess);
      }
    } catch (error: any) {
      console.error("Extract error:", error);
      toast.error(error.message || r.extractError);
    } finally {
      setExtracting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(r.fileTooLarge);
      return;
    }

    setUploading(true);
    try {
      const fileName = `${companyId}/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("employee-cvs")
        .upload(fileName, file);

      if (error) throw error;

      onResumeUrlChange(data.path);
      toast.success(r.uploadSuccess);

      if (file.name.toLowerCase().endsWith(".pdf")) {
        await extractFromCV(data.path);
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(r.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async () => {
    if (resumeUrl) {
      await supabase.storage.from("employee-cvs").remove([resumeUrl]);
      onResumeUrlChange("");
    }
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      onResumeSummaryChange({
        ...resumeSummary,
        skills: [...resumeSummary.skills, newSkill.trim()],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (idx: number) => {
    onResumeSummaryChange({
      ...resumeSummary,
      skills: resumeSummary.skills.filter((_, i) => i !== idx),
    });
  };

  const addCertification = () => {
    if (newCert.trim()) {
      onResumeSummaryChange({
        ...resumeSummary,
        certifications: [...resumeSummary.certifications, newCert.trim()],
      });
      setNewCert("");
    }
  };

  const removeCertification = (idx: number) => {
    onResumeSummaryChange({
      ...resumeSummary,
      certifications: resumeSummary.certifications.filter((_, i) => i !== idx),
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {r.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>{r.fileLabel}</Label>
          <div className="flex items-center gap-3 mt-1">
            {resumeUrl ? (
              <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50 flex-1">
                <FileText className="w-4 h-4 text-primary" />
                <span className="text-sm truncate flex-1">{resumeUrl.split("/").pop()}</span>
                <Button type="button" variant="ghost" size="sm" onClick={removeFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer p-3 border-2 border-dashed rounded-lg hover:border-primary transition-colors flex-1">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {uploading ? r.uploading : r.clickToUpload}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {resumeUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => extractFromCV(resumeUrl)}
              disabled={extracting}
            >
              {extracting ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {extracting ? r.extracting : r.extractSkills}
            </Button>
          )}

          {extracting && !resumeUrl && (
            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              {r.autoExtracting}
            </div>
          )}
        </div>

        <div>
          <Label>{r.experience}</Label>
          <Textarea
            value={resumeSummary.experience}
            onChange={(e) =>
              onResumeSummaryChange({ ...resumeSummary, experience: e.target.value })
            }
            placeholder={r.experiencePlaceholder}
            rows={3}
          />
        </div>

        <div>
          <Label>{r.education}</Label>
          <Textarea
            value={resumeSummary.education}
            onChange={(e) =>
              onResumeSummaryChange({ ...resumeSummary, education: e.target.value })
            }
            placeholder={r.educationPlaceholder}
            rows={2}
          />
        </div>

        <div>
          <Label>{r.keySkills}</Label>
          <div className="flex flex-wrap gap-2 mt-1 mb-2">
            {resumeSummary.skills.map((skill, idx) => (
              <Badge key={idx} variant="secondary" className="gap-1">
                {skill}
                <button type="button" onClick={() => removeSkill(idx)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              placeholder={r.addSkill}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addSkill}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div>
          <Label>{r.certifications}</Label>
          <div className="flex flex-wrap gap-2 mt-1 mb-2">
            {resumeSummary.certifications.map((cert, idx) => (
              <Badge key={idx} variant="outline" className="gap-1">
                {cert}
                <button type="button" onClick={() => removeCertification(idx)}>
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={newCert}
              onChange={(e) => setNewCert(e.target.value)}
              placeholder={r.addCertification}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCertification();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addCertification}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
