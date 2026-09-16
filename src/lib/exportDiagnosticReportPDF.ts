/**
 * Qimatak — Rapport de diagnostic présentable en comité de direction.
 *
 * Le rapport n'invente rien : chaque section n'affiche que ce que le
 * diagnostic enregistré contient réellement. Ce qui manque est annoncé
 * comme manquant, et les coûts absents restent « à chiffrer ».
 */
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CAUSE_LABELS,
  CAUSE_HINTS,
  normalizeCauseBreakdown,
  type CauseKey,
} from '@/lib/rootCauseModel';
import type {
  ActionRow,
  DiagnosticRow,
  MeasurementRow,
} from '@/hooks/useRootCauseDiagnostics';

type Lang = 'fr' | 'en';

const T = {
  fr: {
    doc: 'Rapport de diagnostic',
    brand: 'Qimatak — Diagnostiquer avant de former',
    company: 'Entreprise',
    date: 'Date du diagnostic',
    version: 'Version du diagnostic',
    scope: 'Périmètre',
    dept: 'Département',
    pop: 'Population concernée',
    head: 'Effectif concerné',
    problem: '1. Problème constaté',
    symptoms: 'Symptômes retenus',
    kpis: 'Indicateurs métiers fournis',
    evidence: '2. Preuves utilisées',
    evidenceItem: 'Preuve',
    evidenceCount: 'Nombre',
    evidenceNone: 'Aucune preuve chiffrée n’a été enregistrée pour ce diagnostic.',
    conversations: 'Conversations analysées',
    documents: 'Documents analysés',
    interviews: 'Entretiens réalisés',
    indicators: 'Indicateurs métiers',
    pulse: 'Réponses terrain (Pulse)',
    causes: '3. Causes racines probables',
    causesNote:
      'Pourcentages = hypothèses appuyées par les preuves ci-dessus, pas une vérité absolue.',
    cause: 'Cause',
    weight: 'Poids',
    meaning: 'Ce que cela signifie',
    support: 'Éléments à l’appui',
    fit: '4. Training Fit Score',
    fitScale: '/ 100',
    fitLow: 'La formation n’est pas la priorité',
    fitMid: 'La formation est partiellement pertinente',
    fitHigh: 'La formation est pertinente',
    confidence: 'Confiance de l’analyse',
    factors: 'Ce qui a fait monter ou descendre le score',
    missing: 'Preuves manquantes — ce qui augmenterait la confiance',
    verdict: 'Verdict',
    summary: 'Synthèse',
    actions: '5. Plan d’action recommandé',
    actionsNone: 'Aucune action enregistrée.',
    aTitle: 'Action',
    aType: 'Nature',
    aPop: 'Cible',
    aPriority: 'Priorité',
    aCost: 'Coût estimé',
    aImpact: 'Impact attendu',
    toBeCosted: 'à chiffrer',
    prio: { high: 'Haute', medium: 'Moyenne', low: 'Basse' } as Record<string, string>,
    training: 'Formation',
    nonTraining: 'Hors formation',
    measure: '6. Mesure du résultat',
    measureNone: 'Aucun indicateur de suivi enregistré.',
    kpi: 'Indicateur',
    baseline: 'Point de départ',
    target: 'Cible',
    actual: 'Dernier relevé',
    when: 'Relevé le',
    notMeasured: 'non relevé',
    funding: '7. Financement de la formation',
    fundingBody: [
      'Au Maroc, les entreprises assujetties à la Taxe de Formation Professionnelle peuvent demander la prise en charge de leurs actions de formation dans le cadre des Contrats Spéciaux de Formation (CSF) gérés par l’OFPPT, après validation du GIAC de leur secteur.',
      'Les taux, plafonds et pièces à fournir sont fixés par l’OFPPT et évoluent : ils doivent être vérifiés auprès de l’OFPPT ou du GIAC avant tout engagement. Ce rapport ne constitue ni un accord de financement ni un calcul de remboursement.',
      'Ce diagnostic sert de base documentée à la demande : problème constaté, preuves, population concernée, actions retenues et indicateurs de suivi.',
    ],
    limits: 'Limites de ce rapport',
    limitsBody:
      'Les causes racines sont des hypothèses issues des preuves fournies. Un coût n’est affiché que lorsqu’il a été renseigné. Aucune donnée de marché, aucun taux de remboursement et aucun résultat futur ne sont estimés à votre place.',
    page: 'Page',
    of: 'sur',
    footer: 'Qimatak — document de travail interne',
  },
  en: {
    doc: 'Diagnostic report',
    brand: 'Qimatak — Diagnose before training',
    company: 'Company',
    date: 'Diagnostic date',
    version: 'Diagnostic version',
    scope: 'Scope',
    dept: 'Department',
    pop: 'Population concerned',
    head: 'Headcount concerned',
    problem: '1. Observed problem',
    symptoms: 'Selected symptoms',
    kpis: 'Business indicators provided',
    evidence: '2. Evidence used',
    evidenceItem: 'Evidence',
    evidenceCount: 'Count',
    evidenceNone: 'No quantified evidence was recorded for this diagnostic.',
    conversations: 'Conversations analysed',
    documents: 'Documents analysed',
    interviews: 'Interviews conducted',
    indicators: 'Business indicators',
    pulse: 'Field responses (Pulse)',
    causes: '3. Likely root causes',
    causesNote:
      'Percentages are hypotheses supported by the evidence above, not absolute truth.',
    cause: 'Cause',
    weight: 'Weight',
    meaning: 'What it means',
    support: 'Supporting elements',
    fit: '4. Training Fit Score',
    fitScale: '/ 100',
    fitLow: 'Training is not the priority',
    fitMid: 'Training is partly relevant',
    fitHigh: 'Training is relevant',
    confidence: 'Analysis confidence',
    factors: 'What raised or lowered the score',
    missing: 'Missing evidence — what would raise confidence',
    verdict: 'Verdict',
    summary: 'Summary',
    actions: '5. Recommended action plan',
    actionsNone: 'No action recorded.',
    aTitle: 'Action',
    aType: 'Nature',
    aPop: 'Target',
    aPriority: 'Priority',
    aCost: 'Estimated cost',
    aImpact: 'Expected impact',
    toBeCosted: 'to be costed',
    prio: { high: 'High', medium: 'Medium', low: 'Low' } as Record<string, string>,
    training: 'Training',
    nonTraining: 'Non-training',
    measure: '6. Measuring the result',
    measureNone: 'No follow-up indicator recorded.',
    kpi: 'Indicator',
    baseline: 'Baseline',
    target: 'Target',
    actual: 'Latest reading',
    when: 'Read on',
    notMeasured: 'not measured',
    funding: '7. Training funding',
    fundingBody: [
      'In Morocco, companies subject to the Professional Training Tax may apply for their training actions to be covered under the Special Training Contracts (CSF) managed by OFPPT, after validation by their sector GIAC.',
      'Rates, ceilings and required documents are set by OFPPT and change over time: they must be verified with OFPPT or the GIAC before any commitment. This report is neither a funding agreement nor a reimbursement calculation.',
      'This diagnostic provides the documented basis for the application: observed problem, evidence, population concerned, selected actions and follow-up indicators.',
    ],
    limits: 'Limits of this report',
    limitsBody:
      'Root causes are hypotheses derived from the evidence provided. A cost is shown only when it was entered. No market data, reimbursement rate or future result is estimated on your behalf.',
    page: 'Page',
    of: 'of',
    footer: 'Qimatak — internal working document',
  },
};

const NAVY: [number, number, number] = [17, 24, 39];
const ACCENT: [number, number, number] = [37, 99, 235];
const MUTED: [number, number, number] = [107, 114, 128];
const LIGHT: [number, number, number] = [243, 244, 246];

const MARGIN = 16;
const PAGE_W = 210;
const PAGE_H = 297;
const CONTENT_W = PAGE_W - MARGIN * 2;

interface AutoTableDoc extends jsPDF {
  lastAutoTable?: { finalY: number };
}

export interface DiagnosticReportInput {
  diagnostic: DiagnosticRow;
  actions: ActionRow[];
  measurements: MeasurementRow[];
  companyName?: string | null;
  language: Lang;
}

const fmtMad = (n?: number | null, lang: Lang = 'fr') =>
  new Intl.NumberFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { maximumFractionDigits: 0 }).format(
    Number(n ?? 0)
  ).replace(/[\u202f\u00a0]/g, ' ') + ' MAD';

const fmtDate = (iso?: string | null, lang: Lang = 'fr') =>
  iso ? new Date(iso).toLocaleDateString(lang === 'fr' ? 'fr-MA' : 'en-GB') : '—';

export function generateDiagnosticReportPDF(input: DiagnosticReportInput): jsPDF {
  const { diagnostic: d, actions, measurements, companyName, language } = input;
  const t = T[language];
  const doc = new jsPDF({ unit: 'mm', format: 'a4' }) as AutoTableDoc;
  let y = MARGIN;

  const ensure = (needed: number) => {
    if (y + needed > PAGE_H - 22) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const heading = (text: string) => {
    ensure(30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(text, MARGIN, y);
    y += 2;
    doc.setDrawColor(...ACCENT);
    doc.setLineWidth(0.6);
    doc.line(MARGIN, y, MARGIN + 28, y);
    y += 6;
  };

  const body = (text: string, opts?: { muted?: boolean; italic?: boolean; size?: number }) => {
    const size = opts?.size ?? 9.5;
    doc.setFont('helvetica', opts?.italic ? 'italic' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...(opts?.muted ? MUTED : NAVY));
    const lines = doc.splitTextToSize(text, CONTENT_W) as string[];
    for (const line of lines) {
      ensure(6);
      doc.text(line, MARGIN, y);
      y += size * 0.48 + 1.1;
    }
    y += 1.5;
  };

  const bullets = (items: string[]) => {
    for (const item of items) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...NAVY);
      const lines = doc.splitTextToSize(item, CONTENT_W - 5) as string[];
      lines.forEach((line, i) => {
        ensure(6);
        if (i === 0) {
          doc.setTextColor(...ACCENT);
          doc.text('•', MARGIN, y);
          doc.setTextColor(...NAVY);
        }
        doc.text(line, MARGIN + 4.5, y);
        y += 5;
      });
    }
    y += 1.5;
  };

  const table = (head: string[], rows: (string | number)[][], widths?: number[]) => {
    ensure(24);
    const columnStyles = widths
      ? Object.fromEntries(widths.map((w, i) => [i, { cellWidth: w }]))
      : undefined;
    autoTable(doc, {
      startY: y,
      head: [head],
      body: rows,
      margin: { left: MARGIN, right: MARGIN },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.2, textColor: NAVY, lineColor: [220, 222, 228], lineWidth: 0.1, overflow: 'linebreak' },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 250, 252] },
      rowPageBreak: 'avoid',
      columnStyles,
    });
    y = (doc.lastAutoTable?.finalY ?? y) + 7;
  };

  // ---------- Cover header ----------
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, PAGE_W, 40, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.setTextColor(255, 255, 255);
  doc.text('Qimatak', MARGIN, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 200, 220);
  doc.text(t.brand, MARGIN, 24);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(t.doc, PAGE_W - MARGIN, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 200, 220);
  doc.text(`${t.date}: ${fmtDate(d.diagnosed_at ?? d.created_at, language)}`, PAGE_W - MARGIN, 24, {
    align: 'right',
  });
  y = 50;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...NAVY);
  const titleLines = doc.splitTextToSize(d.title, CONTENT_W) as string[];
  for (const line of titleLines) {
    doc.text(line, MARGIN, y);
    y += 7;
  }
  y += 1;

  const meta: string[] = [];
  if (companyName) meta.push(`${t.company}: ${companyName}`);
  if (d.department) meta.push(`${t.dept}: ${d.department}`);
  if (d.affected_population) meta.push(`${t.pop}: ${d.affected_population}`);
  if (d.headcount_affected) meta.push(`${t.head}: ${d.headcount_affected}`);
  meta.push(`${t.version}: v${d.version ?? 1}`);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const metaLines = doc.splitTextToSize(meta.join('   ·   '), CONTENT_W) as string[];
  for (const line of metaLines) {
    doc.text(line, MARGIN, y);
    y += 5;
  }
  y += 4;

  // ---------- 1. Problem ----------
  heading(t.problem);
  body(d.problem_description || '—');
  const symptoms = (d.symptoms ?? []).filter(Boolean);
  if (symptoms.length) {
    body(`${t.symptoms}:`, { muted: true, size: 9 });
    bullets(symptoms);
  }
  const kpis = (d.business_kpis ?? []).filter((k) => k && (k.name || k.value));
  if (kpis.length) {
    body(`${t.kpis}:`, { muted: true, size: 9 });
    bullets(kpis.map((k) => `${k.name ?? '—'}: ${k.value ?? '—'}${k.unit ? ` ${k.unit}` : ''}`));
  }

  // ---------- 2. Evidence ----------
  heading(t.evidence);
  const src = d.evidence_sources ?? {};
  const evidenceRows: (string | number)[][] = (
    [
      ['conversations', t.conversations],
      ['documents', t.documents],
      ['interviews', t.interviews],
      ['indicators', t.indicators],
      ['pulse_responses', t.pulse],
    ] as const
  )
    .map(([key, label]) => [label, Number(src[key] ?? 0)])
    .filter((row) => Number(row[1]) > 0);
  if (evidenceRows.length) {
    table([t.evidenceItem, t.evidenceCount], evidenceRows, [CONTENT_W - 30, 30]);
  } else {
    body(t.evidenceNone, { muted: true, italic: true });
  }

  // ---------- 3. Root causes ----------
  heading(t.causes);
  body(t.causesNote, { muted: true, italic: true, size: 9 });
  const breakdown = normalizeCauseBreakdown(d.cause_breakdown);
  const evidenceByCause = new Map(
    (d.cause_evidence ?? []).map((e) => [e.cause, e])
  );
  const causeRows = (Object.keys(breakdown) as CauseKey[])
    .sort((a, b) => breakdown[b] - breakdown[a])
    .filter((k) => breakdown[k] > 0)
    .map((k) => {
      const ev = evidenceByCause.get(k);
      const support = (ev?.supporting ?? []).join(' · ');
      return [
        CAUSE_LABELS[language][k],
        `${breakdown[k]} %`,
        CAUSE_HINTS[language][k],
        support || '—',
      ];
    });
  if (causeRows.length) {
    table([t.cause, t.weight, t.meaning, t.support], causeRows, [34, 16, 52, CONTENT_W - 102]);
  }

  // ---------- 4. Training Fit Score ----------
  heading(t.fit);
  const score = Number(d.training_fit_score ?? 0);
  const verdictLabel = score < 40 ? t.fitLow : score < 70 ? t.fitMid : t.fitHigh;
  ensure(26);
  doc.setFillColor(...LIGHT);
  doc.roundedRect(MARGIN, y, CONTENT_W, 20, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(...ACCENT);
  doc.text(String(score), MARGIN + 6, y + 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(t.fitScale, MARGIN + 6 + doc.getTextWidth(String(score)) * 2.1, y + 13);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...NAVY);
  doc.text(verdictLabel, MARGIN + 44, y + 9);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`${t.confidence}: ${d.ai_confidence ?? 0} %`, MARGIN + 44, y + 15);
  y += 26;

  const factors = (d.training_fit_explanation ?? []).filter(Boolean);
  if (factors.length) {
    body(`${t.factors}:`, { muted: true, size: 9 });
    bullets(
      factors.map((f) => `${f.direction === 'up' ? '+' : '-'} ${language === 'fr' ? f.fr : f.en}`)
    );
  }
  if (d.ai_verdict) body(`${t.verdict}: ${d.ai_verdict}`);
  if (d.ai_summary) {
    body(`${t.summary}:`, { muted: true, size: 9 });
    body(d.ai_summary);
  }
  const missing = (d.missing_evidence ?? []).filter(Boolean);
  if (missing.length) {
    body(`${t.missing}:`, { muted: true, size: 9 });
    bullets(missing);
  }

  // ---------- 5. Actions ----------
  heading(t.actions);
  if (actions.length === 0) {
    body(t.actionsNone, { muted: true, italic: true });
  } else {
    table(
      [t.aTitle, t.aType, t.aPop, t.aPriority, t.aCost, t.aImpact],
      actions.map((a) => [
        a.title + (a.description ? `\n${a.description}` : ''),
        a.is_training || a.action_type === 'training' ? t.training : t.nonTraining,
        [a.target_population, a.headcount ? `(${a.headcount})` : null].filter(Boolean).join(' ') || '—',
        t.prio[a.priority ?? ''] ?? a.priority ?? '—',
        Number(a.estimated_cost_mad ?? 0) > 0 ? fmtMad(a.estimated_cost_mad, language) : t.toBeCosted,
        a.expected_impact ?? '—',
      ]),
      [44, 22, 25, 20, 24, CONTENT_W - 135]
    );
  }

  // ---------- 6. Measurement ----------
  heading(t.measure);
  if (measurements.length === 0) {
    body(t.measureNone, { muted: true, italic: true });
  } else {
    table(
      [t.kpi, t.baseline, t.target, t.actual, t.when],
      measurements.map((m) => [
        m.kpi_name + (m.unit ? ` (${m.unit})` : ''),
        m.baseline_value ?? '—',
        m.target_value ?? '—',
        m.actual_value ?? t.notMeasured,
        fmtDate(m.measured_at, language),
      ]),
      [CONTENT_W - 106, 26, 26, 26, 28]
    );
  }

  // ---------- 7. Funding ----------
  heading(t.funding);
  for (const paragraph of t.fundingBody) body(paragraph);

  // ---------- Limits ----------
  heading(t.limits);
  body(t.limitsBody, { muted: true, size: 9 });

  // ---------- Footer on every page ----------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p += 1) {
    doc.setPage(p);
    doc.setDrawColor(225, 227, 232);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(t.footer, MARGIN, PAGE_H - 9);
    doc.text(`${t.page} ${p} ${t.of} ${pages}`, PAGE_W - MARGIN, PAGE_H - 9, { align: 'right' });
  }

  return doc;
}

/** Builds and downloads the report. */
export function downloadDiagnosticReportPDF(input: DiagnosticReportInput) {
  const doc = generateDiagnosticReportPDF(input);
  const slug = (input.diagnostic.title || 'diagnostic')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 48);
  const date = (input.diagnostic.diagnosed_at ?? input.diagnostic.created_at ?? '').slice(0, 10);
  doc.save(`qimatak-diagnostic-${slug || 'rapport'}-${date}.pdf`);
}
