import { buildOpportunities, computeScenario, domainLabel, domainMaturity, type WorkspaceModel } from './model';

/** Send the entered department model, not private employee records or guessed company facts. */
export function hrTrainingRequest(m: WorkspaceModel) {
  if (!m.company.name.trim() || !m.processes.length || !m.roles.length) {
    throw new Error('Renseignez l’entreprise, au moins un rôle RH et un processus avant de générer le plan.');
  }
  const brief = {
    company: m.company,
    roles: m.roles.map(({ id, title, responsibilities, competencies }) => ({ id, title, responsibilities, competencies })),
    processes: m.processes.map(p => ({
      id: p.id, name: p.name, domain: domainLabel(p.domain),
      owner: m.roles.find(r => r.id === p.ownerRoleId)?.title || 'À désigner',
      evidence: p.evidence || 'Hypothèse non vérifiée', tools: p.tools, bottleneck: p.bottleneck,
      proposedChange: p.proposedChange, trainingGap: p.trainingGap,
      sensitiveDecision: p.sensitive, humanApprover: p.approver,
      baselineKpi: p.baselineKpi, targetKpi: p.targetKpi,
    })),
    maturity: domainMaturity(m.answers),
    opportunities: buildOpportunities(m),
    scenario: { ...computeScenario(m), assumptions: m.scenario },
    roadmap: m.roadmap,
  };
  const context = JSON.stringify(brief);
  if (context.length > 18500) throw new Error('Le modèle est trop détaillé pour cette génération. Réduisez les notes ou le nombre de processus transmis.');
  return {
    requirements: {
      company: m.company.name.slice(0, 200), industry: m.company.sector.slice(0, 100),
      country: 'Maroc', budget: m.scenario.trainingCost, duration: 3,
      objectives: m.roadmap.length ? m.roadmap.slice(0, 40).map(a => `${a.title} — ${a.kpiTarget || 'résultat à valider'}`.slice(0, 1000))
        : ['Développer les compétences RH nécessaires aux changements de processus documentés et à une assistance IA supervisée.'],
      targetSkills: m.roles.map(r => r.competencies).filter(Boolean).slice(0, 80).map(s => s.slice(0, 300)),
      constraints: ['Plan de formation de l’équipe RH uniquement, distinct de la feuille de route de transformation.', 'Les décisions de paie, recrutement, discipline et carrière restent humaines.', 'Ne pas transformer la valeur de capacité simulée en économies cash ou recommander des suppressions de postes.'],
      context: `Modèle RH saisi par le client. Les simulations ne sont pas des résultats mesurés. Relier chaque formation à un processus, un rôle et une difficulté documentée.\n${context}`,
    },
    language: 'fr',
  };
}