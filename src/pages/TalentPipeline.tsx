import { useLanguage } from '@/contexts/LanguageContext';
import { useJobsWithApplicants } from '@/hooks/useJobMarketplace';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Briefcase } from 'lucide-react';

const TalentPipeline = () => {
  const { language } = useLanguage();
  const { data: jobs = [], isLoading } = useJobsWithApplicants();

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-100 text-emerald-800';
    if (score >= 50) return 'bg-amber-100 text-amber-800';
    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          {language === 'fr' ? 'Pipeline de talents' : 'Talent Pipeline'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {language === 'fr'
            ? 'Tous les postes ouverts avec les candidats classés par compatibilité'
            : 'All open positions with applicants ranked by skill match'}
        </p>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">{language === 'fr' ? 'Chargement...' : 'Loading...'}</p>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {language === 'fr' ? 'Aucun poste ouvert avec des candidatures.' : 'No open positions with applicants.'}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job: any) => (
            <Card key={job.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-primary" />
                    {job.title}
                    {job.department && (
                      <Badge variant="outline" className="text-xs">{job.department}</Badge>
                    )}
                  </CardTitle>
                  <Badge variant="secondary">
                    {job.applicants.length} {language === 'fr' ? 'candidat(s)' : 'applicant(s)'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {job.applicants.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {language === 'fr' ? 'Aucun candidat pour le moment' : 'No applicants yet'}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {job.applicants.map((applicant: any) => (
                      <div
                        key={applicant.id}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-primary/10 text-primary">
                              {applicant.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{applicant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {language === 'fr' ? 'Statut' : 'Status'}: {applicant.status}
                            </p>
                          </div>
                        </div>
                        <Badge className={`${getScoreColor(applicant.match_score)} tabular-nums`}>
                          {applicant.match_score}% {language === 'fr' ? 'match' : 'match'}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default TalentPipeline;
