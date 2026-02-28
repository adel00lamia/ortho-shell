import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
  FileText, Edit3, Trash2, GripVertical, Plus, Check, X, Wand2
} from "lucide-react";

interface Slide {
  title: string;
  content: string;
  type?: string;
  videoUrl?: string;
  exerciseInstructions?: string;
  resourceLinks?: string[];
}

interface SlideEditorProps {
  slides: Slide[];
  onSlidesChange: (slides: Slide[]) => void;
  onRegenerateSlides: () => void;
  isRegenerating: boolean;
}

export function SlideEditor({ slides, onSlidesChange, onRegenerateSlides, isRegenerating }: SlideEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Slide>({ title: "", content: "" });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(slides);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    onSlidesChange(items);
  };

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...slides[index] });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...slides];
    updated[editingIndex] = editForm;
    onSlidesChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => setEditingIndex(null);

  const deleteSlide = (index: number) => {
    onSlidesChange(slides.filter((_, i) => i !== index));
  };

  const addSlide = (type: Slide["type"] = "text") => {
    onSlidesChange([...slides, {
      title: `New ${type === "video" ? "Video" : type === "exercise" ? "Exercise" : type === "resource" ? "Resource" : "Slide"}`,
      content: "",
      type: type || "text",
    }]);
    setEditingIndex(slides.length);
    setEditForm({
      title: `New ${type === "video" ? "Video" : type === "exercise" ? "Exercise" : type === "resource" ? "Resource" : "Slide"}`,
      content: "",
      type: type || "text",
    });
  };

  const typeColors: Record<string, string> = {
    text: "bg-primary/10 text-primary",
    video: "bg-blue-500/10 text-blue-600",
    exercise: "bg-orange-500/10 text-orange-600",
    resource: "bg-green-500/10 text-green-600",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Slides ({slides.length})
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerateSlides} disabled={isRegenerating}>
              <Wand2 className="w-4 h-4 mr-1" />
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {slides.map((slide, index) => (
                  <Draggable key={index} draggableId={`slide-${index}`} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`border rounded-lg p-4 transition-shadow ${snapshot.isDragging ? "shadow-lg bg-background" : ""}`}
                      >
                        {editingIndex === index ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-muted-foreground">Editing Slide {index + 1}</span>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" onClick={saveEdit}><Check className="w-4 h-4 text-green-600" /></Button>
                                <Button variant="ghost" size="sm" onClick={cancelEdit}><X className="w-4 h-4 text-destructive" /></Button>
                              </div>
                            </div>
                            <Input value={editForm.title} onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))} placeholder="Slide title" />
                            <Textarea value={editForm.content} onChange={(e) => setEditForm(prev => ({ ...prev, content: e.target.value }))} placeholder="Slide content" className="min-h-24" />
                            {editForm.type === "video" && (
                              <Input value={editForm.videoUrl || ""} onChange={(e) => setEditForm(prev => ({ ...prev, videoUrl: e.target.value }))} placeholder="Video URL (YouTube, Vimeo, etc.)" />
                            )}
                            {editForm.type === "exercise" && (
                              <Textarea value={editForm.exerciseInstructions || ""} onChange={(e) => setEditForm(prev => ({ ...prev, exerciseInstructions: e.target.value }))} placeholder="Exercise instructions for learners..." className="min-h-16" />
                            )}
                          </div>
                        ) : (
                          <div className="flex items-start gap-3">
                            <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                                <h5 className="font-medium text-sm truncate">{slide.title}</h5>
                                <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${typeColors[slide.type || "text"]}`}>
                                  {slide.type || "text"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{slide.content}</p>
                            </div>
                            <div className="flex gap-1 shrink-0">
                              <Button variant="ghost" size="sm" onClick={() => startEdit(index)}><Edit3 className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" onClick={() => deleteSlide(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {slides.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No slides yet. Add slides manually or use AI generation.
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" onClick={() => addSlide("text")}><Plus className="w-3 h-3 mr-1" /> Text Slide</Button>
          <Button variant="outline" size="sm" onClick={() => addSlide("video")}><Plus className="w-3 h-3 mr-1" /> Video Slide</Button>
          <Button variant="outline" size="sm" onClick={() => addSlide("exercise")}><Plus className="w-3 h-3 mr-1" /> Exercise</Button>
          <Button variant="outline" size="sm" onClick={() => addSlide("resource")}><Plus className="w-3 h-3 mr-1" /> Resource</Button>
        </div>
      </CardContent>
    </Card>
  );
}
