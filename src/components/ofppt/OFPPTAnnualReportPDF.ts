import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface AnnualReportData {
  companyName: string;
  exerciseYear: number;
  language: 'fr' | 'en';
  // Training summary
  totalPlans: number;
  activePlans: number;
  completedPlans: number;
  totalModules: number;
  completedModules: number;
  totalHours: number;
  totalBudget: number;
  // Employee data
  totalEmployees: number;
  employeesTrained: number;
  avgCompletionRate: number;
  avgQuizScore: number;
  // Skill development
  skillCategories: { name: string; skills: number; avgLevel: number; avgTarget: number }[];
  criticalGaps: number;
  onTarget: number;
  // OFPPT Reimbursement
  dossiers: { title: string; status: string; amount: number; reimbursement: number; hours: number; participants: number }[];
  totalReimbursementRequested: number;
  totalReimbursementApproved: number;
  // Training plans detail
  plans: { title: string; status: string; modules: number; budget: number; duration: number; ofpptCompliant: boolean }[];
  // Department breakdown
  departments: { name: string; employees: number; trained: number; hours: number }[];
}

const PRIMARY = [30, 64, 175] as const;
const ACCENT = [0, 128, 72] as const; // Green for OFPPT
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const RED = [200, 30, 30] as const;

export function generateOFPPTAnnualReport(data: AnnualReportData) {
  const doc = new jsPDF();
  const fr = data.language === 'fr';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;

  const checkPageBreak = (space: number) => {
    if (yPos + space > pageHeight - 25) {
      doc.addPage();
      addFooter();
      yPos = 25;
    }
  };

  const addFooter = () => {
    const pages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `${data.companyName} — ${fr ? 'Bilan Annuel Formation' : 'Annual Training Report'} ${data.exerciseYear} — Page ${pages}`,
      pageWidth / 2, pageHeight - 10, { align: 'center' }
    );
  };

  const sectionTitle = (title: string) => {
    checkPageBreak(20);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text(title, margin, yPos);
    yPos += 3;
    doc.setDrawColor(...PRIMARY);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 10;
  };

  const subTitle = (text: string) => {
    checkPageBreak(12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text(text, margin, yPos);
    yPos += 7;
  };

  const bodyText = (text: string) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, contentWidth);
    checkPageBreak(lines.length * 5 + 3);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 3;
  };

  // ─── COVER PAGE ───────────────────────────────────────────
  // Background
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // OFPPT badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 30, contentWidth, 25, 5, 5, 'F');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('OFPPT / CSF', pageWidth / 2, 40, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...GRAY);
  doc.text(
    fr ? 'Contrat Spécial de Formation — Bilan Annuel' : 'Special Training Contract — Annual Report',
    pageWidth / 2, 48, { align: 'center' }
  );

  // Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(
    fr ? 'Bilan Annuel' : 'Annual Report',
    pageWidth / 2, 90, { align: 'center' }
  );
  doc.setFontSize(20);
  doc.text(
    fr ? 'Plan de Formation' : 'Training Plan',
    pageWidth / 2, 105, { align: 'center' }
  );

  // Year
  doc.setFontSize(48);
  doc.setFont('helvetica', 'bold');
  doc.text(String(data.exerciseYear), pageWidth / 2, 145, { align: 'center' });

  // Company name
  doc.setFontSize(16);
  doc.setFont('helvetica', 'normal');
  doc.text(data.companyName, pageWidth / 2, 175, { align: 'center' });

  // Date
  doc.setFontSize(10);
  doc.text(
    fr ? `Généré le ${new Date().toLocaleDateString('fr-MA')}` : `Generated on ${new Date().toLocaleDateString('en-US')}`,
    pageWidth / 2, 195, { align: 'center' }
  );

  // Footer on cover
  doc.setFontSize(8);
  doc.setTextColor(200, 200, 255);
  doc.text('Qimatak — Powered by AI', pageWidth / 2, pageHeight - 15, { align: 'center' });

  // ─── PAGE 2: EXECUTIVE SUMMARY ────────────────────────────
  doc.addPage();
  addFooter();
  yPos = 25;

  sectionTitle(fr ? '1. Résumé Exécutif' : '1. Executive Summary');

  bodyText(fr
    ? `Ce rapport présente le bilan annuel de formation de ${data.companyName} pour l'exercice ${data.exerciseYear}. Il couvre l'ensemble des actions de formation réalisées, les résultats obtenus, l'analyse des compétences développées, et le suivi des dossiers de remboursement OFPPT/CSF.`
    : `This report presents the annual training summary for ${data.companyName} for fiscal year ${data.exerciseYear}. It covers all training activities, results achieved, skills development analysis, and OFPPT/CSF reimbursement dossier tracking.`
  );

  yPos += 5;

  // KPI cards as table
  autoTable(doc, {
    startY: yPos,
    head: [[
      fr ? 'Indicateur' : 'Indicator',
      fr ? 'Valeur' : 'Value',
    ]],
    body: [
      [fr ? 'Plans de formation' : 'Training Plans', `${data.totalPlans} (${data.completedPlans} ${fr ? 'terminés' : 'completed'})`],
      [fr ? 'Modules créés' : 'Modules Created', `${data.totalModules} (${data.completedModules} ${fr ? 'terminés' : 'completed'})`],
      [fr ? 'Heures de formation' : 'Training Hours', `${data.totalHours}h`],
      [fr ? 'Budget total' : 'Total Budget', `${data.totalBudget.toLocaleString()} MAD`],
      [fr ? 'Employés formés' : 'Employees Trained', `${data.employeesTrained}/${data.totalEmployees}`],
      [fr ? 'Taux de complétion moyen' : 'Avg Completion Rate', `${data.avgCompletionRate}%`],
      [fr ? 'Score moyen quiz' : 'Avg Quiz Score', `${data.avgQuizScore}%`],
      [fr ? 'Remboursement demandé' : 'Reimbursement Requested', `${data.totalReimbursementRequested.toLocaleString()} MAD`],
      [fr ? 'Remboursement approuvé' : 'Reimbursement Approved', `${data.totalReimbursementApproved.toLocaleString()} MAD`],
    ],
    theme: 'grid',
    headStyles: { fillColor: PRIMARY as unknown as [number, number, number], fontStyle: 'bold', fontSize: 10 },
    bodyStyles: { fontSize: 9 },
    alternateRowStyles: { fillColor: [245, 245, 255] },
    margin: { left: margin, right: margin },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ─── TRAINING PLANS ───────────────────────────────────────
  sectionTitle(fr ? '2. Plans de Formation' : '2. Training Plans');

  if (data.plans.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Titre' : 'Title',
        fr ? 'Statut' : 'Status',
        'Modules',
        fr ? 'Budget (MAD)' : 'Budget (MAD)',
        fr ? 'Durée (mois)' : 'Duration (mo)',
        'OFPPT',
      ]],
      body: data.plans.map(p => [
        p.title,
        p.status,
        String(p.modules),
        p.budget.toLocaleString(),
        String(p.duration),
        p.ofpptCompliant ? '✓' : '—',
      ]),
      theme: 'grid',
      headStyles: { fillColor: PRIMARY as unknown as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 5: { halign: 'center' } },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    bodyText(fr ? 'Aucun plan de formation enregistré.' : 'No training plans recorded.');
  }

  // ─── SKILLS ANALYSIS ──────────────────────────────────────
  checkPageBreak(40);
  sectionTitle(fr ? '3. Analyse des Compétences' : '3. Skills Analysis');

  bodyText(fr
    ? `Gaps critiques: ${data.criticalGaps} | Au niveau cible: ${data.onTarget}`
    : `Critical gaps: ${data.criticalGaps} | On target: ${data.onTarget}`
  );

  if (data.skillCategories.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Catégorie' : 'Category',
        fr ? 'Compétences' : 'Skills',
        fr ? 'Niveau moyen' : 'Avg Level',
        fr ? 'Cible moyenne' : 'Avg Target',
        'Gap',
      ]],
      body: data.skillCategories.map(c => [
        c.name,
        String(c.skills),
        c.avgLevel.toFixed(1),
        c.avgTarget.toFixed(1),
        (c.avgTarget - c.avgLevel).toFixed(1),
      ]),
      theme: 'grid',
      headStyles: { fillColor: ACCENT as unknown as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ─── DEPARTMENT BREAKDOWN ─────────────────────────────────
  if (data.departments.length > 0) {
    checkPageBreak(40);
    sectionTitle(fr ? '4. Répartition par Département' : '4. Department Breakdown');

    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Département' : 'Department',
        fr ? 'Effectif' : 'Employees',
        fr ? 'Formés' : 'Trained',
        fr ? 'Taux' : 'Rate',
        fr ? 'Heures' : 'Hours',
      ]],
      body: data.departments.map(d => [
        d.name,
        String(d.employees),
        String(d.trained),
        d.employees > 0 ? `${Math.round((d.trained / d.employees) * 100)}%` : '0%',
        `${d.hours}h`,
      ]),
      theme: 'grid',
      headStyles: { fillColor: PRIMARY as unknown as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ─── OFPPT REIMBURSEMENT ──────────────────────────────────
  checkPageBreak(40);
  sectionTitle(fr ? '5. Dossiers de Remboursement OFPPT/CSF' : '5. OFPPT/CSF Reimbursement Dossiers');

  if (data.dossiers.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Dossier' : 'Dossier',
        fr ? 'Statut' : 'Status',
        fr ? 'Montant (MAD)' : 'Amount (MAD)',
        fr ? 'Remb. (MAD)' : 'Reimb. (MAD)',
        fr ? 'Heures' : 'Hours',
        fr ? 'Participants' : 'Participants',
      ]],
      body: data.dossiers.map(d => [
        d.title,
        d.status,
        d.amount.toLocaleString(),
        d.reimbursement.toLocaleString(),
        String(d.hours),
        String(d.participants),
      ]),
      theme: 'grid',
      headStyles: { fillColor: ACCENT as unknown as [number, number, number], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Totals
    checkPageBreak(20);
    subTitle(fr ? 'Récapitulatif financier' : 'Financial Summary');
    bodyText(fr
      ? `Total demandé: ${data.totalReimbursementRequested.toLocaleString()} MAD\nTotal approuvé: ${data.totalReimbursementApproved.toLocaleString()} MAD\nTaux de recouvrement: ${data.totalReimbursementRequested > 0 ? Math.round((data.totalReimbursementApproved / data.totalReimbursementRequested) * 100) : 0}%`
      : `Total requested: ${data.totalReimbursementRequested.toLocaleString()} MAD\nTotal approved: ${data.totalReimbursementApproved.toLocaleString()} MAD\nRecovery rate: ${data.totalReimbursementRequested > 0 ? Math.round((data.totalReimbursementApproved / data.totalReimbursementRequested) * 100) : 0}%`
    );
  } else {
    bodyText(fr ? 'Aucun dossier de remboursement enregistré.' : 'No reimbursement dossiers recorded.');
  }

  // ─── RECOMMENDATIONS ──────────────────────────────────────
  checkPageBreak(40);
  sectionTitle(fr ? '6. Recommandations' : '6. Recommendations');

  const recommendations = fr ? [
    `Poursuivre le développement des ${data.criticalGaps} compétences identifiées comme critiques`,
    `Augmenter le taux de formation à travers les départements (actuellement ${data.totalEmployees > 0 ? Math.round((data.employeesTrained / data.totalEmployees) * 100) : 0}%)`,
    `Optimiser le budget formation pour l'exercice ${data.exerciseYear + 1}`,
    `Digitaliser davantage les parcours via les modules SCORM/e-learning`,
    `Soumettre les dossiers CSF dans les délais réglementaires pour maximiser le remboursement`,
  ] : [
    `Continue developing the ${data.criticalGaps} skills identified as critical gaps`,
    `Increase training coverage across departments (currently ${data.totalEmployees > 0 ? Math.round((data.employeesTrained / data.totalEmployees) * 100) : 0}%)`,
    `Optimize training budget for fiscal year ${data.exerciseYear + 1}`,
    `Digitize more learning paths via SCORM/e-learning modules`,
    `Submit CSF dossiers within regulatory deadlines to maximize reimbursement`,
  ];

  recommendations.forEach((rec, i) => {
    checkPageBreak(10);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...DARK);
    doc.text(`${i + 1}. ${rec}`, margin + 5, yPos);
    yPos += 7;
  });

  // Update all footers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...GRAY);
    doc.text(
      `${data.companyName} — ${fr ? 'Bilan Annuel Formation' : 'Annual Training Report'} ${data.exerciseYear} — Page ${i}/${totalPages}`,
      pageWidth / 2, pageHeight - 10, { align: 'center' }
    );
  }

  doc.save(`${fr ? 'Bilan_Annuel_Formation' : 'Annual_Training_Report'}_${data.exerciseYear}_${data.companyName.replace(/\s+/g, '_')}.pdf`);
}
