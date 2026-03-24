import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft, Plus, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import type { IngenierieDossier } from '@/hooks/useIngenierie';

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  implications: string;
}

interface Props {
  dossier: IngenierieDossier;
  onSave: (data: Partial<IngenierieDossier>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

const DEFAULT_SWOT: SwotData = { strengths: [''], weaknesses: [''], opportunities: [''], threats: [''], implications: '' };

function parseSwot(raw: any): SwotData {
  if (!raw || typeof raw !== 'object') return DEFAULT_SWOT;
  return {
    strengths: Array.isArray(raw.strengths) && raw.strengths.length ? raw.strengths : [''],
    weaknesses: Array.isArray(raw.weaknesses) && raw.weaknesses.length ? raw.weaknesses : [''],
    opportunities: Array.isArray(raw.opportunities) && raw.opportunities.length ? raw.opportunities : [''],
    threats: Array.isArray(raw.threats) && raw.threats.length ? raw.threats : [''],
    implications: raw.implications || '',
  };
}

const QUADRANTS = [
  { key: 'strengths' as const, labelFr: 'Forces', labelEn: 'Strengths', color: 'border-green-400 bg-green-50' },
  { key: 'weaknesses' as const, labelFr: 'Faiblesses', labelEn: 'Weaknesses', color: 'border-red-400 bg-red-50' },
  { key: 'opportunities' as const, labelFr: 'Opportunités', labelEn: 'Opportunities', color: 'border-blue-400 bg-blue-50' },
  { key: 'threats' as const, labelFr: 'Menaces', labelEn: 'Threats', color: 'border-orange-400 bg-orange-50' },
];

export function SWOTStep({ dossier, onSave, onNext, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [swot, setSwot] = useState<SwotData>(() => parseSwot(dossier.swot_data));

  const updateItem = (quadrant: keyof Omit<SwotData, 'implications'>, index: number, value: string) => {
    setSwot((prev) => {
      const arr = [...prev[quadrant]];
      arr[index] = value;
      return { ...prev, [quadrant]: arr };
    });
  };

  const addItem = (quadrant: keyof Omit<SwotData, 'implications'>) => {
    setSwot((prev) => ({ ...prev, [quadrant]: [...prev[quadrant], ''] }));
  };

  const removeItem = (quadrant: keyof Omit<SwotData, 'implications'>, index: number) => {
    setSwot((prev) => {
      const arr = prev[quadrant].filter((_, i) => i !== index);
      return { ...prev, [quadrant]: arr.length ? arr : [''] };
    });
  };

  const handleNext = async () => {
    await onSave({ swot_data: swot });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANTS.map((q) => (
          <Card key={q.key} className={`border-2 ${q.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{fr ? q.labelFr : q.labelEn}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {swot[q.key].map((item, i) => (
                <div key={i} className="flex gap-2">
                  <Textarea
                    rows={2}
                    value={item}
                    onChange={(e) => updateItem(q.key, i, e.target.value)}
                    placeholder={fr ? `Ajouter un élément...` : `Add item...`}
                    className="text-sm resize-none"
                  />
                  <Button
                    type="button" size="icon" variant="ghost"
                    onClick={() => removeItem(q.key, i)}
                    className="shrink-0 h-8 w-8 mt-1"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              <Button type="button" size="sm" variant="outline" onClick={() => addItem(q.key)} className="w-full text-xs">
                <Plus className="h-3 w-3 mr-1" />
                {fr ? 'Ajouter' : 'Add'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">{fr ? 'Implications stratégiques pour la formation' : 'Strategic Implications for Training'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={swot.implications}
            onChange={(e) => setSwot((prev) => ({ ...prev, implications: e.target.value }))}
            placeholder={fr ? 'Décrivez les implications de cette analyse sur les besoins de formation...' : 'Describe training implications from this analysis...'}
          />
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Button onClick={handleNext}>{fr ? 'Enregistrer & Suivant' : 'Save & Next'}<ArrowRight className="h-4 w-4 ml-2" /></Button>
      </div>
    </div>
  );
}
