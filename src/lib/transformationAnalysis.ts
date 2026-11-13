import { analyseTask, normalizeCriteria, type OperatingMode } from '@/lib/humanAiScoring';

export type TransformationObjective = { id: string; title: string; category: string; priority: number; target_kpi: string | null };
export type TransformationCapability = { id: string; name: string; domain: string | null; current_maturity: number; target_maturity: number };
export type TransformationLink = { id: string; objective_id: string; capability_id: string; criticality: number };
export type TransformationProcess = { id: string; name: string; capability_id: string | null; owner_role: string | null };
export type TransformationTask = { id: string; process_id: string; name: string; role_name: string | null; hours_per_week: number; criteria: unknown };

export type TransformationSnapshot = {
  objectives: TransformationObjective[];
  capabilities: TransformationCapability[];
  links: TransformationLink[];
  processes: TransformationProcess[];
  tasks: TransformationTask[];
};

export type TransformationInsight = {
  id: string;
  severity: 'critical' | 'attention' | 'opportunity';
  title: string;
  detail: string;
  sourceIds: string[];
};

export function buildTransformationInsights(snapshot: TransformationSnapshot, fr = true): TransformationInsight[] {
  const { objectives, capabilities, links, processes, tasks } = snapshot;
  const insights: TransformationInsight[] = [];
  const orphanObjectives = objectives.filter((objective) => !links.some((link) => link.objective_id === objective.id));
  const highGaps = capabilities.filter((capability) => capability.target_maturity - capability.current_maturity >= 2);
  const orphanCapabilities = capabilities.filter((capability) => !processes.some((process) => process.capability_id === capability.id));
  const unownedTasks = tasks.filter((task) => !task.role_name?.trim());
  const aiCandidates = tasks
    .map((task) => ({ task, analysis: analyseTask(task.criteria, Number(task.hours_per_week)) }))
    .filter(({ analysis }) => analysis.mode !== 'human_only')
    .sort((a, b) => b.analysis.priority - a.analysis.priority);

  if (orphanObjectives.length) insights.push({
    id: 'orphan-objectives', severity: 'critical', sourceIds: orphanObjectives.map((item) => item.id),
    title: fr ? `${orphanObjectives.length} objectif(s) sans capacité` : `${orphanObjectives.length} objective(s) without capability`,
    detail: fr ? 'La stratégie ne peut pas encore être tracée jusqu’à l’exécution.' : 'Strategy cannot yet be traced to execution.',
  });
  if (highGaps.length) insights.push({
    id: 'maturity-gaps', severity: 'attention', sourceIds: highGaps.map((item) => item.id),
    title: fr ? `${highGaps.length} capacité(s) avec un écart critique` : `${highGaps.length} capabilities with a critical gap`,
    detail: fr ? 'Prioriser les capacités dont l’écart de maturité est supérieur ou égal à deux niveaux.' : 'Prioritize capabilities whose maturity gap is at least two levels.',
  });
  if (orphanCapabilities.length) insights.push({
    id: 'orphan-capabilities', severity: 'attention', sourceIds: orphanCapabilities.map((item) => item.id),
    title: fr ? `${orphanCapabilities.length} capacité(s) sans processus` : `${orphanCapabilities.length} capabilities without process`,
    detail: fr ? 'Le passage de la capacité au travail réel reste incomplet.' : 'The path from capability to real work remains incomplete.',
  });
  if (unownedTasks.length) insights.push({
    id: 'unowned-tasks', severity: 'attention', sourceIds: unownedTasks.map((item) => item.id),
    title: fr ? `${unownedTasks.length} tâche(s) sans rôle responsable` : `${unownedTasks.length} tasks without an accountable role`,
    detail: fr ? 'Attribuer un rôle avant de décider d’un redéploiement ou d’une automatisation.' : 'Assign a role before deciding on redeployment or automation.',
  });
  if (aiCandidates.length) insights.push({
    id: 'ai-candidates', severity: 'opportunity', sourceIds: aiCandidates.slice(0, 5).map(({ task }) => task.id),
    title: fr ? `${aiCandidates.length} tâche(s) éligible(s) à Humain + IA` : `${aiCandidates.length} Human + AI eligible tasks`,
    detail: fr ? `${aiCandidates.reduce((sum, item) => sum + item.analysis.capacityGain, 0).toFixed(1)} h/semaine potentiellement libérables, estimation à valider.` : `${aiCandidates.reduce((sum, item) => sum + item.analysis.capacityGain, 0).toFixed(1)} hours/week potentially released, estimate to validate.`,
  });
  return insights;
}

export function getOperatingModeCounts(tasks: TransformationTask[]) {
  const counts: Record<OperatingMode, number> = { human_only: 0, human_ai: 0, ai_approval: 0, ai_autonomous: 0, automation: 0 };
  tasks.forEach((task) => { counts[analyseTask(task.criteria).mode] += 1; });
  return counts;
}

export function getRoleRisk(tasks: TransformationTask[]) {
  const grouped = new Map<string, TransformationTask[]>();
  tasks.forEach((task) => {
    const role = task.role_name?.trim() || 'Non affecté';
    grouped.set(role, [...(grouped.get(role) ?? []), task]);
  });
  return [...grouped.entries()].map(([role, roleTasks]) => {
    const totalHours = roleTasks.reduce((sum, task) => sum + Number(task.hours_per_week || 0), 0) || 1;
    const exposure = Math.round(roleTasks.reduce((sum, task) => sum + analyseTask(task.criteria).aiSuitability * Number(task.hours_per_week || 0), 0) / totalHours);
    const judgment = Math.round(roleTasks.reduce((sum, task) => sum + normalizeCriteria(task.criteria).judgment * Number(task.hours_per_week || 0), 0) / totalHours * 20);
    return { role, exposure, judgment, taskCount: roleTasks.length };
  }).sort((a, b) => b.exposure - a.exposure);
}