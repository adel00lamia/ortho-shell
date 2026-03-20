import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Sparkles, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Competency {
  name: string;
  requiredLevel: number;
  category: string;
}

interface JobDescriptionFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
  language?: string;
}

const skillCategories = [
  "Leadership", "Communication", "Technical Skills", "Project Management",
  "Sales", "Marketing", "Data Analysis", "Cybersecurity", "AI/ML",
  "Customer Service", "Financial Management", "Operations"
];

const levelOptions = [
  { value: "entry", en: "Entry Level", fr: "Débutant" },
  { value: "junior", en: "Junior", fr: "Junior" },
  { value: "mid", en: "Mid-Level", fr: "Intermédiaire" },
  { value: "senior", en: "Senior", fr: "Senior" },
  { value: "lead", en: "Lead", fr: "Lead" },
  { value: "manager", en: "Manager", fr: "Manager" },
  { value: "director", en: "Director", fr: "Directeur" },
];

const competencyLevels = [
  { value: 1, en: "Beginner", fr: "Débutant" },
  { value: 2, en: "Basic", fr: "Base" },
  { value: 3, en: "Intermediate", fr: "Intermédiaire" },
  { value: 4, en: "Advanced", fr: "Avancé" },
  { value: 5, en: "Expert", fr: "Expert" },
];

export default function JobDescriptionForm({ onSave, onCancel, initialData, language = "en" }: JobDescriptionFormProps) {
  const fr = language === "fr";

  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    department: initialData?.department || "",
    level: initialData?.level || "",
    description: initialData?.description || "",
    responsibilities: initialData?.responsibilities || [],
    requiredSkills: initialData?.required_skills || [],
    preferredSkills: initialData?.preferred_skills || []
  });

  const [competencies, setCompetencies] = useState<Competency[]>(
    initialData?.competencies || []
  );

  const [newResponsibility, setNewResponsibility] = useState("");
  const [newCompetency, setNewCompetency] = useState<Partial<Competency>>({
    category: skillCategories[0],
    requiredLevel: 3
  });
  const [aiLoading, setAiLoading] = useState(false);

  const addResponsibility = () => {
    if (newResponsibility.trim()) {
      setFormData(prev => ({
        ...prev,
        responsibilities: [...prev.responsibilities, newResponsibility]
      }));
      setNewResponsibility("");
    }
  };

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities.filter((_: any, i: number) => i !== index)
    }));
  };

  const addCompetency = () => {
    if (newCompetency.name && newCompetency.category) {
      setCompetencies([...competencies, newCompetency as Competency]);
      setNewCompetency({ category: skillCategories[0], requiredLevel: 3 });
    }
  };

  const removeCompetency = (index: number) => {
    setCompetencies(competencies.filter((_, i) => i !== index));
  };

  const suggestWithAI = async (type: 'responsibilities' | 'competencies') => {
    if (!formData.title) {
      toast.error(fr ? "Veuillez d'abord entrer un titre de poste" : "Please enter a job title first");
      return;
    }

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-suggest-diagnostic', {
        body: {
          type: type === 'responsibilities' ? 'job_responsibilities' : 'job_competencies',
          context: {
            title: formData.title,
            department: formData.department,
            level: formData.level
          }
        }
      });

      if (error) throw error;

      if (type === 'responsibilities' && data?.suggestions) {
        setFormData(prev => ({
          ...prev,
          responsibilities: [...prev.responsibilities, ...data.suggestions]
        }));
        toast.success(fr ? "Suggestions AI ajoutées !" : "AI suggestions added!");
      } else if (type === 'competencies' && data?.suggestions) {
        const newCompetencies = data.suggestions.map((suggestion: string) => {
          const parts = suggestion.split(' - ');
          return {
            name: parts[0],
            requiredLevel: 3,
            category: skillCategories[0]
          };
        });
        setCompetencies([...competencies, ...newCompetencies]);
        toast.success(fr ? "Suggestions AI ajoutées !" : "AI suggestions added!");
      }
    } catch (error: any) {
      console.error('AI suggestion error:', error);
      toast.error(error.message || (fr ? "Échec de la génération" : "Failed to generate suggestions"));
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      competencies
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>{fr ? "Titre du poste" : "Job Title"} *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder={fr ? "Ex: Développeur Senior" : "e.g., Senior Developer"}
            required
          />
        </div>
        <div>
          <Label>{fr ? "Département" : "Department"}</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder={fr ? "Ex: Ingénierie" : "e.g., Engineering"}
          />
        </div>
      </div>

      <div>
        <Label>{fr ? "Niveau" : "Level"}</Label>
        <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
          <SelectTrigger>
            <SelectValue placeholder={fr ? "Sélectionner le niveau" : "Select level"} />
          </SelectTrigger>
          <SelectContent>
            {levelOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {fr ? opt.fr : opt.en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder={fr ? "Aperçu général du rôle..." : "Brief overview of the role..."}
          rows={3}
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>{fr ? "Responsabilités clés" : "Key Responsibilities"}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => suggestWithAI('responsibilities')}
            disabled={aiLoading || !formData.title}
          >
            {aiLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {fr ? "Suggestion AI" : "AI Suggest"}
          </Button>
        </div>
        <div className="space-y-2">
          {formData.responsibilities.map((resp: string, idx: number) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="flex-1 text-sm p-2 bg-muted rounded">{resp}</div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeResponsibility(idx)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <div className="flex gap-2">
            <Input
              value={newResponsibility}
              onChange={(e) => setNewResponsibility(e.target.value)}
              placeholder={fr ? "Ajouter une responsabilité..." : "Add a responsibility..."}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addResponsibility())}
            />
            <Button type="button" onClick={addResponsibility} variant="outline">
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <Label className="text-base">{fr ? "Compétences requises" : "Required Competencies"}</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => suggestWithAI('competencies')}
              disabled={aiLoading || !formData.title}
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              {fr ? "Suggestion AI" : "AI Suggest"}
            </Button>
          </div>
          <div className="space-y-3 mb-4">
            {competencies.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded">
                <div className="flex-1">
                  <div className="font-medium">{comp.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {comp.category} • {fr ? "Niveau" : "Level"} {comp.requiredLevel}
                  </div>
                </div>
                <Badge variant="secondary">{fr ? "Requis" : "Required"}</Badge>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCompetency(idx)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 border rounded-lg">
            <div>
              <Label className="text-xs">{fr ? "Nom de la compétence" : "Competency Name"}</Label>
              <Input
                value={newCompetency.name || ""}
                onChange={(e) => setNewCompetency(prev => ({ ...prev, name: e.target.value }))}
                placeholder={fr ? "Ex: Programmation Python" : "e.g., Python Programming"}
              />
            </div>
            <div>
              <Label className="text-xs">{fr ? "Catégorie" : "Category"}</Label>
              <Select 
                value={newCompetency.category} 
                onValueChange={(value) => setNewCompetency(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">{fr ? "Niveau requis (1-5)" : "Required Level (1-5)"}</Label>
              <Select 
                value={newCompetency.requiredLevel?.toString()} 
                onValueChange={(value) => setNewCompetency(prev => ({ ...prev, requiredLevel: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {competencyLevels.map(level => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.value} - {fr ? level.fr : level.en}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="button" onClick={addCompetency} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                {fr ? "Ajouter une compétence" : "Add Competency"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          {fr ? "Annuler" : "Cancel"}
        </Button>
        <Button type="submit" className="flex-1">
          {initialData
            ? (fr ? "Mettre à jour la fiche de poste" : "Update Job Description")
            : (fr ? "Créer la fiche de poste" : "Create Job Description")}
        </Button>
      </div>
    </form>
  );
}
