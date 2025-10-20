import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Competency {
  name: string;
  requiredLevel: number;
  category: string;
}

interface JobDescriptionFormProps {
  onSave: (data: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const skillCategories = [
  "Leadership", "Communication", "Technical Skills", "Project Management",
  "Sales", "Marketing", "Data Analysis", "Cybersecurity", "AI/ML",
  "Customer Service", "Financial Management", "Operations"
];

export default function JobDescriptionForm({ onSave, onCancel, initialData }: JobDescriptionFormProps) {
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
      responsibilities: prev.responsibilities.filter((_, i) => i !== index)
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
          <Label>Job Title *</Label>
          <Input
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="e.g., Senior Developer"
            required
          />
        </div>
        <div>
          <Label>Department</Label>
          <Input
            value={formData.department}
            onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
            placeholder="e.g., Engineering"
          />
        </div>
      </div>

      <div>
        <Label>Level</Label>
        <Select value={formData.level} onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="entry">Entry Level</SelectItem>
            <SelectItem value="junior">Junior</SelectItem>
            <SelectItem value="mid">Mid-Level</SelectItem>
            <SelectItem value="senior">Senior</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="director">Director</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Brief overview of the role..."
          rows={3}
        />
      </div>

      <div>
        <Label className="mb-2 block">Key Responsibilities</Label>
        <div className="space-y-2">
          {formData.responsibilities.map((resp, idx) => (
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
              placeholder="Add a responsibility..."
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
          <Label className="mb-4 block text-base">Required Competencies</Label>
          <div className="space-y-3 mb-4">
            {competencies.map((comp, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 bg-muted rounded">
                <div className="flex-1">
                  <div className="font-medium">{comp.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {comp.category} • Level {comp.requiredLevel}
                  </div>
                </div>
                <Badge variant="secondary">Required</Badge>
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
              <Label className="text-xs">Competency Name</Label>
              <Input
                value={newCompetency.name || ""}
                onChange={(e) => setNewCompetency(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Python Programming"
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
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
              <Label className="text-xs">Required Level (1-5)</Label>
              <Select 
                value={newCompetency.requiredLevel?.toString()} 
                onValueChange={(value) => setNewCompetency(prev => ({ ...prev, requiredLevel: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(level => (
                    <SelectItem key={level} value={level.toString()}>
                      {level} - {['Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][level - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3">
              <Button type="button" onClick={addCompetency} variant="outline" className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Add Competency
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="flex-1">
          {initialData ? "Update" : "Create"} Job Description
        </Button>
      </div>
    </form>
  );
}
