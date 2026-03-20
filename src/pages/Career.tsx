import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { useCareerProfile } from '@/hooks/useCareerProfile';
import { useSyncJobTitleSkills } from '@/hooks/useSyncJobTitleSkills';
import { SkillDeclarationInput } from '@/components/career/SkillDeclarationInput';
import { MySkillsPanel } from '@/components/career/MySkillsPanel';
import { CareerPathCard } from '@/components/career/CareerPathCard';
import { AICareerCoachPanel } from '@/components/career/AICareerCoachPanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';

const Career = () => {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { employee, aggregatedSkills, careerMatches } = useCareerProfile();
  const syncMutation = useSyncJobTitleSkills();

  const employeeName = user?.user_metadata?.first_name
    ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim()
    : employee?.full_name || 'Employee';

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {language === 'fr' ? 'Ma carrière' : 'My Career'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {employee?.position && (
              <Badge variant="outline" className="mr-2">{employee.position}</Badge>
            )}
            {employee?.department && (
              <Badge variant="secondary">{employee.department}</Badge>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <Zap className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Sync depuis poste' : 'Sync from job title'}
          </Button>
          <Button asChild size="sm">
            <Link to="/career/jobs">
              <Briefcase className="h-4 w-4 mr-1" />
              {language === 'fr' ? 'Postes ouverts →' : 'Browse Open Positions →'}
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <SkillDeclarationInput />
          <MySkillsPanel skills={aggregatedSkills} />
        </div>
        <div className="space-y-6">
          <AICareerCoachPanel
            skills={aggregatedSkills}
            careerMatches={careerMatches}
            employeeName={employeeName}
            position={employee?.position || ''}
          />
          <CareerPathCard matches={careerMatches} />
        </div>
      </div>
    </div>
  );
};

export default Career;
