import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { GeneratedPlan, PlanRequirements, ReportMeta } from '@/types/trainingPlan';

const NAVY = [0, 43, 73] as const;
const INK = [27, 37, 48] as const;
const MUTED = [93, 105, 116] as const;
const LINE = [210, 216, 223] as const;
const PAPER = [248, 250, 252] as const;
const AMBER = [180, 120, 20] as const;
const GREEN = [28, 122, 87] as const;
const BLUE = [35, 101, 145] as const;
const RED = [164, 62, 62] as const;
const SOFT_GREEN = [238, 247, 243] as const;
const SOFT_AMBER = [252, 247, 232] as const;
const SOFT_BLUE = [238, 245, 250] as const;
const SOFT_RED = [252, 240, 240] as const;

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const formatDate = (date: Date) => `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
const formatMonthYear = (date: Date) => `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
const formatMoney = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value).replace(/[\u00a0\u202f]/g, ' ')} MAD`;
const labelize = (value: string) => value.replace(/_/g, ' ').replace(/^./, char => char.toUpperCase());
const textOr = (value: unknown, fallback = 'À confirmer') => typeof value === 'string' && value.trim() ? value.trim() : fallback;

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + Math.max(1, months));
  return result;
};

const getMeta = (plan: GeneratedPlan, requirements: PlanRequirements, generatedAt: Date): ReportMeta => {
  const start = plan.report_meta?.plan_start_date ? new Date(plan.report_meta.plan_start_date) : generatedAt;
  const end = plan.report_meta?.plan_end_date ? new Date(plan.report_meta.plan_end_date) : addMonths(start, requirements.duration);
  return {
    company: plan.report_meta?.company?.trim() || requirements.company.trim() || 'Entreprise à confirmer',
    country: plan.report_meta?.country?.trim() || requirements.country.trim() || 'Maroc',
    industry: plan.report_meta?.industry?.trim() || requirements.industry.trim() || 'Secteur à confirmer',
    generated_at: plan.report_meta?.generated_at || generatedAt.toISOString(),
    plan_start_date: start.toISOString(),
    plan_end_date: end.toISOString(),
    data_status: 'provided_and_ai_synthesized',
  };
};

export const createPlanPDF = (
  plan: GeneratedPlan,
  requirements: PlanRequirements,
  generatedAt = new Date(),
) => {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = width - margin * 2;
  const meta = getMeta(plan, requirements, generatedAt);
  // Real company data read from the client's own records — no AI-generated figure here.
  const facts = requirements.companyData;
  const issuedAt = new Date(meta.generated_at);
  const startsAt = new Date(meta.plan_start_date);
  const endsAt = new Date(meta.plan_end_date);
  let y = 20;

  const safe = (value: unknown) => textOr(value);
  const ensureSpace = (space: number) => {
    if (y + space > height - 22) {
      doc.addPage();
      y = 22;
    }
  };
  const section = (number: string, title: string, subtitle?: string, minimumBodySpace = 32) => {
    ensureSpace((subtitle ? 27 : 20) + minimumBodySpace);
    doc.setFillColor(...NAVY);
    doc.rect(margin, y - 4, 4, 14, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(number, margin + 9, y);
    doc.setFontSize(15);
    doc.setTextColor(...NAVY);
    doc.text(title, margin + 9, y + 7);
    y += 14;
    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(subtitle, margin + 9, y);
      y += 7;
    }
    doc.setDrawColor(...LINE);
    doc.line(margin, y, width - margin, y);
    y += 8;
  };
  const subheading = (title: string) => {
    ensureSpace(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...NAVY);
    doc.text(title, margin, y);
    y += 7;
  };
  const paragraph = (value: unknown, indent = 0) => {
    const lines = doc.splitTextToSize(safe(value), contentWidth - indent - 4);
    ensureSpace(lines.length * 5 + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...INK);
    doc.text(lines, margin + indent, y);
    y += lines.length * 5 + 5;
  };
  const bullets = (items: unknown[] | undefined) => {
    (items || []).filter(Boolean).forEach(item => {
      const lines = doc.splitTextToSize(safe(item), contentWidth - 10);
      ensureSpace(lines.length * 5 + 3);
      doc.setFillColor(...NAVY);
      doc.circle(margin + 2, y - 1.2, 0.8, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.2);
      doc.setTextColor(...INK);
      doc.text(lines, margin + 7, y);
      y += lines.length * 5 + 3;
    });
    y += 2;
  };
  const badge = (label: string, tone: 'source' | 'calculation' | 'assumption') => {
    const colors: readonly [number, number, number] = tone === 'source' ? GREEN : tone === 'calculation' ? NAVY : AMBER;
    const badgeWidth = doc.getTextWidth(label) + 8;
    doc.setDrawColor(...colors);
    doc.setFillColor(...PAPER);
    doc.roundedRect(margin, y - 4, badgeWidth, 7, 1, 1, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...colors);
    doc.text(label, margin + 4, y + 0.5);
    y += 10;
  };
  const metricStrip = (items: Array<{ value: string; label: string; status: string }>) => {
    ensureSpace(28);
    const gap = 4;
    const itemWidth = (contentWidth - gap * (items.length - 1)) / items.length;
    items.forEach((item, index) => {
      const x = margin + index * (itemWidth + gap);
      doc.setDrawColor(...LINE);
      doc.setFillColor(...PAPER);
      doc.rect(x, y, itemWidth, 23, 'FD');
      doc.setFillColor(...NAVY);
      doc.rect(x, y, 2, 23, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(...NAVY);
      doc.text(item.value, x + 6, y + 9);
      doc.setFontSize(7);
      doc.setTextColor(...INK);
      doc.text(item.label.toUpperCase(), x + 6, y + 15.5, { maxWidth: itemWidth - 10 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.4);
      doc.setTextColor(...MUTED);
      doc.text(item.status, x + 6, y + 20.5, { maxWidth: itemWidth - 10 });
    });
    y += 31;
  };
  const horizontalBars = (items: Array<{ label: string; value: number; display: string }>, color: readonly [number, number, number] = NAVY) => {
    const usable = items.filter(item => Number.isFinite(item.value) && item.value >= 0).slice(0, 8);
    if (!usable.length) return;
    const maximum = Math.max(...usable.map(item => item.value), 1);
    ensureSpace(usable.length * 9 + 8);
    usable.forEach(item => {
      const label = doc.splitTextToSize(item.label, 42)[0] || item.label;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...INK);
      doc.text(label, margin, y + 3);
      doc.setFillColor(...PAPER);
      doc.rect(margin + 47, y, 86, 4, 'F');
      doc.setFillColor(...color);
      doc.rect(margin + 47, y, 86 * (item.value / maximum), 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...NAVY);
      doc.text(item.display, width - margin, y + 3.2, { align: 'right' });
      y += 9;
    });
    y += 4;
  };
  const numbered = (items: string[] | undefined) => (items || []).filter(Boolean).map((item, index) => `${String(index + 1).padStart(2, '0')}  ${item}`);

  // Cover — restrained consulting direction selected by the user.
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, width, 4, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...NAVY);
  doc.setFontSize(9);
  doc.text(meta.company.toUpperCase(), margin, 31);
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.7);
  doc.line(margin, 39, margin + 18, 39);
  doc.setFontSize(27);
  doc.setTextColor(...INK);
  const titleLines = doc.splitTextToSize('Plan de développement des compétences', contentWidth - 10);
  doc.text(titleLines, margin, 63);
  const titleBottom = 63 + titleLines.length * 11;
  doc.setFillColor(...PAPER);
  doc.rect(margin, titleBottom + 5, 77, 10, 'F');
  doc.setFillColor(...NAVY);
  doc.rect(margin, titleBottom + 5, 3, 10, 'F');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`PÉRIODE  ${formatMonthYear(startsAt).toUpperCase()} — ${formatMonthYear(endsAt).toUpperCase()}`, margin + 7, titleBottom + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED);
  const coverDescription = doc.splitTextToSize(
    `Rapport stratégique d'ingénierie de formation pour ${meta.company}, secteur ${meta.industry}.`,
    contentWidth - 20,
  );
  doc.text(coverDescription, margin, titleBottom + 38);
  doc.setFillColor(...PAPER);
  doc.rect(0, 212, width, height - 212, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('STATUT DU DOCUMENT', margin, 229);
  doc.text("DATE D'ÉMISSION", 83, 229);
  doc.text('PÉRIMÈTRE', 145, 229);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text('Pour validation', margin, 236);
  doc.text(formatDate(issuedAt), 83, 236);
  doc.text(`${meta.country} · ${meta.industry}`, 145, 236, { maxWidth: 47 });
  doc.setDrawColor(...LINE);
  doc.line(margin, 250, width - margin, 250);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...MUTED);
  doc.text('RÉFÉRENCES À VÉRIFIER', margin, 261);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...INK);
  doc.text('CSF / OFPPT · Éligibilité et taux non garantis', margin, 268);
  doc.setTextColor(...NAVY);
  doc.text('CONFIDENTIEL', width - margin, 268, { align: 'right' });

  // Executive decision brief.
  doc.addPage();
  y = 22;
  section('01', 'Synthèse décisionnelle', 'Les éléments chiffrés non fournis sont signalés comme hypothèses à valider.');
  badge('SYNTHÈSE IA À VALIDER', 'assumption');
  metricStrip([
    { value: String(plan.modules?.length || 0), label: 'Actions proposées', status: 'Calcul sur le plan généré' },
    { value: `${requirements.duration} mois`, label: 'Horizon du plan', status: 'Donnée fournie' },
    { value: requirements.budget > 0 ? formatMoney(requirements.budget) : 'À chiffrer', label: 'Budget plafond', status: requirements.budget > 0 ? 'Donnée fournie' : 'À valider' },
  ]);
  paragraph(plan.executive_summary || plan.description);
  subheading('Décisions proposées');
  bullets((plan.recommendations || []).slice(0, 5));
  subheading('Paramètres validés de la demande');
  autoTable(doc, {
    startY: y,
    head: [['Paramètre', 'Valeur', 'Statut']],
    body: [
      ['Entreprise', meta.company, 'Donnée fournie'],
      ['Période', `${formatDate(startsAt)} — ${formatDate(endsAt)}`, 'Calcul'],
      ['Durée', `${requirements.duration} mois`, 'Donnée fournie'],
      ['Budget plafond', requirements.budget > 0 ? formatMoney(requirements.budget) : 'À chiffrer', requirements.budget > 0 ? 'Donnée fournie' : 'À valider'],
      [
        'Effectif couvert',
        facts?.headcount ? `${facts.headcount} salariés` : (requirements.companySize || 'À confirmer'),
        facts?.headcountSource === 'employee_records' ? 'Fiches salariés internes' : facts?.headcount ? 'Profil entreprise' : requirements.companySize ? 'Donnée fournie' : 'À valider',
      ],
    ],
    theme: 'plain',
    headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
    bodyStyles: { textColor: [...INK], lineColor: [...LINE], lineWidth: { bottom: 0.1 } },
    columnStyles: { 0: { cellWidth: 42, fontStyle: 'bold' }, 2: { cellWidth: 34 } },
    margin: { left: margin, right: margin },
    styles: { fontSize: 8.5, cellPadding: 3 },
  });
  y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;

  section('02', 'Diagnostic des besoins', 'Traçabilité entre les besoins exprimés et le portefeuille proposé.');
  badge('DONNÉES FOURNIES', 'source');
  subheading('Objectifs déclarés');
  bullets(requirements.objectives.length ? requirements.objectives : ['Objectifs détaillés à confirmer avec la direction.']);
  subheading('Compétences cibles');
  bullets(requirements.targetSkills.length ? requirements.targetSkills : ['Référentiel de compétences à consolider.']);
  subheading('Contraintes de mise en œuvre');
  bullets(requirements.constraints.length ? requirements.constraints : ['Contraintes opérationnelles à documenter avant lancement.']);
  if (requirements.context) {
    subheading('Contexte fourni');
    paragraph(requirements.context);
  }

  if (facts) {
    const tableBase = {
      theme: 'plain' as const,
      headStyles: { fillColor: [...NAVY] as [number, number, number], textColor: 255, fontStyle: 'bold' as const },
      bodyStyles: { textColor: [...INK] as [number, number, number], lineColor: [...LINE] as [number, number, number], lineWidth: { bottom: 0.1 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 8, cellPadding: 2.6, overflow: 'linebreak' as const },
    };
    const advance = () => { y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 8; };

    section('02A', 'Données réelles de l’entreprise', 'Effectifs, postes, compétences évaluées, budget et taux issus de vos propres enregistrements.', 48);
    badge(facts.headcountSource === 'employee_records' ? 'DONNÉES INTERNES VÉRIFIÉES' : 'DONNÉES INTERNES PARTIELLES', 'source');
    metricStrip([
      {
        value: facts.headcount ? String(facts.headcount) : 'À confirmer',
        label: 'Effectif couvert',
        status: facts.headcountSource === 'employee_records' ? 'Fiches salariés' : facts.headcountSource === 'declared_profile' ? 'Profil déclaré' : 'Non renseigné',
      },
      { value: facts.departments.length ? String(facts.departments.length) : 'À confirmer', label: 'Départements', status: 'Enregistrements internes' },
      { value: facts.skills.length ? String(facts.skills.length) : 'À confirmer', label: 'Compétences évaluées', status: 'Évaluations internes' },
    ]);

    subheading('Répartition des effectifs par département');
    if (facts.departments.length) {
      autoTable(doc, {
        ...tableBase,
        startY: y,
        head: [['Département', 'Effectif', 'Part']],
        body: facts.departments.slice(0, 15).map(dept => {
          const total = facts.headcount || facts.departments.reduce((sum, d) => sum + d.headcount, 0);
          return [dept.name, String(dept.headcount), total > 0 ? `${Math.round((dept.headcount / total) * 100)} %` : 'À confirmer'];
        }),
        columnStyles: { 0: { cellWidth: 100 }, 1: { halign: 'right', cellWidth: 24 }, 2: { halign: 'right', cellWidth: 24 } },
      });
      advance();
    } else {
      paragraph('Aucune fiche salarié enregistrée. Renseignez les effectifs dans l’espace entreprise pour supprimer cette mention.');
    }

    subheading('Postes recensés');
    if (facts.positions.length) {
      autoTable(doc, {
        ...tableBase,
        startY: y,
        head: [['Poste', 'Titulaires', 'Criticité']],
        body: facts.positions.map(position => [position.title, String(position.headcount), position.isCritical ? 'Poste critique' : '—']),
        columnStyles: { 0: { cellWidth: 96 }, 1: { halign: 'right', cellWidth: 24 }, 2: { cellWidth: 28 } },
      });
      advance();
    } else {
      paragraph('Aucun poste enregistré. Les fiches de poste restent à documenter.');
    }

    subheading('Niveaux de compétences actuels et cibles');
    if (facts.skills.length) {
      autoTable(doc, {
        ...tableBase,
        startY: y,
        head: [['Compétence', 'Niveau actuel', 'Niveau cible', 'Écart', 'Salariés évalués']],
        body: facts.skills.map(skill => [
          skill.name,
          skill.currentLevel !== undefined ? `${skill.currentLevel}${skill.maxLevel ? ` / ${skill.maxLevel}` : ''}` : 'À confirmer',
          skill.targetLevel !== undefined ? `${skill.targetLevel}${skill.maxLevel ? ` / ${skill.maxLevel}` : ''}` : 'À confirmer',
          skill.gap !== undefined ? String(skill.gap) : 'À confirmer',
          String(skill.assessedEmployees ?? 0),
        ]),
        columnStyles: { 0: { cellWidth: 56 }, 1: { halign: 'right', cellWidth: 24 }, 2: { halign: 'right', cellWidth: 24 }, 3: { halign: 'right', cellWidth: 18 }, 4: { halign: 'right', cellWidth: 24 } },
      });
      advance();
      const gapped = facts.skills.filter(skill => (skill.gap ?? 0) > 0).slice(0, 8);
      if (gapped.length) {
        subheading('Écarts de compétences mesurés');
        horizontalBars(gapped.map(skill => ({ label: skill.name, value: skill.gap as number, display: `${skill.gap} niveau(x)` })), RED);
      }
    } else {
      paragraph('Aucune évaluation de compétences enregistrée. Les niveaux actuels restent à mesurer avant arbitrage.');
    }

    subheading('Budget formation et cadre de financement');
    autoTable(doc, {
      ...tableBase,
      startY: y,
      head: [['Élément', 'Valeur', 'Source']],
      body: [
        [
          'Budget formation enregistré',
          facts.trainingBudget ? formatMoney(facts.trainingBudget.amount) : 'À confirmer',
          facts.trainingBudget ? (facts.trainingBudget.source === 'ingenierie_de_formation' ? 'Dossier d’ingénierie' : 'Plan de formation') : 'Non renseigné',
        ],
        [
          'Masse salariale brute annuelle',
          facts.payroll ? `${formatMoney(facts.payroll.grossAnnual)} (${facts.payroll.exerciseYear})` : 'À confirmer',
          facts.payroll ? 'Dossier d’ingénierie' : 'Non renseigné',
        ],
        [
          'Taxe de formation professionnelle (TFP)',
          facts.csf?.tfpAmount ? formatMoney(facts.csf.tfpAmount) : 'À confirmer',
          facts.csf?.tfpAmount ? 'Dossier d’ingénierie' : 'Non renseigné',
        ],
        [
          'Taux CSF — action planifiée',
          facts.csf?.plannedRate !== undefined ? `${Math.round(facts.csf.plannedRate * 1000) / 10} %` : 'À confirmer',
          'Taux de référence à vérifier',
        ],
        [
          'Taux CSF — action non planifiée',
          facts.csf?.unplannedRate !== undefined ? `${Math.round(facts.csf.unplannedRate * 1000) / 10} %` : 'À confirmer',
          'Taux de référence à vérifier',
        ],
        [
          'Plafond horaire par participant',
          facts.csf?.hourlyCapPerPerson != null ? `${facts.csf.hourlyCapPerPerson} MAD / h` : 'À confirmer',
          'Taux de référence à vérifier',
        ],
      ],
      columnStyles: { 0: { cellWidth: 58, fontStyle: 'bold' }, 1: { cellWidth: 48 }, 2: { cellWidth: 42 } },
    });
    advance();
    paragraph('Les taux et plafonds ci-dessus sont des références paramétrables non vérifiées : ils doivent être confirmés auprès de l’OFPPT avant tout engagement. Aucun droit à remboursement n’est garanti par ce rapport.');
  }

  if (plan.training_axes?.length) {
    section('02B', 'Axes d’ingénierie de formation', 'Lecture structurée des difficultés, compétences, objectifs et mesures d’accompagnement.', 52);
    plan.training_axes.forEach((axis, index) => {
      ensureSpace(38);
      subheading(`${String(index + 1).padStart(2, '0')} · ${safe(axis.name)}`);
      if (axis.rationale) paragraph(axis.rationale);
      autoTable(doc, {
        startY: y,
        head: [['Difficultés / constats', 'Compétences cibles', 'Objectifs opérationnels', 'Accompagnement']],
        body: [[
          numbered(axis.observed_difficulties).join('\n') || 'À confirmer',
          numbered(axis.target_competencies).join('\n') || 'À confirmer',
          numbered(axis.operational_objectives).join('\n') || 'À valider',
          numbered(axis.support_measures).join('\n') || 'À définir',
        ]],
        theme: 'grid',
        headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...PAPER] },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 38 }, 2: { cellWidth: 42 }, 3: { cellWidth: 38 } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.2, cellPadding: 3, valign: 'top', lineColor: [...LINE], overflow: 'linebreak' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 8;
    });
  }

  if (plan.modules?.length) {
    section('03', 'Portefeuille de formation priorisé', 'Chaque action doit être validée avec son sponsor, sa population et son résultat attendu.');
    autoTable(doc, {
      startY: y,
      head: [['#', 'Action / axe', 'Public / niveau', 'Modalité', 'Période', 'Budget']],
      body: plan.modules.map((module, index) => [
        String(index + 1),
        `${safe(module.title || module.name)}\n${textOr(module.training_axis, 'Axe à confirmer')}`,
        `${textOr(module.target_audience)}\n${textOr(module.certification_level)}`,
        textOr(module.delivery_method || module.type),
        `${textOr(module.duration)}\n${textOr(module.planned_period, 'À planifier')}`,
        typeof module.estimated_cost === 'number' ? formatMoney(module.estimated_cost) : 'À chiffrer',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: [...INK], lineColor: [...LINE] },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 48 }, 2: { cellWidth: 34 }, 3: { cellWidth: 22 }, 4: { cellWidth: 19 }, 5: { cellWidth: 27 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
    plan.modules.forEach((module, index) => {
      ensureSpace(72);
      subheading(`Fiche-action ${String(index + 1).padStart(2, '0')} · ${safe(module.title || module.name)}`);
      badge(textOr(module.priority, 'PRIORITÉ À ARBITRER').toUpperCase(), 'assumption');
      paragraph(module.description);
      autoTable(doc, {
        startY: y,
        head: [['Axe', 'Public', 'Modalité', 'Durée / période', 'Responsable']],
        body: [[
          textOr(module.training_axis),
          textOr(module.target_audience),
          textOr(module.delivery_method || module.type),
          `${textOr(module.duration)}\n${textOr(module.planned_period, 'À planifier')}`,
          textOr(module.accountable_owner),
        ]],
        theme: 'plain',
        headStyles: { fillColor: [...NAVY], textColor: 255 },
        bodyStyles: { fillColor: [...PAPER], textColor: [...INK] },
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.3, cellPadding: 2.5, overflow: 'linebreak', valign: 'top' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 5;
      autoTable(doc, {
        startY: y,
        head: [['Difficulté constatée', 'Objectifs pédagogiques', 'Contenu / séquences']],
        body: [[
          textOr(module.observed_difficulty),
          numbered(module.learning_objectives).join('\n') || 'À préciser',
          numbered(module.content_outline).join('\n') || 'À concevoir',
        ]],
        theme: 'grid',
        headStyles: { fillColor: [...BLUE], textColor: 255 },
        alternateRowStyles: { fillColor: [...PAPER] },
        columnStyles: { 0: { cellWidth: 46 }, 1: { cellWidth: 56 }, 2: { cellWidth: 56 } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.2, cellPadding: 3, overflow: 'linebreak', valign: 'top', lineColor: [...LINE] },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 4;
      autoTable(doc, {
        startY: y,
        head: [['Évaluation', 'Transfert en poste', 'Mesures d’accompagnement', 'Programmation']],
        body: [[
          numbered(module.assessment_methods).join('\n') || 'À définir',
          numbered(module.workplace_transfer).join('\n') || 'À définir',
          numbered(module.support_measures).join('\n') || 'À définir',
          `Groupes : ${typeof module.group_count === 'number' ? module.group_count : 'À planifier'}\nParticipants : ${typeof module.participant_count === 'number' ? module.participant_count : 'À confirmer'}\nPrestataire : ${textOr(module.provider, 'À sélectionner')}\nCoût : ${typeof module.estimated_cost === 'number' ? formatMoney(module.estimated_cost) : 'À chiffrer'}`,
        ]],
        theme: 'grid',
        headStyles: { fillColor: [...NAVY], textColor: 255 },
        alternateRowStyles: { fillColor: [...PAPER] },
        columnStyles: { 0: { cellWidth: 37 }, 1: { cellWidth: 41 }, 2: { cellWidth: 41 }, 3: { cellWidth: 39 } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak', valign: 'top', lineColor: [...LINE] },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
    });
  }

  if (plan.implementation_roadmap?.phases?.length) {
    section('04', 'Feuille de route de mise en œuvre', `${formatMonthYear(startsAt)} — ${formatMonthYear(endsAt)}`);
    const phases = plan.implementation_roadmap.phases;
    ensureSpace(24);
    const phaseGap = 2;
    const phaseWidth = (contentWidth - phaseGap * (phases.length - 1)) / phases.length;
    phases.forEach((phase, index) => {
      const x = margin + index * (phaseWidth + phaseGap);
      const phaseColor: readonly [number, number, number] = index % 2 === 0 ? NAVY : BLUE;
      doc.setFillColor(...phaseColor);
      doc.rect(x, y, phaseWidth, 12, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(255, 255, 255);
      doc.text(`${index + 1}. ${safe(phase.name)}`, x + 3, y + 5, { maxWidth: phaseWidth - 6 });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.text(safe(phase.duration), x + 3, y + 9.5, { maxWidth: phaseWidth - 6 });
    });
    y += 19;
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Fenêtre', 'Activités clés', 'Livrables', 'Responsable']],
      body: plan.implementation_roadmap.phases.map(phase => [
        safe(phase.name), safe(phase.duration), (phase.activities || []).join('\n• '), (phase.deliverables || []).join('\n• '), textOr(phase.owner),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255 },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 30, fontStyle: 'bold' }, 1: { cellWidth: 21 }, 2: { cellWidth: 44 }, 3: { cellWidth: 40 }, 4: { cellWidth: 23 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.2, cellPadding: 2.5, valign: 'top' },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
  }

  section('05', 'Budget et principes économiques', 'Le budget affiché est un plafond de cadrage, pas une promesse de remboursement.');
  badge(requirements.budget > 0 ? 'BUDGET FOURNI' : 'HYPOTHÈSE À VALIDER', requirements.budget > 0 ? 'source' : 'assumption');
  const budgetRows = Object.entries(plan.budget_breakdown || {})
    .filter(([, value]) => typeof value === 'number')
    .map(([key, value]) => [labelize(key), formatMoney(value as number)]);
  const calculatedTotal = Object.values(plan.budget_breakdown || {}).reduce<number>((sum, value) => sum + (typeof value === 'number' ? value : 0), 0);
  if (budgetRows.length) {
    subheading('Répartition du budget proposé');
    horizontalBars(
      Object.entries(plan.budget_breakdown || {})
        .filter(([, value]) => typeof value === 'number')
        .map(([key, value]) => ({ label: labelize(key), value: value as number, display: formatMoney(value as number) })),
      BLUE,
    );
    budgetRows.push(['TOTAL CALCULÉ', formatMoney(calculatedTotal)]);
    autoTable(doc, {
      startY: y,
      head: [['Poste', 'Montant']],
      body: budgetRows,
      theme: 'plain',
      headStyles: { fillColor: [...NAVY], textColor: 255 },
      bodyStyles: { lineColor: [...LINE], lineWidth: { bottom: 0.1 } },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 8.5, cellPadding: 3 },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 7;
    if (requirements.budget > 0 && calculatedTotal !== requirements.budget) {
      paragraph(`Point de contrôle : le total proposé (${formatMoney(calculatedTotal)}) diffère du budget plafond (${formatMoney(requirements.budget)}). Arbitrage requis avant validation.`);
    }
  } else {
    paragraph('Aucune ventilation budgétaire exploitable. Les coûts restent à chiffrer avant décision.');
  }
  paragraph("Les dispositifs CSF/GIAC/OFPPT sont présentés comme pistes de financement. L'éligibilité, les plafonds et les taux doivent être confirmés sur pièces auprès des organismes compétents.");

  if (plan.kpis?.length) {
    section('06', 'Pilotage de la performance', 'Les baselines absentes doivent être mesurées avant le démarrage.', 48);
    autoTable(doc, {
      startY: y,
      head: [['Indicateur', 'Baseline', 'Cible', 'Fréquence', 'Source / responsable']],
      body: plan.kpis.map(kpi => [
        safe(kpi.name), textOr(kpi.baseline, 'À mesurer'), textOr(kpi.target, 'À valider'), textOr(kpi.measurement_frequency), `${textOr(kpi.source)} / ${textOr(kpi.owner)}`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255 },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 39, fontStyle: 'bold' }, 1: { cellWidth: 27 }, 2: { cellWidth: 30 }, 3: { cellWidth: 25 }, 4: { cellWidth: 37 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
  }

  if (plan.evidence_register?.length) {
    section('06B', 'Dispositif de preuve et d’évaluation', 'Éléments à collecter avant, pendant et après la formation.', 48);
    autoTable(doc, {
      startY: y,
      head: [['Preuve attendue', 'Source', 'Responsable', 'Moment', 'Statut']],
      body: plan.evidence_register.map(item => [
        safe(item.evidence), textOr(item.source), textOr(item.owner), textOr(item.timing), textOr(item.status, 'À collecter'),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255 },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 52, fontStyle: 'bold' }, 1: { cellWidth: 30 }, 2: { cellWidth: 29 }, 3: { cellWidth: 23 }, 4: { cellWidth: 24 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.3, cellPadding: 2.8, overflow: 'linebreak', valign: 'top' },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
  }

  section('07', 'Gouvernance, risques et arbitrages', undefined, 70);
  subheading('Gouvernance recommandée');
  bullets([
    'Sponsor de direction : valide les priorités, le budget et les arbitrages.',
    'Direction RH / Formation : pilote le portefeuille, les prestataires et la conformité documentaire.',
    'Managers opérationnels : libèrent les participants et valident le transfert en situation de travail.',
    'Revue mensuelle : avancement, consommation budgétaire, risques et décisions correctives.',
  ]);
  if (plan.risk_assessment) {
    subheading('Risques prioritaires');
    bullets([...(plan.risk_assessment.high_risks || []), ...(plan.risk_assessment.medium_risks || [])]);
    subheading('Mesures de maîtrise');
    bullets(plan.risk_assessment.mitigation_strategies);
  }

  if (plan.regulatory_framework) {
    if (y > 115) {
      doc.addPage();
      y = 22;
    }
    section('08', 'Cadre réglementaire et financement', 'Référentiel indicatif — validation documentaire obligatoire.');
    badge('À VÉRIFIER AUPRÈS DES ORGANISMES COMPÉTENTS', 'assumption');
    subheading('Organismes et références');
    bullets(plan.regulatory_framework.governing_bodies);
    bullets(plan.regulatory_framework.key_regulations);
    subheading('Pistes de financement');
    bullets(plan.regulatory_framework.funding_programs);
    subheading('Liste de contrôle');
    bullets(plan.regulatory_framework.compliance_checklist);
  }

  const hasAppendix = Boolean(plan.swot_analysis || plan.pestel_analysis || plan.market_research);
  if (hasAppendix) {
    if (y > 70) {
      doc.addPage();
      y = 22;
    }
    section('A', 'Exhibits analytiques', 'Analyses générées par IA à confronter aux données internes et à des sources datées.');
    badge('HYPOTHÈSES À VALIDER', 'assumption');
    if (plan.swot_analysis) {
      subheading('Exhibit A1 — Matrice SWOT analytique');
      const swot = plan.swot_analysis;
      autoTable(doc, {
        startY: y,
        head: [['INTERNE · Capacités à exploiter', 'INTERNE · Fragilités à traiter']],
        body: [[numbered(swot.strengths).join('\n'), numbered(swot.weaknesses).join('\n')]],
        foot: [['EXTERNE · Opportunités à saisir', 'EXTERNE · Menaces à anticiper']],
        theme: 'grid',
        headStyles: { fillColor: [...GREEN], textColor: 255, fontStyle: 'bold', cellPadding: 3 },
        footStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold', cellPadding: 3 },
        bodyStyles: { minCellHeight: 35, valign: 'top', textColor: [...INK], cellPadding: 4 },
        columnStyles: { 0: { fillColor: [...SOFT_GREEN], cellWidth: contentWidth / 2 }, 1: { fillColor: [...SOFT_AMBER], cellWidth: contentWidth / 2 } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, lineColor: [...LINE], lineWidth: 0.2, overflow: 'linebreak' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 2;
      autoTable(doc, {
        startY: y,
        body: [[numbered(swot.opportunities).join('\n'), numbered(swot.threats).join('\n')]],
        theme: 'grid',
        bodyStyles: { minCellHeight: 35, valign: 'top', textColor: [...INK], cellPadding: 4 },
        columnStyles: { 0: { fillColor: [...SOFT_BLUE], cellWidth: contentWidth / 2 }, 1: { fillColor: [...SOFT_RED], cellWidth: contentWidth / 2 } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, lineColor: [...LINE], lineWidth: 0.2, overflow: 'linebreak' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 8;
      autoTable(doc, {
        startY: y,
        head: [['Lecture stratégique', 'Implication pour le plan']],
        body: [[
          `${swot.strengths?.length || 0} forces · ${swot.weaknesses?.length || 0} faiblesses · ${swot.opportunities?.length || 0} opportunités · ${swot.threats?.length || 0} menaces`,
          textOr(swot.strategic_implications, 'Implications à valider avec la direction.'),
        ]],
        theme: 'plain',
        headStyles: { fillColor: [...NAVY], textColor: 255 },
        bodyStyles: { fillColor: [...PAPER], textColor: [...INK] },
        columnStyles: { 0: { cellWidth: 50, fontStyle: 'bold' } },
        margin: { left: margin, right: margin },
        styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
    }
    if (plan.pestel_analysis) {
      ensureSpace(105);
      subheading('Exhibit A2 — Facteurs PESTEL et exposition du plan');
      const pestel = plan.pestel_analysis;
      const pestelRows = [
        ['P', 'Politique', pestel.political || []],
        ['E', 'Économique', pestel.economic || []],
        ['S', 'Social', pestel.social || []],
        ['T', 'Technologique', pestel.technological || []],
        ['E', 'Environnemental', pestel.environmental || []],
        ['L', 'Légal', pestel.legal || []],
      ] as const;
      autoTable(doc, {
        startY: y,
        head: [['', 'Facteur', 'Signaux identifiés', 'Volume']],
        body: pestelRows.map(([letter, label, items]) => [letter, label, numbered([...items]).join('\n') || 'À documenter', String(items.length)]),
        theme: 'grid',
        headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [...PAPER] },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center', fontStyle: 'bold', textColor: [...NAVY] },
          1: { cellWidth: 31, fontStyle: 'bold' },
          2: { cellWidth: 104 },
          3: { cellWidth: 13, halign: 'center', fontStyle: 'bold' },
        },
        margin: { left: margin, right: margin },
        styles: { fontSize: 7.6, cellPadding: 3, textColor: [...INK], lineColor: [...LINE], overflow: 'linebreak', valign: 'top' },
      });
      y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 8;
      subheading('Empreinte analytique par facteur');
      horizontalBars(pestelRows.map(([, label, items]) => ({ label, value: items.length, display: `${items.length} signal${items.length > 1 ? 'aux' : ''}` })), NAVY);
      badge('VOLUME DE SIGNAUX · PAS UN SCORE DE RISQUE', 'calculation');
      paragraph(pestel.key_implications || 'Implications principales à consolider avec les parties prenantes.');
    }
    if (plan.market_research) {
      subheading('Contexte marché');
      paragraph(plan.market_research.market_overview);
      paragraph('Les estimations de taille et de croissance du marché ne sont pas reprises sans source explicite et datée.');
    }
  }

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...LINE);
    doc.line(margin, height - 15, width - margin, height - 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`${meta.company} · Plan de développement des compétences · Confidentiel`, margin, height - 9);
    doc.text(`Page ${page} / ${pageCount}`, width - margin, height - 9, { align: 'right' });
  }

  doc.setProperties({
    title: `Plan de développement des compétences — ${meta.company}`,
    subject: `Période ${formatMonthYear(startsAt)} — ${formatMonthYear(endsAt)}`,
    author: 'Qimatak',
    creator: 'Qimatak',
  });
  return doc;
};

export const exportPlanToPDF = (
  plan: GeneratedPlan,
  requirements: PlanRequirements,
  generatedAt = new Date(),
) => {
  const doc = createPlanPDF(plan, requirements, generatedAt);
  const company = plan.report_meta?.company || requirements.company || 'Entreprise';
  const safeCompany = company.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9]+/g, '_');
  const fileName = `Plan_Developpement_Competences_${safeCompany}_${generatedAt.toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
};