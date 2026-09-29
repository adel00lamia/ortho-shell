import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen } from 'lucide-react';
import type { OrganizationalGap, TrainingModule } from '@/types/trainingPlan';

interface Props {
  modules: TrainingModule[];
  gaps?: OrganizationalGap[];
  language: string;
}

type ModuleRef = { index: number; module: TrainingModule; source: 'measured' | 'declared'; skills: string[] };

/**
 * OFPPT F2 catalogue built from the plan's own actions: each module is filed under its
 * validated OFPPT domain/theme and attached to roles. Roles come from measured org-chart
 * gaps (strong link) or the module's declared target audience (to confirm). Nothing is invented.
 */
export function OfpptRoleModules({ modules, gaps = [], language }: Props) {
  const fr = language === 'fr';

  const { catalogue, roles } = useMemo(() => {
    const byDomain = new Map<string, { code: number | null; domain: string; items: Array<{ index: number; module: TrainingModule }> }>();
    modules.forEach((module, index) => {
      const verified = module.ofppt_domain && module.ofppt_verified !== false;
      const key = verified ? String(module.ofppt_domain_code ?? module.ofppt_domain) : '__none';
      const entry = byDomain.get(key) || {
        code: verified ? module.ofppt_domain_code ?? null : null,
        domain: verified ? module.ofppt_domain! : fr ? 'Domaine OFPPT à confirmer' : 'OFPPT domain to confirm',
        items: [],
      };
      entry.items.push({ index, module });
      byDomain.set(key, entry);
    });
    const catalogue = [...byDomain.values()].sort((a, b) => (a.code ?? 99) - (b.code ?? 99));

    const roleMap = new Map<string, Map<number, ModuleRef>>();
    const add = (role: string, ref: ModuleRef) => {
      const name = role.trim();
      if (!name) return;
      const refs = roleMap.get(name) || new Map<number, ModuleRef>();
      const existing = refs.get(ref.index);
      if (existing) {
        if (ref.source === 'measured') existing.source = 'measured';
        ref.skills.forEach(s => !existing.skills.includes(s) && existing.skills.push(s));
      } else refs.set(ref.index, { ...ref, skills: [...ref.skills] });
      roleMap.set(name, refs);
    };
    const titleIndex = new Map(modules.map((m, i) => [(m.title || m.name || '').trim(), i]));
    gaps.forEach(g => (g.addressed_by || []).forEach(title => {
      const index = titleIndex.get(title.trim());
      if (index === undefined) return;
      g.positions.forEach(p => add(p, { index, module: modules[index], source: 'measured', skills: [g.skill] }));
    }));
    modules.forEach((module, index) => {
      (module.target_audience || '').split(/[,;/]| et | and /).forEach(r =>
        add(r, { index, module, source: 'declared', skills: [] }));
    });
    const roles = [...roleMap.entries()]
      .map(([role, refs]) => ({ role, refs: [...refs.values()].sort((a, b) => a.index - b.index) }))
      .sort((a, b) => b.refs.filter(r => r.source === 'measured').length - a.refs.filter(r => r.source === 'measured').length || b.refs.length - a.refs.length);
    return { catalogue, roles };
  }, [modules, gaps, fr]);

  if (!modules.length) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />{fr ? 'Catalogue OFPPT des actions du plan' : 'OFPPT catalogue of plan actions'}</CardTitle>
          <CardDescription>{fr ? 'Chaque action classée dans la liste officielle des domaines/thèmes F2 (éligibilité à vérifier).' : 'Each action filed under the official F2 domains/themes (eligibility to verify).'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {catalogue.map(d => (
            <div key={d.domain} className="rounded-lg border p-3">
              <p className="mb-2 text-sm font-semibold text-foreground">{d.code ? `${d.code}. ` : ''}{d.domain}</p>
              <ul className="space-y-1.5">
                {d.items.map(({ index, module }) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium text-foreground">A{index + 1} · {module.title || module.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {[module.ofppt_theme, module.duration, module.delivery_method].filter(Boolean).join(' · ')}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{fr ? 'Modules requis par poste' : 'Modules required per role'}</CardTitle>
          <CardDescription>{fr ? '« Écart mesuré » = issu de l’organigramme ; « À confirmer » = public cible déclaré par le plan.' : '“Measured gap” = from the org chart; “To confirm” = target audience declared by the plan.'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {roles.length ? roles.map(({ role, refs }) => (
            <div key={role} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">{role}</p>
                <Badge variant="secondary">{refs.length} {fr ? 'module(s)' : 'module(s)'}</Badge>
              </div>
              <ul className="space-y-1.5">
                {refs.map(r => (
                  <li key={r.index} className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-foreground">A{r.index + 1} · {r.module.title || r.module.name}</span>
                    {r.module.ofppt_domain_code && <Badge variant="outline" className="text-[10px]">OFPPT {r.module.ofppt_domain_code}</Badge>}
                    <Badge variant={r.source === 'measured' ? 'default' : 'outline'} className="text-[10px]">
                      {r.source === 'measured' ? (fr ? 'Écart mesuré' : 'Measured gap') : (fr ? 'À confirmer' : 'To confirm')}
                    </Badge>
                    {r.skills.length > 0 && <span className="w-full text-xs text-muted-foreground">{r.skills.join(', ')}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground">{fr ? 'Aucun poste identifié : renseignez l’organigramme ou le public cible des actions.' : 'No role identified: fill the org chart or action target audiences.'}</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
