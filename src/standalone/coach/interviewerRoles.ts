/**
 * Preset recruiter profiles: who is sitting in front of the candidate.
 * Used to steer the kind of questions the simulator asks.
 */
export function interviewerRolePresets(fr: boolean): string[] {
  return fr
    ? [
      'Chargé(e) de recrutement RH',
      'Responsable RH / DRH',
      'Manager opérationnel du poste',
      'Expert technique / chef d’équipe',
      'Directeur général / dirigeant',
      'Cabinet de recrutement externe',
    ]
    : [
      'HR recruiter',
      'HR manager / head of HR',
      'Hiring manager of the role',
      'Technical expert / team lead',
      'CEO / executive',
      'External recruitment agency',
    ];
}
