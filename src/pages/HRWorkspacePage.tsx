import { useAuth } from '@/hooks/useAuth';
import { useCompanyProfile } from '@/hooks/useCompanyProfile';
import { HRWorkspace } from '@/components/hr-workspace/HRWorkspace';
import { emptyModel } from '@/lib/hrWorkspace/model';
import { liveKey } from '@/lib/hrWorkspace/storage';

export default function HRWorkspacePage() {
  const { user } = useAuth();
  const { context, companyId, loading } = useCompanyProfile();
  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">Chargement…</div>;
  if (!user || !companyId) return <div className="mx-auto max-w-lg p-8 text-center text-sm">Aucune entreprise rattachée à votre compte. Complétez d’abord votre profil entreprise.</div>;
  const c = context?.company;
  const prefill = () => emptyModel({ name: c?.name ?? '', sector: c?.industry ?? '', headcount: c?.employeeCount ?? null, sites: c?.city ?? '' });
  return <HRWorkspace storageKey={liveKey(user.id, companyId)} initial={prefill} resetTo={prefill} demo={false} />;
}
