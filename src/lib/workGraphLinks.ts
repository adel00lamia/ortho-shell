// Pure builders for the people → intervention → impact layers of the WorkGraph.
// Links are only created from exact, existing references (names, ids); nothing is guessed.

export type LinkNode = { id: string; label: string; meta: string; parentIds: string[]; risk?: number };
export type HolderPosition = { title: string; current_holder_name?: string | null };
export type DevItem = { id: string; employee_name: string; skill_name: string; lever: string; status: string; action_id: string | null; current_level: number | null; target_level: number | null; achieved_level: number | null };
export type ImpactRow = { id: string; kpi_name: string; unit: string | null; baseline_value: number | null; target_value: number | null; actual_value: number | null; action_id: string | null; direction: string };

const key = (v: string) => v.trim().toLocaleLowerCase();
export const LEVER_LABELS: Record<string, string> = { build: 'Build · former', buy: 'Buy · recruter', borrow: 'Borrow · externe', redeploy: 'Redeploy · redéployer', bot: 'Bot · IA', redesign: 'Redesign · revoir le poste' };

export function personNodes(positions: HolderPosition[], items: DevItem[]): LinkNode[] {
  const map = new Map<string, LinkNode>();
  positions.forEach((p) => {
    const name = p.current_holder_name?.trim();
    if (!name) return;
    const id = `person:${key(name)}`;
    const node = map.get(id) ?? { id, label: name, meta: '', parentIds: [] };
    if (!node.parentIds.includes(`role:${p.title}`)) node.parentIds.push(`role:${p.title}`);
    map.set(id, node);
  });
  items.forEach((i) => {
    const id = `person:${key(i.employee_name)}`;
    if (!map.has(id)) map.set(id, { id, label: i.employee_name, meta: '', parentIds: [], risk: 1 });
  });
  return [...map.values()].map((n) => {
    const count = items.filter((i) => `person:${key(i.employee_name)}` === n.id).length;
    const roleMeta = n.parentIds.length ? n.parentIds.map((r) => r.slice(5)).join(', ') : 'Poste non rattaché';
    return { ...n, meta: `${roleMeta} · ${count} intervention(s)` };
  });
}

export function interventionNodes(items: DevItem[], skillNames: string[]): LinkNode[] {
  const skills = new Map(skillNames.map((s) => [key(s), s]));
  return items.map((i) => {
    const skill = skills.get(key(i.skill_name));
    const parents = [`person:${key(i.employee_name)}`];
    if (skill) parents.push(`skill:${skill}`);
    const levels = i.current_level != null && i.target_level != null ? ` · niv. ${i.achieved_level ?? i.current_level}→${i.target_level}` : '';
    return { id: `intervention:${i.id}`, label: `${i.skill_name} — ${i.employee_name}`, meta: `${LEVER_LABELS[i.lever] ?? i.lever} · ${i.status}${levels}`, parentIds: parents, risk: skill ? 0 : 1 };
  });
}

export function impactProgress(r: ImpactRow): number | null {
  if (r.baseline_value == null || r.target_value == null || r.actual_value == null || r.target_value === r.baseline_value) return null;
  return Math.round(((r.actual_value - r.baseline_value) / (r.target_value - r.baseline_value)) * 100);
}

export function impactNodes(rows: ImpactRow[], items: DevItem[]): LinkNode[] {
  return rows.map((r) => {
    const parents = r.action_id ? items.filter((i) => i.action_id === r.action_id).map((i) => `intervention:${i.id}`) : [];
    const p = impactProgress(r);
    const unit = r.unit ? ` ${r.unit}` : '';
    const values = `${r.baseline_value ?? '?'} → ${r.actual_value ?? 'non mesuré'} (cible ${r.target_value ?? '?'}${unit})`;
    return { id: `impact:${r.id}`, label: r.kpi_name, meta: `${values}${p != null ? ` · ${p} % de l'écart` : ''}${parents.length ? '' : ' · non relié à une intervention'}`, parentIds: parents, risk: parents.length ? 0 : 1 };
  });
}
