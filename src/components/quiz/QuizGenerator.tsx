import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Plus, Trash2, GripVertical, CheckCircle2, Circle } from 'lucide-react';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

interface QuizGeneratorProps {
  questions: QuizQuestion[];
  onChange: (questions: QuizQuestion[]) => void;
  moduleTitle?: string;
  moduleDescription?: string;
}

export const QuizGenerator = ({
  questions,
  onChange,
  moduleTitle,
  moduleDescription,
}: QuizGeneratorProps) => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [generating, setGenerating] = useState(false);

  const generateQuiz = async () => {
    if (!moduleTitle) return;
    setGenerating(true);

    // In production this calls an Edge Function with the AI model.
    // For now, generate template questions based on the module metadata.
    const templates: QuizQuestion[] = [
      {
        id: crypto.randomUUID(),
        question: fr
          ? `Quel est l'objectif principal du module "${moduleTitle}" ?`
          : `What is the main objective of the "${moduleTitle}" module?`,
        options: [
          fr ? 'Comprendre les concepts fondamentaux' : 'Understand fundamental concepts',
          fr ? 'Appliquer les techniques avancées' : 'Apply advanced techniques',
          fr ? 'Évaluer les résultats' : 'Evaluate results',
          fr ? 'Planifier les prochaines étapes' : 'Plan next steps',
        ],
        correctIndex: 0,
        explanation: fr
          ? 'Ce module se concentre sur la compréhension des bases.'
          : 'This module focuses on understanding the basics.',
      },
      {
        id: crypto.randomUUID(),
        question: fr
          ? 'Quelle compétence clé est développée dans ce module ?'
          : 'Which key skill is developed in this module?',
        options: [
          fr ? 'Analyse critique' : 'Critical analysis',
          fr ? 'Communication' : 'Communication',
          fr ? 'Résolution de problèmes' : 'Problem solving',
          fr ? 'Gestion du temps' : 'Time management',
        ],
        correctIndex: 2,
      },
      {
        id: crypto.randomUUID(),
        question: fr
          ? 'Comment mesurer le succès de cette formation ?'
          : 'How do you measure the success of this training?',
        options: [
          fr ? 'Par un test final' : 'Through a final test',
          fr ? 'Par l\'application pratique' : 'Through practical application',
          fr ? 'Par les retours des participants' : 'Through participant feedback',
          fr ? 'Toutes les réponses ci-dessus' : 'All of the above',
        ],
        correctIndex: 3,
      },
    ];

    // Simulate AI delay
    await new Promise((r) => setTimeout(r, 800));
    onChange([...questions, ...templates]);
    setGenerating(false);
  };

  const addQuestion = () => {
    onChange([
      ...questions,
      {
        id: crypto.randomUUID(),
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      },
    ]);
  };

  const updateQuestion = (idx: number, updates: Partial<QuizQuestion>) => {
    const updated = [...questions];
    updated[idx] = { ...updated[idx], ...updates };
    onChange(updated);
  };

  const removeQuestion = (idx: number) => {
    onChange(questions.filter((_, i) => i !== idx));
  };

  const updateOption = (qIdx: number, oIdx: number, value: string) => {
    const updated = [...questions];
    const opts = [...updated[qIdx].options];
    opts[oIdx] = value;
    updated[qIdx] = { ...updated[qIdx], options: opts };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {fr ? 'Questions du quiz' : 'Quiz Questions'}
          {questions.length > 0 && (
            <Badge variant="secondary" className="ml-2">{questions.length}</Badge>
          )}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={generateQuiz}
            disabled={generating || !moduleTitle}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {generating
              ? fr ? 'Génération...' : 'Generating...'
              : fr ? 'Générer avec l\'IA' : 'AI Generate'}
          </Button>
          <Button variant="outline" size="sm" onClick={addQuestion} className="gap-2">
            <Plus className="h-4 w-4" />
            {fr ? 'Ajouter' : 'Add'}
          </Button>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p className="text-sm">
            {fr
              ? 'Aucune question. Utilisez l\'IA pour en générer automatiquement.'
              : 'No questions yet. Use AI to auto-generate them.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, qIdx) => (
            <Card key={q.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground/40 mt-1 shrink-0 cursor-grab" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">Q{qIdx + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => removeQuestion(qIdx)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                    <Input
                      value={q.question}
                      onChange={(e) => updateQuestion(qIdx, { question: e.target.value })}
                      placeholder={fr ? 'Entrez la question...' : 'Enter question...'}
                      className="font-medium"
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pl-10">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateQuestion(qIdx, { correctIndex: oIdx })}
                      className="shrink-0"
                    >
                      {oIdx === q.correctIndex ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-muted-foreground" />
                      )}
                    </button>
                    <Input
                      value={opt}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`${fr ? 'Option' : 'Option'} ${oIdx + 1}`}
                      className={`text-sm ${oIdx === q.correctIndex ? 'border-green-500/50' : ''}`}
                    />
                  </div>
                ))}
                <Input
                  value={q.explanation || ''}
                  onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                  placeholder={fr ? 'Explication (optionnel)...' : 'Explanation (optional)...'}
                  className="text-xs text-muted-foreground mt-2"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
