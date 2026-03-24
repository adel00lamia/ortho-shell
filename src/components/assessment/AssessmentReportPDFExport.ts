import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportData {
  executiveSummary: string;
  maturityScore: number;
  orgStructureAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  skillsGapAnalysis: {
    criticalGaps: { skill: string; severity: string; affectedPositions: number; recommendation: string }[];
    overallCoverage: number;
  };
  positionPlanning: {
    openPositions: { title: string; department: string; priority: string; reason: string }[];
    upskillCandidates: { currentRole: string; targetRole: string; matchScore: number; gapAreas: string[]; estimatedTime: string }[];
    reskillOpportunities: { currentRole: string; suggestedRole: string; rationale: string; trainingNeeded: string[] }[];
  };
  prioritizedActions: { action: string; priority: string; impact: string; timeline: string; estimatedCost: string }[];
  swotCompetencies: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    threats: string[];
  };
}

interface CompanyBranding {
  name: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

interface ExportOptions {
  report: ReportData;
  company: CompanyBranding;
  language: 'fr' | 'en';
  stats: {
    departments: number;
    positions: number;
    jobDescriptions: number;
    evaluations: number;
  };
}

// Parse a hex/hsl color to RGB, fallback to brand purple
function parseColor(color?: string | null): [number, number, number] {
  if (!color) return [99, 56, 209]; // default primary
  const hex = color.replace('#', '');
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
  }
  return [99, 56, 209];
}

export const exportAssessmentReportPDF = async (options: ExportOptions) => {
  const { report, company, language, stats } = options;
  const fr = language === 'fr';
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const [r, g, b] = parseColor(company.primaryColor);
  let yPos = 20;

  const checkPageBreak = (space: number) => {
    if (yPos + space > pageHeight - 25) {
      doc.addPage();
      yPos = 20;
    }
  };

  const drawSectionHeader = (title: string) => {
    checkPageBreak(20);
    doc.setFontSize(15);
    doc.setTextColor(r, g, b);
    doc.text(title, 20, yPos);
    yPos += 4;
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.6);
    doc.line(20, yPos, pageWidth - 20, yPos);
    yPos += 10;
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const lines = doc.splitTextToSize(text, pageWidth - 40 - indent);
    checkPageBreak(lines.length * 5 + 4);
    doc.text(lines, 20 + indent, yPos);
    yPos += lines.length * 5 + 4;
  };

  const drawBulletList = (items: string[], indent = 5) => {
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    items.forEach(item => {
      const lines = doc.splitTextToSize(`• ${item}`, pageWidth - 42 - indent);
      checkPageBreak(lines.length * 5 + 2);
      doc.text(lines, 20 + indent, yPos);
      yPos += lines.length * 5 + 2;
    });
    yPos += 3;
  };

  // ── Try to load company logo ──
  let logoImg: HTMLImageElement | null = null;
  if (company.logoUrl) {
    try {
      logoImg = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = company.logoUrl!;
      });
    } catch { /* ignore logo errors */ }
  }

  // ════════════════════════════════════════════
  // COVER PAGE
  // ════════════════════════════════════════════
  // Brand bar
  doc.setFillColor(r, g, b);
  doc.rect(0, 0, pageWidth, 10, 'F');

  yPos = 40;

  // Logo
  if (logoImg) {
    try {
      doc.addImage(logoImg, 'PNG', pageWidth / 2 - 18, yPos, 36, 36);
      yPos += 44;
    } catch { yPos += 5; }
  }

  // Title
  doc.setFontSize(28);
  doc.setTextColor(r, g, b);
  const reportTitle = fr ? "Rapport d'Évaluation 360°" : '360° Assessment Report';
  doc.text(reportTitle, pageWidth / 2, yPos, { align: 'center' });
  yPos += 14;

  // Company name
  doc.setFontSize(20);
  doc.setTextColor(60, 60, 60);
  doc.text(company.name, pageWidth / 2, yPos, { align: 'center' });
  yPos += 14;

  // Date
  doc.setFontSize(11);
  doc.setTextColor(120, 120, 120);
  doc.text(new Date().toLocaleDateString(fr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' }), pageWidth / 2, yPos, { align: 'center' });
  yPos += 22;

  // Stats box
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(30, yPos, pageWidth - 60, 32, 4, 4, 'F');
  doc.setFontSize(10);
  doc.setTextColor(80, 80, 80);
  const statsItems = [
    `${stats.departments} ${fr ? 'départements' : 'departments'}`,
    `${stats.positions} ${fr ? 'postes' : 'positions'}`,
    `${stats.jobDescriptions} ${fr ? 'fiches de poste' : 'job descriptions'}`,
    `${stats.evaluations} ${fr ? 'évaluations' : 'evaluations'}`,
  ];
  const colW = (pageWidth - 60) / 4;
  statsItems.forEach((s, i) => {
    doc.text(s, 30 + colW * i + colW / 2, yPos + 19, { align: 'center' });
  });
  yPos += 45;

  // Maturity score gauge
  doc.setFontSize(14);
  doc.setTextColor(r, g, b);
  doc.text(fr ? 'Score de maturité RH' : 'HR Maturity Score', pageWidth / 2, yPos, { align: 'center' });
  yPos += 12;
  // Score bar background
  doc.setFillColor(230, 230, 235);
  doc.roundedRect(40, yPos, pageWidth - 80, 12, 4, 4, 'F');
  // Score bar fill
  const barWidth = (pageWidth - 80) * (report.maturityScore / 100);
  doc.setFillColor(r, g, b);
  doc.roundedRect(40, yPos, barWidth, 12, 4, 4, 'F');
  // Score text
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text(`${report.maturityScore}/100`, 40 + barWidth / 2, yPos + 8.5, { align: 'center' });
  yPos += 25;

  // Table of Contents
  yPos += 10;
  doc.setFontSize(14);
  doc.setTextColor(r, g, b);
  doc.text(fr ? 'Table des matières' : 'Table of Contents', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  const tocItems = [
    fr ? '1. Résumé exécutif' : '1. Executive Summary',
    fr ? '2. Analyse SWOT des compétences' : '2. Competency SWOT Analysis',
    fr ? '3. Analyse de la structure organisationnelle' : '3. Organizational Structure Analysis',
    fr ? '4. Analyse des gaps de compétences' : '4. Skills Gap Analysis',
    fr ? '5. Planification des postes' : '5. Position Planning',
    fr ? '6. Actions prioritaires' : '6. Prioritized Actions',
  ];
  tocItems.forEach(item => {
    doc.text(item, 50, yPos);
    yPos += 7;
  });

  // Bottom brand bar
  doc.setFillColor(r, g, b);
  doc.rect(0, pageHeight - 10, pageWidth, 10, 'F');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text(fr ? 'Confidentiel — Usage interne uniquement' : 'Confidential — Internal use only', pageWidth / 2, pageHeight - 4, { align: 'center' });

  // ════════════════════════════════════════════
  // PAGE 2+: CONTENT
  // ════════════════════════════════════════════
  doc.addPage();
  yPos = 20;

  // 1. Executive Summary
  drawSectionHeader(fr ? 'Résumé exécutif' : 'Executive Summary');
  drawParagraph(report.executiveSummary);

  // 2. SWOT
  if (report.swotCompetencies) {
    drawSectionHeader(fr ? 'Analyse SWOT des compétences' : 'Competency SWOT Analysis');
    const swotSections = [
      { label: fr ? 'Forces' : 'Strengths', items: report.swotCompetencies.strengths, color: [34, 139, 34] as [number, number, number] },
      { label: fr ? 'Faiblesses' : 'Weaknesses', items: report.swotCompetencies.weaknesses, color: [220, 53, 69] as [number, number, number] },
      { label: fr ? 'Opportunités' : 'Opportunities', items: report.swotCompetencies.opportunities, color: [30, 100, 200] as [number, number, number] },
      { label: fr ? 'Menaces' : 'Threats', items: report.swotCompetencies.threats, color: [210, 150, 30] as [number, number, number] },
    ];
    swotSections.forEach(({ label, items, color }) => {
      if (!items || items.length === 0) return;
      checkPageBreak(15 + items.length * 6);
      doc.setFontSize(11);
      doc.setTextColor(color[0], color[1], color[2]);
      doc.text(label, 22, yPos);
      yPos += 6;
      doc.setTextColor(50, 50, 50);
      drawBulletList(items, 8);
    });
  }

  // 3. Org Structure Analysis
  if (report.orgStructureAnalysis) {
    drawSectionHeader(fr ? "Analyse de la structure organisationnelle" : 'Organizational Structure Analysis');
    if (report.orgStructureAnalysis.strengths?.length) {
      doc.setFontSize(11); doc.setTextColor(34, 139, 34);
      doc.text(fr ? 'Points forts' : 'Strengths', 22, yPos); yPos += 6;
      drawBulletList(report.orgStructureAnalysis.strengths, 8);
    }
    if (report.orgStructureAnalysis.weaknesses?.length) {
      doc.setFontSize(11); doc.setTextColor(220, 53, 69);
      doc.text(fr ? 'Points faibles' : 'Weaknesses', 22, yPos); yPos += 6;
      drawBulletList(report.orgStructureAnalysis.weaknesses, 8);
    }
    if (report.orgStructureAnalysis.recommendations?.length) {
      doc.setFontSize(11); doc.setTextColor(r, g, b);
      doc.text(fr ? 'Recommandations' : 'Recommendations', 22, yPos); yPos += 6;
      drawBulletList(report.orgStructureAnalysis.recommendations, 8);
    }
  }

  // 4. Skills Gap Analysis
  if (report.skillsGapAnalysis?.criticalGaps?.length > 0) {
    drawSectionHeader(fr ? 'Analyse des gaps de compétences' : 'Skills Gap Analysis');
    if (report.skillsGapAnalysis.overallCoverage) {
      drawParagraph(`${fr ? 'Couverture globale' : 'Overall coverage'}: ${report.skillsGapAnalysis.overallCoverage}%`);
    }
    autoTable(doc, {
      startY: yPos,
      head: [[
        fr ? 'Compétence' : 'Skill',
        fr ? 'Sévérité' : 'Severity',
        fr ? 'Postes affectés' : 'Affected Positions',
        fr ? 'Recommandation' : 'Recommendation',
      ]],
      body: report.skillsGapAnalysis.criticalGaps.map(g => [
        g.skill, g.severity, String(g.affectedPositions), g.recommendation,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [r, g, b] },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // 5. Position Planning
  if (report.positionPlanning) {
    drawSectionHeader(fr ? 'Planification des postes' : 'Position Planning');

    if (report.positionPlanning.openPositions?.length > 0) {
      doc.setFontSize(11); doc.setTextColor(r, g, b);
      doc.text(fr ? 'Postes à pourvoir' : 'Positions to Fill', 22, yPos); yPos += 6;
      autoTable(doc, {
        startY: yPos,
        head: [[fr ? 'Poste' : 'Position', fr ? 'Département' : 'Department', fr ? 'Priorité' : 'Priority', fr ? 'Raison' : 'Reason']],
        body: report.positionPlanning.openPositions.map(p => [p.title, p.department, p.priority, p.reason]),
        theme: 'grid',
        headStyles: { fillColor: [r, g, b] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (report.positionPlanning.upskillCandidates?.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(11); doc.setTextColor(34, 139, 34);
      doc.text('Upskilling', 22, yPos); yPos += 6;
      autoTable(doc, {
        startY: yPos,
        head: [[fr ? 'Rôle actuel' : 'Current Role', fr ? 'Rôle cible' : 'Target Role', 'Match %', fr ? 'Durée estimée' : 'Est. Time']],
        body: report.positionPlanning.upskillCandidates.map(c => [c.currentRole, c.targetRole, `${c.matchScore}%`, c.estimatedTime]),
        theme: 'grid',
        headStyles: { fillColor: [34, 139, 34] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (report.positionPlanning.reskillOpportunities?.length > 0) {
      checkPageBreak(20);
      doc.setFontSize(11); doc.setTextColor(210, 150, 30);
      doc.text('Reskilling', 22, yPos); yPos += 6;
      autoTable(doc, {
        startY: yPos,
        head: [[fr ? 'Rôle actuel' : 'Current Role', fr ? 'Rôle suggéré' : 'Suggested Role', fr ? 'Justification' : 'Rationale']],
        body: report.positionPlanning.reskillOpportunities.map(r => [r.currentRole, r.suggestedRole, r.rationale]),
        theme: 'grid',
        headStyles: { fillColor: [210, 150, 30] },
        styles: { fontSize: 8, cellPadding: 3 },
        margin: { left: 20, right: 20 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }
  }

  // 6. Prioritized Actions
  if (report.prioritizedActions?.length > 0) {
    drawSectionHeader(fr ? 'Actions prioritaires' : 'Prioritized Actions');
    autoTable(doc, {
      startY: yPos,
      head: [[
        '#',
        fr ? 'Action' : 'Action',
        fr ? 'Priorité' : 'Priority',
        fr ? 'Impact' : 'Impact',
        fr ? 'Délai' : 'Timeline',
        fr ? 'Coût estimé' : 'Est. Cost',
      ]],
      body: report.prioritizedActions.map((a, i) => [
        String(i + 1), a.action, a.priority, a.impact, a.timeline, a.estimatedCost,
      ]),
      theme: 'grid',
      headStyles: { fillColor: [r, g, b] },
      styles: { fontSize: 8, cellPadding: 3 },
      margin: { left: 20, right: 20 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ── Footer on every page ──
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // Brand line at bottom
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.5);
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 140);
    doc.text(company.name, 20, pageHeight - 10);
    doc.text(`${fr ? 'Page' : 'Page'} ${i}/${totalPages}`, pageWidth - 20, pageHeight - 10, { align: 'right' });
    doc.text(fr ? "Rapport d'Évaluation 360°" : '360° Assessment Report', pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // ── Save ──
  const safeName = company.name.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `360_Report_${safeName}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
  return fileName;
};
