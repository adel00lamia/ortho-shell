import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSyncCompanySkills } from '@/hooks/useSyncCompanySkills';
import { RefreshCw, Building2, Users, BarChart3, Network, CheckCircle2, ArrowUpDown } from 'lucide-react';

export const CompanyProfileSync = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { sync, syncing, lastSync, companyId } = useSyncCompanySkills();
  const autoSynced = useRef(false);

  // Auto-sync on first mount (silent)
  useEffect(() => {
    if (companyId && !autoSynced.current) {
      autoSynced.current = true;
      sync(language, true);
    }
  }, [companyId, language, sync]);

  if (!companyId) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-lg">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">
                {fr ? 'Synchroniser le Profil Entreprise' : 'Sync Company Profile'}
              </h3>
              <p className="text-xs text-muted-foreground">
                {fr
                  ? 'Importer et mettre à jour les compétences depuis évaluations et organigramme'
                  : 'Import & update skills from evaluations and org chart'}
              </p>
            </div>
          </div>

          <Button onClick={() => sync(language)} disabled={syncing} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing
              ? (fr ? 'Synchronisation...' : 'Syncing...')
              : (fr ? 'Synchroniser' : 'Sync Now')}
          </Button>
        </div>

        {lastSync && (
          <div className="mt-3 flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className="gap-1 text-xs">
              <Users className="h-3 w-3" />
              {lastSync.employeesSynced} {fr ? 'employés' : 'employees'}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <BarChart3 className="h-3 w-3" />
              {lastSync.fromEvaluations} {fr ? 'depuis évaluations' : 'from evaluations'}
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Network className="h-3 w-3" />
              {lastSync.fromPositions} {fr ? 'depuis organigramme' : 'from org chart'}
            </Badge>
            {lastSync.created > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <CheckCircle2 className="h-3 w-3" />
                {lastSync.created} {fr ? 'créées' : 'created'}
              </Badge>
            )}
            {lastSync.updated > 0 && (
              <Badge variant="secondary" className="gap-1 text-xs text-amber-600">
                <ArrowUpDown className="h-3 w-3" />
                {lastSync.updated} {fr ? 'mises à jour' : 'updated'}
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
