import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Award, Edit3, Trash2, Plus, Check, X, Wand2 } from "lucide-react";

interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

interface QuizEditorProps {
  quiz: QuizQuestion[];
  onQuizChange: (quiz: QuizQuestion[]) => void;
  onRegenerateQuiz: () => void;
  isRegenerating: boolean;
}

export function QuizEditor({ quiz, onQuizChange, onRegenerateQuiz, isRegenerating }: QuizEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<QuizQuestion>({ question: "", options: ["", "", "", ""], correct: 0 });

  const startEdit = (index: number) => {
    setEditingIndex(index);
    setEditForm({ ...quiz[index], options: [...quiz[index].options] });
  };

  const saveEdit = () => {
    if (editingIndex === null) return;
    const updated = [...quiz];
    updated[editingIndex] = editForm;
    onQuizChange(updated);
    setEditingIndex(null);
  };

  const deleteQuestion = (index: number) => {
    onQuizChange(quiz.filter((_, i) => i !== index));
  };

  const addQuestion = () => {
    const newQ: QuizQuestion = { question: "New question", options: ["Option A", "Option B", "Option C", "Option D"], correct: 0 };
    onQuizChange([...quiz, newQ]);
    setEditingIndex(quiz.length);
    setEditForm({ ...newQ, options: [...newQ.options] });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Quiz Questions ({quiz.length})
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRegenerateQuiz} disabled={isRegenerating}>
            <Wand2 className="w-4 h-4 mr-1" />
            {isRegenerating ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {quiz.map((q, index) => (
          <div key={index} className="border rounded-lg p-4 space-y-2">
            {editingIndex === index ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Editing Q{index + 1}</span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={saveEdit}><Check className="w-4 h-4 text-green-600" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setEditingIndex(null)}><X className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
                <Input value={editForm.question} onChange={(e) => setEditForm(prev => ({ ...prev, question: e.target.value }))} placeholder="Question text" />
                <RadioGroup value={String(editForm.correct)} onValueChange={(v) => setEditForm(prev => ({ ...prev, correct: parseInt(v) }))}>
                  {editForm.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <RadioGroupItem value={String(oi)} id={`opt-${oi}`} />
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const opts = [...editForm.options];
                          opts[oi] = e.target.value;
                          setEditForm(prev => ({ ...prev, options: opts }));
                        }}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">Question {index + 1}</h4>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => startEdit(index)}><Edit3 className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteQuestion(index)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </div>
                <p className="text-sm font-medium">{q.question}</p>
                <div className="space-y-1">
                  {q.options.map((option, oi) => (
                    <div key={oi} className={`text-xs p-2 rounded ${oi === q.correct ? "bg-green-500/10 text-green-700 border border-green-300" : "bg-muted"}`}>
                      {oi === q.correct && "✓ "}{option}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
        {quiz.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No quiz questions yet. Add manually or use AI generation.
          </div>
        )}
        <Button variant="outline" size="sm" onClick={addQuestion} className="w-full">
          <Plus className="w-3 h-3 mr-1" /> Add Question
        </Button>
      </CardContent>
    </Card>
  );
}
