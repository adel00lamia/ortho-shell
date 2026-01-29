import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Save, 
  FolderPlus, 
  FileCheck,
  Lock,
  Globe,
  Trash2,
  Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PlanTemplate {
  id: string;
  name: string;
  description: string;
  configuration: any;
  is_public: boolean;
  created_at: string;
}

interface PlanRequirements {
  company: string;
  industry: string;
  companySize: string;
  budget: number;
  duration: number;
  objectives: string[];
  targetSkills: string[];
  constraints: string[];
  aiModel: string;
  context: string;
  customizations: any;
}

interface PlanTemplateSaverProps {
  currentRequirements: PlanRequirements;
  templates: PlanTemplate[];
  onSaveTemplate: (name: string, description: string, isPublic: boolean, configuration: any) => Promise<void>;
  onLoadTemplate: (template: PlanTemplate) => void;
  onDeleteTemplate?: (templateId: string) => Promise<void>;
  isLoading?: boolean;
}

export const PlanTemplateSaver = ({
  currentRequirements,
  templates,
  onSaveTemplate,
  onLoadTemplate,
  onDeleteTemplate,
  isLoading = false,
}: PlanTemplateSaverProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!templateName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter a name for your template.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSaveTemplate(
        templateName.trim(),
        templateDescription.trim(),
        isPublic,
        currentRequirements
      );
      toast({
        title: 'Template Saved',
        description: 'Your configuration has been saved as a template.',
      });
      setIsDialogOpen(false);
      setTemplateName('');
      setTemplateDescription('');
      setIsPublic(false);
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: 'Could not save the template. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!onDeleteTemplate) return;
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await onDeleteTemplate(templateId);
        toast({
          title: 'Template Deleted',
          description: 'The template has been removed.',
        });
      } catch (error) {
        toast({
          title: 'Delete Failed',
          description: 'Could not delete the template.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderPlus className="h-5 w-5" />
          Configuration Templates
        </CardTitle>
        <CardDescription>
          Save your current settings as a reusable template
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Save Current Configuration */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Save className="h-4 w-4 mr-2" />
              Save Current Configuration
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save as Template</DialogTitle>
              <DialogDescription>
                Save your current plan configuration to reuse later
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g., Tech Team Training Setup"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="template-description">Description (optional)</Label>
                <Textarea
                  id="template-description"
                  placeholder="Describe what this template is for..."
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="is-public" className="flex items-center gap-2">
                    {isPublic ? <Globe className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    {isPublic ? 'Public Template' : 'Private Template'}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {isPublic ? 'Anyone in your organization can use this template' : 'Only you can see and use this template'}
                  </p>
                </div>
                <Switch
                  id="is-public"
                  checked={isPublic}
                  onCheckedChange={setIsPublic}
                />
              </div>
              
              {/* Preview of what will be saved */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm font-medium">Configuration Preview</p>
                <div className="flex flex-wrap gap-1">
                  {currentRequirements.industry && (
                    <Badge variant="secondary">{currentRequirements.industry}</Badge>
                  )}
                  {currentRequirements.companySize && (
                    <Badge variant="secondary">{currentRequirements.companySize}</Badge>
                  )}
                  <Badge variant="secondary">{currentRequirements.duration} months</Badge>
                  <Badge variant="secondary">{currentRequirements.budget.toLocaleString()} MAD</Badge>
                </div>
                {currentRequirements.targetSkills.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {currentRequirements.targetSkills.length} skills, {currentRequirements.objectives.length} objectives
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Template'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saved Templates List */}
        {isLoading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">
            <FileCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved templates yet</p>
            <p className="text-xs">Save your first configuration above</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Your Templates</p>
            {templates.map((template) => (
              <div
                key={template.id}
                className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{template.name}</span>
                      {template.is_public ? (
                        <Badge variant="outline" className="text-xs">
                          <Globe className="h-3 w-3 mr-1" />
                          Public
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          <Lock className="h-3 w-3 mr-1" />
                          Private
                        </Badge>
                      )}
                    </div>
                    {template.description && (
                      <p className="text-xs text-muted-foreground">{template.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onLoadTemplate(template)}
                    >
                      Load
                    </Button>
                    {onDeleteTemplate && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
