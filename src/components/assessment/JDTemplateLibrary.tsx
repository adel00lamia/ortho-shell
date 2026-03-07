import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Sparkles, Plus, Copy, FileText, Globe, MapPin, Loader2 } from 'lucide-react';
import { JD_TEMPLATES, JD_LEVELS, JD_DEPARTMENTS, type JDTemplate } from '@/data/jobDescriptionTemplates';
import { useLanguage } from '@/contexts/LanguageContext';

interface JDTemplateLibraryProps {
  companyId: string | null;
  onApplyTemplate: (template: JDTemplate) => void;
}

export const JDTemplateLibrary = ({ companyId, onApplyTemplate }: JDTemplateLibraryProps) => {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<JDTemplate | null>(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({ title: '', department: '', level: 'mid', industry: '', context: '' });

  const industries = Array.from(new Set(JD_TEMPLATES.map(t => t.industry))).sort();

  const filteredTemplates = JD_TEMPLATES.filter(t => {
    const matchesSearch = !search || 
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.titleFr.toLowerCase().includes(search.toLowerCase()) ||
      t.department.toLowerCase().includes(search.toLowerCase()) ||
      t.industry.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesDept = departmentFilter === 'all' || t.department === departmentFilter;
    const matchesLevel = levelFilter === 'all' || t.level === levelFilter;
    const matchesIndustry = industryFilter === 'all' || t.industry === industryFilter;
    return matchesSearch && matchesCategory && matchesDept && matchesLevel && matchesIndustry;
  });

  const handleAIGenerate = async () => {
    if (!aiForm.title.trim()) {
      toast.error(language === 'fr' ? 'Le titre est requis' : 'Title is required');
      return;
    }
    setAiGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-org-assessment', {
        body: {
          action: 'generate-jd',
          data: {
            title: aiForm.title,
            department: aiForm.department,
            level: aiForm.level,
            industry: aiForm.industry,
            companyContext: aiForm.context,
            language,
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      if (result) {
        const generated: JDTemplate = {
          id: `ai-${Date.now()}`,
          title: result.title || aiForm.title,
          titleFr: result.title || aiForm.title,
          department: aiForm.department || 'General',
          level: aiForm.level,
          category: 'international',
          industry: aiForm.industry || 'General',
          description: result.description || '',
          descriptionFr: result.description || '',
          responsibilities: result.responsibilities || [],
          responsibilitiesFr: result.responsibilities || [],
          technicalSkills: result.technicalSkills || [],
          softSkills: result.softSkills || [],
          competencies: result.competencies || [],
        };
        setSelectedTemplate(generated);
        toast.success(language === 'fr' ? 'Fiche de poste générée par AI' : 'AI-generated job description ready');
      }
    } catch (err: any) {
      toast.error(err.message || 'AI generation failed');
    } finally {
      setAiGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Templates' : 'Templates'}
          </TabsTrigger>
          <TabsTrigger value="ai-generate">
            <Sparkles className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Générer avec AI' : 'AI Generate'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={language === 'fr' ? 'Rechercher un template...' : 'Search templates...'}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'fr' ? 'Tous' : 'All'}</SelectItem>
                <SelectItem value="morocco">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {language === 'fr' ? 'Maroc' : 'Morocco'}</span>
                </SelectItem>
                <SelectItem value="international">
                  <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> International</span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'fr' ? 'Tous depts' : 'All depts'}</SelectItem>
                {JD_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'fr' ? 'Tous niveaux' : 'All levels'}</SelectItem>
                {JD_LEVELS.map(l => (
                  <SelectItem key={l.value} value={l.value}>
                    {language === 'fr' ? l.labelFr : l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={language === 'fr' ? 'Secteur' : 'Industry'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === 'fr' ? 'Tous secteurs' : 'All industries'}</SelectItem>
                {industries.map(ind => <SelectItem key={ind} value={ind}>{ind}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Template grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <Card key={template.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedTemplate(template)}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {language === 'fr' ? template.titleFr : template.title}
                      </CardTitle>
                      <CardDescription>{template.department} · {JD_LEVELS.find(l => l.value === template.level)?.[language === 'fr' ? 'labelFr' : 'label']}</CardDescription>
                    </div>
                    <Badge variant={template.category === 'morocco' ? 'default' : 'secondary'}>
                      {template.category === 'morocco' ? '🇲🇦' : '🌍'} {template.category === 'morocco' ? (language === 'fr' ? 'Maroc' : 'Morocco') : 'International'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {language === 'fr' ? template.descriptionFr : template.description}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {template.technicalSkills.slice(0, 3).map(s => (
                      <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                    ))}
                    {template.technicalSkills.length > 3 && (
                      <Badge variant="outline" className="text-xs">+{template.technicalSkills.length - 3}</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'fr' ? 'Aucun template trouvé' : 'No templates found'}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ai-generate">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                {language === 'fr' ? 'Générateur AI de fiches de poste' : 'AI Job Description Generator'}
              </CardTitle>
              <CardDescription>
                {language === 'fr'
                  ? 'Décrivez le poste et l\'AI générera une fiche complète et structurée'
                  : 'Describe the role and AI will generate a complete, structured job description'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>{language === 'fr' ? 'Titre du poste' : 'Job Title'} *</Label>
                  <Input
                    value={aiForm.title}
                    onChange={e => setAiForm(p => ({ ...p, title: e.target.value }))}
                    placeholder={language === 'fr' ? 'Ex: Chef de projet digital' : 'Ex: Digital Project Manager'}
                  />
                </div>
                <div>
                  <Label>{language === 'fr' ? 'Département' : 'Department'}</Label>
                  <Select value={aiForm.department} onValueChange={v => setAiForm(p => ({ ...p, department: v }))}>
                    <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Choisir...' : 'Select...'} /></SelectTrigger>
                    <SelectContent>
                      {JD_DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'fr' ? 'Niveau' : 'Level'}</Label>
                  <Select value={aiForm.level} onValueChange={v => setAiForm(p => ({ ...p, level: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {JD_LEVELS.map(l => (
                        <SelectItem key={l.value} value={l.value}>{language === 'fr' ? l.labelFr : l.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{language === 'fr' ? 'Secteur' : 'Industry'}</Label>
                  <Input
                    value={aiForm.industry}
                    onChange={e => setAiForm(p => ({ ...p, industry: e.target.value }))}
                    placeholder={language === 'fr' ? 'Ex: Technologie, Finance...' : 'Ex: Technology, Finance...'}
                  />
                </div>
              </div>
              <div>
                <Label>{language === 'fr' ? 'Contexte entreprise (optionnel)' : 'Company context (optional)'}</Label>
                <Textarea
                  value={aiForm.context}
                  onChange={e => setAiForm(p => ({ ...p, context: e.target.value }))}
                  placeholder={language === 'fr' ? 'Décrivez votre entreprise, taille, marché...' : 'Describe your company, size, market...'}
                  rows={3}
                />
              </div>
              <Button onClick={handleAIGenerate} disabled={aiGenerating} className="w-full">
                {aiGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {aiGenerating
                  ? (language === 'fr' ? 'Génération en cours...' : 'Generating...')
                  : (language === 'fr' ? 'Générer la fiche de poste' : 'Generate Job Description')}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Template Detail Dialog */}
      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {language === 'fr' ? selectedTemplate.titleFr : selectedTemplate.title}
                  <Badge variant={selectedTemplate.category === 'morocco' ? 'default' : 'secondary'} className="text-xs">
                    {selectedTemplate.category === 'morocco' ? '🇲🇦' : '🌍'}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{selectedTemplate.department} · {selectedTemplate.level} · {selectedTemplate.industry}</p>
                  <p className="text-sm">{language === 'fr' ? selectedTemplate.descriptionFr : selectedTemplate.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">{language === 'fr' ? 'Responsabilités' : 'Responsibilities'}</h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {(language === 'fr' ? selectedTemplate.responsibilitiesFr : selectedTemplate.responsibilities).map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">{language === 'fr' ? 'Compétences techniques' : 'Technical Skills'}</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.technicalSkills.map(s => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Soft Skills</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedTemplate.softSkills.map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-sm mb-2">{language === 'fr' ? 'Compétences requises' : 'Required Competencies'}</h4>
                  <div className="space-y-2">
                    {selectedTemplate.competencies.map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{c.name}</span>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map(n => (
                            <div key={n} className={`w-4 h-4 rounded-sm ${n <= c.level ? 'bg-primary' : 'bg-muted'}`} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={() => { onApplyTemplate(selectedTemplate); setSelectedTemplate(null); }} className="flex-1">
                    <Copy className="h-4 w-4 mr-2" />
                    {language === 'fr' ? 'Utiliser ce template' : 'Use this template'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
