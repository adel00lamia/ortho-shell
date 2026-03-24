import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IngenierieDossier, IngenierieAction } from '@/hooks/useIngenierie';
import { computeActionReimbursement, computeTFP, computeReimbursementCap, computeGiacReimbursement, formatDH } from '@/lib/ofpptFinancials';

const GREEN: [number, number, number] = [0, 128, 72];
const DARK: [number, number, number] = [30, 30, 30];
const GRAY: [number, number, number] = [100, 100, 100];
const LIGHT_GRAY: [number, number, number] = [245, 245, 245];

function generatePDF(dossier: IngenierieDossier, actions: IngenierieAction[], companyName: string) {
  const doc = new jsPDF();
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
      `${companyName} — Ingénierie de Formation ${dossier.exercise_year} — Page ${pages}`,
      pageWidth / 2, pageHeight - 10, { align: 'center' }
    );
  };

  const sectionTitle = (title: string) => {
    checkPageBreak(20);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...GREEN);
    doc.text(title, margin, yPos);
    yPos += 3;
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.8);
    doc.line(margin, yPos, margin + contentWidth, yPos);
    yPos += 10;
  };

  // ── Cover page ──────────────────────────────────────────────────────────────
  doc.setFillColor(...GREEN);
  doc.rect(0, 0, pageWidth, 60, 'F');
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('INGÉNIERIE DE FORMATION', pageWidth / 2, 28, { align: 'center' });
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.text(`Exercice ${dossier.exercise_year}`, pageWidth / 2, 42, { align: 'center' });

  doc.setTextColor(...DARK);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, pageWidth / 2, 85, { align: 'center' });

  if (dossier.giac_sector) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Secteur GIAC : ${dossier.giac_sector}`, pageWidth / 2, 100, { align: 'center' });
  }

  doc.setFontSize(9);
  doc.setTextColor(...GRAY);
  doc.text(`Dossier N° ${dossier.if_number ?? '—'} | ${new Date().toLocaleDateString('fr-MA')}`, pageWidth / 2, 115, { align: 'center' });

  addFooter();
  doc.addPage();
  yPos = 25;

  // ── Section 1: Fiche signalétique ───────────────────────────────────────────
  sectionTitle('1. FICHE SIGNALÉTIQUE');
  const ficheData = [
    ['Raison sociale', companyName],
    ['Secteur GIAC', dossier.giac_sector ?? '—'],
    ['N° Identifiant Fiscal (IF)', dossier.if_number ?? '—'],
    ['Responsable formation', dossier.contact_name ?? '—'],
    ['Téléphone', dossier.contact_phone ?? '—'],
    ['Email', dossier.contact_email ?? '—'],
    ['Masse salariale annuelle brute', dossier.gross_annual_payroll ? formatDH(dossier.gross_annual_payroll) : '—'],
    ['TFP (1,6%)', dossier.tfp_amount ? formatDH(dossier.tfp_amount) : '—'],
    ['Exercice', String(dossier.exercise_year)],
    ['Diagnostic stratégique réalisé', dossier.followed_strategic_diagnostic ? 'Oui (taux GIAC 80%)' : 'Non (taux GIAC 70%)'],
  ];
  autoTable(doc, {
    startY: yPos,
    body: ficheData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 70 }, 1: { cellWidth: contentWidth - 70 } },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ── Section 2: SWOT ─────────────────────────────────────────────────────────
  checkPageBreak(60);
  sectionTitle('2. ANALYSE SWOT');
  const swot = dossier.swot_data as any || {};
  const swotData = [
    ['Forces (Strengths)', (swot.strengths || []).filter(Boolean).join('\n') || '—',
     'Faiblesses (Weaknesses)', (swot.weaknesses || []).filter(Boolean).join('\n') || '—'],
    ['Opportunités', (swot.opportunities || []).filter(Boolean).join('\n') || '—',
     'Menaces', (swot.threats || []).filter(Boolean).join('\n') || '—'],
  ];
  autoTable(doc, {
    startY: yPos,
    body: swotData,
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, valign: 'top' },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: [220, 240, 220], cellWidth: 25 },
      1: { cellWidth: (contentWidth / 2) - 25 },
      2: { fontStyle: 'bold', fillColor: [255, 220, 220], cellWidth: 25 },
      3: { cellWidth: (contentWidth / 2) - 25 },
    },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  if (swot.implications) {
    checkPageBreak(20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...DARK);
    doc.text('Implications stratégiques :', margin, yPos);
    yPos += 5;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(swot.implications, contentWidth);
    doc.text(lines, margin, yPos);
    yPos += lines.length * 5 + 10;
  }

  // ── Section 3: Besoins ──────────────────────────────────────────────────────
  checkPageBreak(40);
  sectionTitle('3. ANALYSE DES BESOINS EN FORMATION');
  const allNeeds = [
    ...((dossier.needs_individual as any[]) || []).map((n: any) => ({ ...n, type: 'Individuel' })),
    ...((dossier.needs_collective as any[]) || []).map((n: any) => ({ ...n, type: 'Collectif' })),
    ...((dossier.needs_strategic as any[]) || []).map((n: any) => ({ ...n, type: 'Stratégique' })),
  ];
  if (allNeeds.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Type', 'Besoin identifié', 'Priorité', 'Description']],
      body: allNeeds.map((n) => [n.type, n.title || '—', n.priority || '—', n.description || '—']),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 50 }, 2: { cellWidth: 20 } },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ── Section 4: Fiches techniques ────────────────────────────────────────────
  if (actions.length > 0) {
    checkPageBreak(40);
    sectionTitle('4. FICHES TECHNIQUES DES ACTIONS');
    actions.forEach((action, idx) => {
      checkPageBreak(40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...DARK);
      doc.text(`Action ${idx + 1} : ${action.title}`, margin, yPos);
      yPos += 5;
      const reimbInfo = computeActionReimbursement(action.cost_ht ?? 0, action.duration_hours ?? 0, action.participant_count ?? 0, action.is_planned);
      autoTable(doc, {
        startY: yPos,
        body: [
          ['Population cible', action.target_population || '—', 'Type', action.is_planned ? 'Planifiée (70%)' : 'Non planifiée (40%)'],
          ['Durée', `${action.duration_days ?? '—'} j / ${action.duration_hours ?? '—'} h`, 'Participants', String(action.participant_count ?? '—')],
          ['Prestataire', action.provider_name || '—', 'Lieu', action.location || '—'],
          ['Dates', `${action.planned_start_date ?? '—'} → ${action.planned_end_date ?? '—'}`, 'Coût HT', action.cost_ht ? formatDH(action.cost_ht) : '—'],
          ['Remboursement OFPPT', formatDH(reimbInfo.cappedAmount), 'Taux', `${(reimbInfo.rate * 100).toFixed(0)}%`],
        ],
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        columnStyles: {
          0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 35 },
          1: { cellWidth: (contentWidth / 2) - 35 },
          2: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 30 },
          3: { cellWidth: (contentWidth / 2) - 30 },
        },
        margin: { left: margin, right: margin },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;
      if (action.content_outline) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...GRAY);
        const lines = doc.splitTextToSize(`Contenu : ${action.content_outline}`, contentWidth);
        doc.text(lines, margin, yPos);
        yPos += lines.length * 4 + 6;
      }
    });
  }

  // ── Section 5: Budget ───────────────────────────────────────────────────────
  checkPageBreak(60);
  sectionTitle('5. BUDGET PRÉVISIONNEL');
  const tfp = computeTFP(dossier.gross_annual_payroll ?? 0);
  const cap = computeReimbursementCap(tfp);
  const totalActionsReimb = actions.reduce((sum, a) => {
    const r = computeActionReimbursement(a.cost_ht ?? 0, a.duration_hours ?? 0, a.participant_count ?? 0, a.is_planned);
    return sum + r.cappedAmount;
  }, 0);

  autoTable(doc, {
    startY: yPos,
    head: [['Action', 'Coût HT', 'Taux', 'Remboursement OFPPT']],
    body: [
      ...actions.map((a) => {
        const r = computeActionReimbursement(a.cost_ht ?? 0, a.duration_hours ?? 0, a.participant_count ?? 0, a.is_planned);
        return [a.title, a.cost_ht ? formatDH(a.cost_ht) : '—', `${(r.rate * 100).toFixed(0)}%`, formatDH(r.cappedAmount)];
      }),
      ['TOTAL', formatDH(actions.reduce((s, a) => s + (a.cost_ht ?? 0), 0)), '', formatDH(totalActionsReimb)],
    ],
    theme: 'striped',
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: GREEN, textColor: [255, 255, 255] },
    bodyStyles: {},
    footStyles: {},
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable.finalY + 8;

  autoTable(doc, {
    startY: yPos,
    body: [
      ['Masse salariale brute', formatDH(dossier.gross_annual_payroll ?? 0)],
      ['TFP (1,6%)', formatDH(tfp)],
      ['Plafond de remboursement', formatDH(cap)],
      ['Remboursement total estimé', formatDH(Math.min(totalActionsReimb, cap))],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 80 } },
    margin: { left: margin, right: margin },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // ── Section 6: Calendrier ───────────────────────────────────────────────────
  checkPageBreak(40);
  sectionTitle('6. CALENDRIER PRÉVISIONNEL');
  const scheduledActions = actions.filter((a) => a.planned_start_date && a.planned_end_date);
  if (scheduledActions.length > 0) {
    autoTable(doc, {
      startY: yPos,
      head: [['Action', 'Date début', 'Date fin', 'Durée (h)', 'Participants']],
      body: scheduledActions.map((a) => [
        a.title, a.planned_start_date ?? '—', a.planned_end_date ?? '—',
        String(a.duration_hours ?? '—'), String(a.participant_count ?? '—'),
      ]),
      theme: 'striped',
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: GREEN, textColor: [255, 255, 255] },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ── Section 7: Annexes ──────────────────────────────────────────────────────
  checkPageBreak(40);
  sectionTitle('7. ANNEXES');
  autoTable(doc, {
    startY: yPos,
    body: [
      ['Attestation CSF OFPPT', dossier.csf_attestation_url ? 'Fournie' : 'À fournir'],
      ['Attestation GIAC', dossier.giac_attestation_url ? 'Fournie' : 'À fournir'],
      ['Convention(s) de formation', 'À joindre'],
      ['Devis prestataires', 'À joindre'],
    ],
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: { 0: { fontStyle: 'bold', fillColor: LIGHT_GRAY, cellWidth: 80 } },
    margin: { left: margin, right: margin },
  });

  addFooter();
  doc.save(`ingenierie_formation_${dossier.exercise_year}_${companyName.replace(/\s+/g, '_')}.pdf`);
}

export function useIngenierieExport(dossier: IngenierieDossier | null, actions: IngenierieAction[], companyName: string) {
  const [isExporting, setIsExporting] = useState(false);

  const exportPDF = async () => {
    if (!dossier) return;
    setIsExporting(true);
    try {
      generatePDF(dossier, actions, companyName);
    } catch (e) {
      console.error('PDF export error', e);
    } finally {
      setIsExporting(false);
    }
  };

  const exportDOCX = async () => {
    // DOCX export: simple text fallback — full docx library integration TBD
    if (!dossier) return;
    const content = [
      `INGÉNIERIE DE FORMATION — ${dossier.exercise_year}`,
      `Entreprise: ${companyName}`,
      `Secteur GIAC: ${dossier.giac_sector ?? '—'}`,
      ``,
      `=== BUDGET PRÉVISIONNEL ===`,
      `TFP: ${formatDH(dossier.tfp_amount ?? 0)}`,
      `Remboursement estimé: ${formatDH(dossier.estimated_reimbursement ?? 0)}`,
      ``,
      `=== ACTIONS DE FORMATION ===`,
      ...actions.map((a, i) => `${i + 1}. ${a.title} — ${a.cost_ht ? formatDH(a.cost_ht) : '—'}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ingenierie_formation_${dossier.exercise_year}_${companyName.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return { exportPDF, exportDOCX, isExporting };
}
