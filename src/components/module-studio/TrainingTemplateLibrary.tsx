import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search, BookOpen, Clock, Users, GraduationCap, ChevronRight, FileText, HelpCircle, Layers
} from "lucide-react";
import {
  TRAINING_TEMPLATES, SPECIALTIES, AUDIENCE_LEVELS,
  type TrainingTemplate, type AudienceLevel
} from "@/data/trainingContentTemplates";

interface TrainingTemplateLibraryProps {
  onSelectTemplate: (template: TrainingTemplate) => void;
}

export function TrainingTemplateLibrary({ onSelectTemplate }: TrainingTemplateLibraryProps) {
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<AudienceLevel | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<TrainingTemplate | null>(null);

  const filtered = TRAINING_TEMPLATES.filter(t => {
    if (selectedSpecialty && t.specialty !== selectedSpecialty) return false;
    if (selectedLevel && t.audienceLevel !== selectedLevel) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.skills.some(s => s.toLowerCase().includes(q));
    }
    return true;
  });

  const levelConfig: Record<AudienceLevel, { color: string; bg: string; border: string }> = {
    executive: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    manager: { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    operational: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  };

  const depthLabel: Record<string, string> = {
    strategic: 'Stratégique',
    advanced: 'Avancé',
    practical: 'Pratique',
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Bibliothèque de Templates de Formation
          </CardTitle>
          <CardDescription>
            10 spécialités × 3 niveaux d'audience — Sélectionnez un template pour l'utiliser comme brouillon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par titre, compétence ou thème..."
              className="pl-9"
            />
          </div>

          {/* Filters */}
          <div className="space-y-3">
            {/* Audience Level */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Users className="w-3 h-3" /> Niveau d'audience
              </p>
              <div className="flex flex-wrap gap-1.5">
                {AUDIENCE_LEVELS.map(level => (
                  <Button
                    key={level.id}
                    variant={selectedLevel === level.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedLevel(selectedLevel === level.id ? null : level.id)}
                  >
                    {level.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Specialties */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> Spécialité
              </p>
              <div className="flex flex-wrap gap-1.5">
                {SPECIALTIES.map(spec => (
                  <Button
                    key={spec.id}
                    variant={selectedSpecialty === spec.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setSelectedSpecialty(selectedSpecialty === spec.id ? null : spec.id)}
                  >
                    <span className="mr-1">{spec.icon}</span> {spec.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Results count */}
          <p className="text-xs text-muted-foreground">
            {filtered.length} template{filtered.length !== 1 ? 's' : ''} trouvé{filtered.length !== 1 ? 's' : ''}
          </p>

          {/* Template cards */}
          <ScrollArea className="max-h-[400px]">
            <div className="space-y-2">
              {filtered.map(template => {
                const lc = levelConfig[template.audienceLevel];
                return (
                  <div
                    key={template.id}
                    className="border rounded-lg p-3 hover:border-primary/40 hover:bg-accent/30 transition-colors cursor-pointer group"
                    onClick={() => setPreviewTemplate(template)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-base">{template.specialtyIcon}</span>
                          <h4 className="font-medium text-sm truncate">{template.title}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{template.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${lc.bg} ${lc.color} ${lc.border}`}>
                            {AUDIENCE_LEVELS.find(l => l.id === template.audienceLevel)?.label}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            {depthLabel[template.contentDepth]}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> {template.durationHours}h
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <FileText className="w-3 h-3" /> {template.slides.length} slides
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <HelpCircle className="w-3 h-3" /> {template.quiz.length} quiz
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 mt-1" />
                    </div>
                  </div>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  Aucun template ne correspond à vos critères.
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {previewTemplate && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-xl">{previewTemplate.specialtyIcon}</span>
                  {previewTemplate.title}
                </DialogTitle>
                <DialogDescription>{previewTemplate.description}</DialogDescription>
              </DialogHeader>

              <div className="flex flex-wrap gap-2 my-2">
                <Badge variant="outline" className={`${levelConfig[previewTemplate.audienceLevel].bg} ${levelConfig[previewTemplate.audienceLevel].color}`}>
                  {AUDIENCE_LEVELS.find(l => l.id === previewTemplate.audienceLevel)?.label}
                </Badge>
                <Badge variant="secondary">{depthLabel[previewTemplate.contentDepth]}</Badge>
                <Badge variant="outline"><Clock className="w-3 h-3 mr-1" />{previewTemplate.durationHours}h</Badge>
              </div>

              <Tabs defaultValue="slides" className="mt-2">
                <TabsList className="w-full grid grid-cols-4">
                  <TabsTrigger value="slides" className="text-xs">Slides ({previewTemplate.slides.length})</TabsTrigger>
                  <TabsTrigger value="quiz" className="text-xs">Quiz ({previewTemplate.quiz.length})</TabsTrigger>
                  <TabsTrigger value="script" className="text-xs">Script</TabsTrigger>
                  <TabsTrigger value="skills" className="text-xs">Compétences</TabsTrigger>
                </TabsList>

                <TabsContent value="slides" className="mt-3">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-2">
                      {previewTemplate.slides.map((slide, i) => (
                        <div key={i} className="border rounded p-2.5">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-muted-foreground font-medium">#{i + 1}</span>
                            <span className="font-medium text-sm">{slide.title}</span>
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">{slide.type}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">{slide.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="quiz" className="mt-3">
                  <ScrollArea className="max-h-[300px]">
                    <div className="space-y-3">
                      {previewTemplate.quiz.map((q, i) => (
                        <div key={i} className="border rounded p-2.5">
                          <p className="font-medium text-sm mb-1">Q{i + 1}. {q.question}</p>
                          <div className="space-y-0.5">
                            {q.options.map((opt, j) => (
                              <p key={j} className={`text-xs ${j === q.correct ? 'text-green-600 font-medium' : 'text-muted-foreground'}`}>
                                {j === q.correct ? '✓' : '○'} {opt}
                              </p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="script" className="mt-3">
                  <div className="border rounded p-3 bg-muted/30">
                    <p className="text-sm whitespace-pre-wrap">{previewTemplate.script}</p>
                  </div>
                </TabsContent>

                <TabsContent value="skills" className="mt-3">
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" /> Compétences couvertes
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewTemplate.skills.map(s => (
                          <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1">
                        <Users className="w-3 h-3" /> Public cible
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewTemplate.targetAudience.map(a => (
                          <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => setPreviewTemplate(null)}>Fermer</Button>
                <Button onClick={() => { onSelectTemplate(previewTemplate); setPreviewTemplate(null); }}>
                  <BookOpen className="w-4 h-4 mr-1" />
                  Utiliser comme brouillon
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
