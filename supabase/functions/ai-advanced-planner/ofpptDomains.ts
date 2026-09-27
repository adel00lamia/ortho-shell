// Official list of training domains/themes for OFPPT F2 forms (uploaded by the client).
// Only domains 1-14 may appear on F2 forms.
export const OFPPT_F2_DOMAINS: Array<{ code: number; domain: string; themes: string[] }> = [
  { code: 1, domain: 'Gestion des ressources humaines', themes: ['Gestion administrative et statutaire', 'Politique de GRH', 'Conditions de travail', 'Relations sociales', 'Fonction formation', 'Approche générale de la GRH'] },
  { code: 2, domain: 'Management', themes: ['Management stratégique', 'Management organisationnel', 'Management opérationnel', 'Management des personnes et des équipes', 'Approche générale du management'] },
  { code: 3, domain: 'Finances et gestion financière', themes: ['Procédure budgétaire et comptable', 'Gestion et stratégie financière', 'Fiscalité', 'Approche générale des finances'] },
  { code: 4, domain: 'Communication', themes: ['Stratégie de communication', 'Techniques et outils de communication', 'Approche générale de la communication'] },
  { code: 5, domain: "Informatique et systèmes d'information", themes: ["Architecture et administration des systèmes d'information", 'Réseaux et télécommunication', 'Techniques informatiques', 'Bureautique et utilisation des outils informatiques'] },
  { code: 6, domain: 'Sécurité - hygiène', themes: ["Prévention et opération d'incendie et de secours", 'Sûreté et sécurité dans la ville', 'Prévention des risques et gestion des risques technologiques et naturels', 'Prévention et protection du public', 'Sécurité des agents au travail', "Approche générale de la sécurité et de l'hygiène"] },
  { code: 7, domain: 'Commerce et marketing', themes: ['Stratégie marketing et commerciale', 'Technique commerciale et technique de vente', 'Approche générale du commerce et du marketing'] },
  { code: 8, domain: 'Qualité', themes: ['Amélioration de la qualité', 'Assurance qualité', 'Système management qualité', 'Approche qualité totale', 'Approche générale de la qualité'] },
  { code: 9, domain: 'Technique', themes: ['Gestion de la production', "Gestion et maîtrise de l'énergie", 'Gestion de la maintenance', "Approche technique du métier de l'entreprise"] },
  { code: 10, domain: 'Logistique', themes: ['Gestion des approvisionnements', 'Gestion des stocks', 'Gestion des magasins', 'Approche générale de la logistique'] },
  { code: 11, domain: 'Environnement', themes: ["Politique générale d'environnement et de gestion des ressources", 'Résorption des nuisances et pollutions', 'Traitement des eaux usées', 'Collecte, traitement et gestion des déchets', 'Approche générale des déchets'] },
  { code: 12, domain: 'Affaires juridiques', themes: ['Mode et gestion des services publics', 'Achats publics, marchés publics et contrats', 'Assurances', 'Prévention juridique et contentieuse', 'Approche générale du droit'] },
  { code: 13, domain: 'Langues', themes: ['Aspect général des langues', 'Aspect technique et commercial des langues'] },
  { code: 14, domain: 'Alphabétisation fonctionnelle', themes: ['Alphabétisation fonctionnelle'] },
];

export const ofpptDomainsPrompt = OFPPT_F2_DOMAINS
  .map(d => `${d.code}. ${d.domain}: ${d.themes.join(' | ')}`).join('\n');

const norm = (s: unknown) => String(s ?? '').toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();

/** Keeps only a domain/theme pair that exists in the official list; otherwise marks it to classify. */
export function validateOfpptLink(module: Record<string, unknown>) {
  const code = Number(module.ofppt_domain_code);
  const byCode = OFPPT_F2_DOMAINS.find(d => d.code === code);
  const d = byCode ?? OFPPT_F2_DOMAINS.find(x => norm(x.domain) === norm(module.ofppt_domain));
  if (!d) return { ofppt_domain_code: null, ofppt_domain: 'À classer', ofppt_theme: 'À classer', ofppt_verified: false };
  const theme = d.themes.find(t => norm(t) === norm(module.ofppt_theme));
  return { ofppt_domain_code: d.code, ofppt_domain: d.domain, ofppt_theme: theme ?? 'À préciser dans le domaine', ofppt_verified: !!theme };
}
