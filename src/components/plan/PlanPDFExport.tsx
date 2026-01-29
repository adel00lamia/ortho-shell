import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface GeneratedPlan {
  title: string;
  description: string;
  modules: any[];
  timeline: string;
  budget_breakdown: any;
  kpis: any[];
  recommendations: string[];
  risk_assessment?: any;
  success_metrics?: string[];
  innovation_features?: any;
  sustainability_plan?: any;
}

interface PlanRequirements {
  company: string;
  industry: string;
  companySize: string;
  budget: number;
  duration: number;
  objectives: string[];
  targetSkills: string[];
  constraints: string[];
}

export const exportPlanToPDF = (plan: GeneratedPlan, requirements: PlanRequirements) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Helper function to add page break if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > 280) {
      doc.addPage();
      yPos = 20;
    }
  };

  // Title
  doc.setFontSize(24);
  doc.setTextColor(41, 98, 255);
  doc.text(plan.title, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Subtitle / Company Info
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.text(`${requirements.company} | ${requirements.industry}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  doc.text(`Generated on ${new Date().toLocaleDateString()}`, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Description
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  const descriptionLines = doc.splitTextToSize(plan.description, pageWidth - 40);
  doc.text(descriptionLines, 20, yPos);
  yPos += descriptionLines.length * 6 + 10;

  // Overview Section
  checkPageBreak(50);
  doc.setFontSize(14);
  doc.setTextColor(41, 98, 255);
  doc.text('Plan Overview', 20, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  
  const overviewData = [
    ['Duration', `${requirements.duration} months`],
    ['Budget', `${requirements.budget.toLocaleString()} MAD`],
    ['Company Size', requirements.companySize],
    ['Timeline', plan.timeline || 'As per modules'],
    ['Total Modules', `${plan.modules?.length || 0} modules`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [['Parameter', 'Value']],
    body: overviewData,
    theme: 'striped',
    headStyles: { fillColor: [41, 98, 255] },
    margin: { left: 20, right: 20 },
  });
  yPos = (doc as any).lastAutoTable.finalY + 15;

  // Objectives
  if (requirements.objectives.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Training Objectives', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    requirements.objectives.forEach((obj, idx) => {
      checkPageBreak(8);
      doc.text(`• ${obj}`, 25, yPos);
      yPos += 6;
    });
    yPos += 10;
  }

  // Target Skills
  if (requirements.targetSkills.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Target Skills', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const skillsText = requirements.targetSkills.join(', ');
    const skillLines = doc.splitTextToSize(skillsText, pageWidth - 40);
    doc.text(skillLines, 20, yPos);
    yPos += skillLines.length * 6 + 10;
  }

  // Training Modules
  if (plan.modules && plan.modules.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Training Modules', 20, yPos);
    yPos += 10;

    const moduleData = plan.modules.map((module, idx) => [
      (idx + 1).toString(),
      module.title || module.name,
      module.duration || 'N/A',
      module.type || module.delivery_method || 'Mixed',
      module.certification_level || 'N/A',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Module', 'Duration', 'Type', 'Level']],
      body: moduleData,
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Budget Breakdown
  if (plan.budget_breakdown) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Budget Breakdown', 20, yPos);
    yPos += 10;

    const budgetData = Object.entries(plan.budget_breakdown).map(([key, value]) => [
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      typeof value === 'number' ? `${value.toLocaleString()} MAD` : String(value),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: budgetData,
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
      margin: { left: 20, right: 20 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // KPIs
  if (plan.kpis && plan.kpis.length > 0) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Key Performance Indicators (KPIs)', 20, yPos);
    yPos += 10;

    const kpiData = plan.kpis.map(kpi => [
      kpi.name,
      kpi.target,
      kpi.measurement_frequency || 'Quarterly',
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['KPI', 'Target', 'Frequency']],
      body: kpiData,
      theme: 'striped',
      headStyles: { fillColor: [41, 98, 255] },
      margin: { left: 20, right: 20 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // Recommendations
  if (plan.recommendations && plan.recommendations.length > 0) {
    checkPageBreak(50);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Strategic Recommendations', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    plan.recommendations.forEach((rec, idx) => {
      checkPageBreak(12);
      const recLines = doc.splitTextToSize(`${idx + 1}. ${rec}`, pageWidth - 45);
      doc.text(recLines, 25, yPos);
      yPos += recLines.length * 6 + 2;
    });
    yPos += 10;
  }

  // Risk Assessment
  if (plan.risk_assessment) {
    checkPageBreak(60);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Risk Assessment', 20, yPos);
    yPos += 10;

    if (plan.risk_assessment.high_risks && plan.risk_assessment.high_risks.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(200, 50, 50);
      doc.text('High Risks:', 25, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      plan.risk_assessment.high_risks.forEach((risk: string) => {
        checkPageBreak(8);
        doc.text(`• ${risk}`, 30, yPos);
        yPos += 6;
      });
      yPos += 5;
    }

    if (plan.risk_assessment.mitigation_strategies && plan.risk_assessment.mitigation_strategies.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(41, 98, 255);
      doc.text('Mitigation Strategies:', 25, yPos);
      yPos += 6;
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      plan.risk_assessment.mitigation_strategies.forEach((strategy: string) => {
        checkPageBreak(8);
        doc.text(`• ${strategy}`, 30, yPos);
        yPos += 6;
      });
    }
    yPos += 10;
  }

  // Success Metrics
  if (plan.success_metrics && plan.success_metrics.length > 0) {
    checkPageBreak(40);
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text('Success Metrics', 20, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    plan.success_metrics.forEach((metric, idx) => {
      checkPageBreak(8);
      doc.text(`✓ ${metric}`, 25, yPos);
      yPos += 6;
    });
  }

  // Footer
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount} | Generated by SkillsWave AI Training Platform`,
      pageWidth / 2,
      290,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${plan.title.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  
  return fileName;
};
