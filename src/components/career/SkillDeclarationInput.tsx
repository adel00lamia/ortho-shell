import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSkillDeclaration } from '@/hooks/useCareerProfile';
import { useLanguage } from '@/contexts/LanguageContext';
import { Save, Sparkles } from 'lucide-react';

export const SkillDeclarationInput = () => {
  const { declarationText, isLoading, saveDeclaration, saving } = useSkillDeclaration();
  const { language } = useLanguage();
  const [text, setText] = useState('');

  useEffect(() => {
    setText(declarationText);
  }, [declarationText]);

  const hasChanges = text !== declarationText;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          {language === 'fr' ? 'Déclaration de compétences' : 'Skill Declaration'}
        </CardTitle>
        <CardDescription>
          {language === 'fr'
            ? 'Décrivez vos compétences, expériences et certifications en texte libre. Cela aide à identifier vos forces et parcours de carrière.'
            : 'Describe your skills, experiences and certifications in free text. This helps identify your strengths and career paths.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={language === 'fr'
            ? 'Ex: 5 ans d\'expérience en gestion de projet, certifié PMP, maîtrise d\'Excel avancé, leadership d\'équipe...'
            : 'Ex: 5 years project management, PMP certified, advanced Excel, team leadership...'}
          rows={5}
          disabled={isLoading}
          className="resize-none"
        />
        <div className="flex justify-end">
          <Button
            onClick={() => saveDeclaration(text)}
            disabled={!hasChanges || saving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? (language === 'fr' ? 'Enregistrement...' : 'Saving...') : (language === 'fr' ? 'Enregistrer' : 'Save')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
