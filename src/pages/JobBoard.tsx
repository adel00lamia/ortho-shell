import { useLanguage } from '@/contexts/LanguageContext';
import { useOpenJobs, useMyApplications, useApplyToJob, useWithdrawApplication } from '@/hooks/useJobMarketplace';
import { useCareerProfile } from '@/hooks/useCareerProfile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Briefcase, CheckCircle2, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

const JobBoard = () => {
  const { language } = useLanguage();
  const { data: openJobs = [], isLoading } = useOpenJobs();
  const { data: myApps = [] } = useMyApplications();
  const { aggregatedSkills } = useCareerProfile();
  const applyMutation = useApplyToJob();
  const withdrawMutation = useWithdrawApplication();

  const mySkillNames = aggregatedSkills.map(s => s.skillName.toLowerCase());

  const computeMatch = (job: any) => {
    const required = [
      ...(Array.isArray(job.required_skills) ? job.required_skills : []),
      ...(Array.isArray(job.competencies) ? (job.competencies as any[]).map((c: any) => c.name || c) : []),
    ].map((s: any) => (typeof s === 'string' ? s : s.name || '').toLowerCase()).filter(Boolean);

    const matched = required.filter(r => mySkillNames.some(m => m.includes(r) || r.includes(m)));
    return required.length > 0 ? Math.round((matched.length / required.length) * 100) : 0;
  };

  const sortedJobs = [...openJobs]
    .map(j => ({ ...j, matchScore: computeMatch(j) }))
    .sort((a, b) => b.matchScore - a.matchScore);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-100 text-emerald-800';
    if (score >= 50) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/career">
            <ArrowLeft className="h-4 w-4 mr-1" />
            {language === 'fr' ? 'Profil Carrière' : 'Career Profile'}
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Briefcase className="h-6 w-6 text-primary" />
          {language === 'fr' ? 'Postes ouverts' : 'Open Positions'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'fr'
            ? `${sortedJobs.length} postes ouverts, classés par compatibilité`
            : `${sortedJobs.length} open positions, ranked by skill match`}
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
      ) : sortedJobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {language === 'fr' ? 'Aucun poste ouvert pour le moment.' : 'No open positions at the moment.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedJobs.map((job) => {
            const application = myApps.find(a => a.job_description_id === job.id);
            const hasApplied = !!application;

            return (
              <Card key={job.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{job.title}</h3>
                        <Badge className={`${getScoreColor(job.matchScore)} tabular-nums`}>
                          {job.matchScore}% {language === 'fr' ? 'match' : 'match'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {job.department && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {job.department}
                          </span>
                        )}
                        {job.level && <Badge variant="outline" className="text-[10px]">{job.level}</Badge>}
                        {job.closes_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {language === 'fr' ? 'Ferme le' : 'Closes'} {format(new Date(job.closes_at), 'dd/MM/yyyy')}
                          </span>
                        )}
                      </div>
                      {job.description && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                      )}
                    </div>
                    <div className="shrink-0">
                      {hasApplied ? (
                        <div className="flex flex-col items-end gap-1">
                          <Badge variant="outline" className="text-emerald-700 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            {language === 'fr' ? 'Candidature envoyée' : 'Applied'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-destructive"
                            onClick={() => withdrawMutation.mutate(application!.id)}
                            disabled={withdrawMutation.isPending}
                          >
                            {language === 'fr' ? 'Retirer' : 'Withdraw'}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => applyMutation.mutate({ jobId: job.id, matchScore: job.matchScore })}
                          disabled={applyMutation.isPending}
                        >
                          {language === 'fr' ? 'Postuler' : 'Apply'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobBoard;
