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

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

const formatDate = (date: Date) => `${date.getDate()} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
const formatMonthYear = (date: Date) => `${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
const formatMoney = (value: number) => `${new Intl.NumberFormat('fr-FR').format(value)} MAD`;
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
    const colors = tone === 'source' ? GREEN : tone === 'calculation' ? NAVY : AMBER;
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
      ['Population', requirements.companySize || 'À confirmer', requirements.companySize ? 'Donnée fournie' : 'À valider'],
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

  if (plan.modules?.length) {
    section('03', 'Portefeuille de formation priorisé', 'Chaque action doit être validée avec son sponsor, sa population et son résultat attendu.');
    autoTable(doc, {
      startY: y,
      head: [['#', 'Action', 'Public / niveau', 'Modalité', 'Durée', 'Budget']],
      body: plan.modules.map((module, index) => [
        String(index + 1),
        safe(module.title || module.name),
        `${textOr(module.target_audience)}\n${textOr(module.certification_level)}`,
        textOr(module.delivery_method || module.type),
        textOr(module.duration),
        typeof module.estimated_cost === 'number' ? formatMoney(module.estimated_cost) : 'À chiffrer',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255, fontStyle: 'bold' },
      bodyStyles: { textColor: [...INK], lineColor: [...LINE] },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 8 }, 1: { cellWidth: 53 }, 2: { cellWidth: 37 }, 3: { cellWidth: 25 }, 4: { cellWidth: 20 }, 5: { cellWidth: 27 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: 'linebreak' },
    });
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 10;
    plan.modules.forEach((module, index) => {
      subheading(`${index + 1}. ${safe(module.title || module.name)}`);
      paragraph(module.description);
      if (module.skills_covered?.length) {
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        paragraph(`Compétences : ${module.skills_covered.join(', ')}`, 3);
      }
    });
  }

  if (plan.implementation_roadmap?.phases?.length) {
    section('04', 'Feuille de route de mise en œuvre', `${formatMonthYear(startsAt)} — ${formatMonthYear(endsAt)}`);
    autoTable(doc, {
      startY: y,
      head: [['Phase', 'Fenêtre', 'Activités clés', 'Livrables', 'Responsable']],
      body: plan.implementation_roadmap.phases.map(phase => [
        safe(phase.name), safe(phase.duration), (phase.activities || []).join('\n• '), (phase.deliverables || []).join('\n• '), textOr(phase.owner),
      ]),
      theme: 'grid',
      headStyles: { fillColor: [...NAVY], textColor: 255 },
      alternateRowStyles: { fillColor: [...PAPER] },
      columnStyles: { 0: { cellWidth: 32, fontStyle: 'bold' }, 1: { cellWidth: 22 }, 2: { cellWidth: 46 }, 3: { cellWidth: 42 }, 4: { cellWidth: 24 } },
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
      columnStyles: { 0: { cellWidth: 41, fontStyle: 'bold' }, 1: { cellWidth: 29 }, 2: { cellWidth: 32 }, 3: { cellWidth: 26 }, 4: { cellWidth: 38 } },
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 2.5 },
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
    section('A', 'Annexes analytiques', 'Analyses générées par IA à confronter aux données internes et à des sources datées.');
    badge('HYPOTHÈSES À VALIDER', 'assumption');
    if (plan.swot_analysis) {
      subheading('SWOT');
      bullets([
        ...(plan.swot_analysis.strengths || []).map(item => `Force — ${item}`),
        ...(plan.swot_analysis.weaknesses || []).map(item => `Faiblesse — ${item}`),
        ...(plan.swot_analysis.opportunities || []).map(item => `Opportunité — ${item}`),
        ...(plan.swot_analysis.threats || []).map(item => `Menace — ${item}`),
      ]);
    }
    if (plan.pestel_analysis) {
      subheading('PESTEL — implications principales');
      paragraph(plan.pestel_analysis.key_implications);
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