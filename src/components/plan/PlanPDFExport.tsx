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
  executive_summary?: string;
  market_research?: {
    market_overview?: string;
    market_size?: string;
    growth_rate?: string;
    key_trends?: string[];
    competitive_landscape?: string;
    target_audience_analysis?: string;
    demand_drivers?: string[];
    market_challenges?: string[];
  };
  swot_analysis?: {
    strengths?: string[];
    weaknesses?: string[];
    opportunities?: string[];
    threats?: string[];
    strategic_implications?: string;
  };
  pestel_analysis?: {
    political?: string[];
    economic?: string[];
    social?: string[];
    technological?: string[];
    environmental?: string[];
    legal?: string[];
    key_implications?: string;
  };
  regulatory_framework?: any;
  implementation_roadmap?: {
    phases?: { name: string; duration: string; activities: string[]; deliverables: string[] }[];
  };
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

// Colors
const PRIMARY = [30, 64, 175] as const;    // Deep blue
const ACCENT = [220, 38, 38] as const;     // Red accent
const DARK = [30, 30, 30] as const;
const GRAY = [100, 100, 100] as const;
const LIGHT_GRAY = [200, 200, 200] as const;

export const exportPlanToPDF = (plan: GeneratedPlan, requirements: PlanRequirements) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let yPos = 0;

  const checkPageBreak = (requiredSpace: number) => {
    if (yPos + requiredSpace > pageHeight - 30) {
      doc.addPage();
      yPos = 25;
    }
  };

  const drawSectionHeader = (title: string, icon?: string) => {
    checkPageBreak(20);
    doc.setDrawColor(...PRIMARY);
    doc.setFillColor(...PRIMARY);
    doc.rect(margin, yPos - 5, 4, 14, 'F');
    doc.setFontSize(15);
    doc.setTextColor(...PRIMARY);
    doc.text(`${icon ? icon + ' ' : ''}${title}`, margin + 10, yPos + 5);
    yPos += 18;
    doc.setDrawColor(...LIGHT_GRAY);
    doc.line(margin, yPos - 5, pageWidth - margin, yPos - 5);
    yPos += 2;
  };

  const drawSubHeader = (title: string) => {
    checkPageBreak(14);
    doc.setFontSize(11);
    doc.setTextColor(...PRIMARY);
    doc.setFont('helvetica', 'bold');
    doc.text(title, margin + 5, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
  };

  const drawParagraph = (text: string, indent = 0) => {
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    const lines = doc.splitTextToSize(text, contentWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin + indent, yPos);
      yPos += 5.5;
    });
    yPos += 3;
  };

  const drawBulletList = (items: string[], indent = 5) => {
    doc.setFontSize(10);
    doc.setTextColor(...DARK);
    items.forEach(item => {
      checkPageBreak(8);
      const lines = doc.splitTextToSize(`${item}`, contentWidth - indent - 8);
      doc.text('•', margin + indent, yPos);
      doc.text(lines, margin + indent + 6, yPos);
      yPos += lines.length * 5.5 + 2;
    });
    yPos += 3;
  };

  // ═══════════════════════════════════════════
  // COVER PAGE
  // ═══════════════════════════════════════════
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, pageWidth, 100, 'F');
  
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(plan.title || 'Training Plan Report', pageWidth / 2, 40, { align: 'center' });
  
  doc.setFontSize(14);
  doc.text('Strategic Training & Development Report', pageWidth / 2, 55, { align: 'center' });

  doc.setFontSize(11);
  doc.setTextColor(220, 220, 255);
  doc.text(`${requirements.company || 'Company'} | ${requirements.industry || 'Industry'}`, pageWidth / 2, 72, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageWidth / 2, 82, { align: 'center' });

  // Info box
  yPos = 115;
  doc.setFillColor(245, 245, 250);
  doc.roundedRect(margin, yPos - 5, contentWidth, 50, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(...DARK);
  const infoItems = [
    [`Duration: ${requirements.duration} months`, `Budget: ${requirements.budget?.toLocaleString()} MAD`],
    [`Company Size: ${requirements.companySize}`, `Modules: ${plan.modules?.length || 0}`],
    [`Skills Targeted: ${requirements.targetSkills?.length || 0}`, `Objectives: ${requirements.objectives?.length || 0}`],
  ];
  infoItems.forEach((row, i) => {
    doc.text(row[0], margin + 10, yPos + 8 + i * 14);
    doc.text(row[1], pageWidth / 2 + 10, yPos + 8 + i * 14);
  });

  // Table of contents
  yPos = 185;
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY);
  doc.text('Table of Contents', margin, yPos);
  yPos += 12;
  
  const tocItems = [
    '1. Executive Summary',
    '2. Market Research Analysis',
    '3. SWOT Analysis',
    '4. PESTEL Analysis',
    '5. Training Plan Overview',
    '6. Training Modules',
    '7. Budget Breakdown',
    '8. Key Performance Indicators',
    '9. Implementation Roadmap',
    '10. Risk Assessment',
    '11. Strategic Recommendations',
    '12. Regulatory Framework',
    '13. Innovation & Sustainability',
  ];
  doc.setFontSize(10);
  doc.setTextColor(...GRAY);
  tocItems.forEach(item => {
    doc.text(item, margin + 10, yPos);
    yPos += 7;
  });

  // ═══════════════════════════════════════════
  // 1. EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════
  doc.addPage();
  yPos = 25;
  drawSectionHeader('1. Executive Summary');
  if (plan.executive_summary) {
    drawParagraph(plan.executive_summary);
  } else {
    drawParagraph(plan.description || 'No executive summary available.');
  }

  // ═══════════════════════════════════════════
  // 2. MARKET RESEARCH
  // ═══════════════════════════════════════════
  drawSectionHeader('2. Market Research Analysis');
  if (plan.market_research) {
    const mr = plan.market_research;
    if (mr.market_overview) {
      drawSubHeader('Market Overview');
      drawParagraph(mr.market_overview);
    }

    if (mr.market_size || mr.growth_rate) {
      checkPageBreak(30);
      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ...(mr.market_size ? [['Market Size', mr.market_size]] : []),
          ...(mr.growth_rate ? [['Growth Rate', mr.growth_rate]] : []),
        ],
        theme: 'grid',
        headStyles: { fillColor: [...PRIMARY] as any },
        margin: { left: margin, right: margin },
        styles: { fontSize: 9 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    if (mr.key_trends?.length) {
      drawSubHeader('Key Market Trends');
      drawBulletList(mr.key_trends);
    }
    if (mr.competitive_landscape) {
      drawSubHeader('Competitive Landscape');
      drawParagraph(mr.competitive_landscape);
    }
    if (mr.target_audience_analysis) {
      drawSubHeader('Target Audience Analysis');
      drawParagraph(mr.target_audience_analysis);
    }
    if (mr.demand_drivers?.length) {
      drawSubHeader('Demand Drivers');
      drawBulletList(mr.demand_drivers);
    }
    if (mr.market_challenges?.length) {
      drawSubHeader('Market Challenges');
      drawBulletList(mr.market_challenges);
    }
  } else {
    drawParagraph('Market research data not available for this plan.');
  }

  // ═══════════════════════════════════════════
  // 3. SWOT ANALYSIS
  // ═══════════════════════════════════════════
  drawSectionHeader('3. SWOT Analysis');
  if (plan.swot_analysis) {
    const swot = plan.swot_analysis;
    const swotSections: [string, string[], [number, number, number]][] = [
      ['Strengths', swot.strengths || [], [22, 163, 74]],
      ['Weaknesses', swot.weaknesses || [], [220, 38, 38]],
      ['Opportunities', swot.opportunities || [], [37, 99, 235]],
      ['Threats', swot.threats || [], [234, 88, 12]],
    ];

    swotSections.forEach(([label, items, color]) => {
      if (items.length > 0) {
        checkPageBreak(20);
        doc.setFontSize(11);
        doc.setTextColor(...(color as [number, number, number]));
        doc.setFont('helvetica', 'bold');
        doc.text(label, margin + 5, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...DARK);
        drawBulletList(items, 10);
      }
    });

    if (swot.strategic_implications) {
      drawSubHeader('Strategic Implications');
      drawParagraph(swot.strategic_implications);
    }
  } else {
    drawParagraph('SWOT analysis not available for this plan.');
  }

  // ═══════════════════════════════════════════
  // 4. PESTEL ANALYSIS
  // ═══════════════════════════════════════════
  drawSectionHeader('4. PESTEL Analysis');
  if (plan.pestel_analysis) {
    const pestel = plan.pestel_analysis;
    const pestelSections: [string, string[]][] = [
      ['Political', pestel.political || []],
      ['Economic', pestel.economic || []],
      ['Social', pestel.social || []],
      ['Technological', pestel.technological || []],
      ['Environmental', pestel.environmental || []],
      ['Legal', pestel.legal || []],
    ];

    pestelSections.forEach(([label, items]) => {
      if (items.length > 0) {
        drawSubHeader(label);
        drawBulletList(items, 10);
      }
    });

    if (pestel.key_implications) {
      drawSubHeader('Key Implications');
      drawParagraph(pestel.key_implications);
    }
  } else {
    drawParagraph('PESTEL analysis not available for this plan.');
  }

  // ═══════════════════════════════════════════
  // 5. PLAN OVERVIEW
  // ═══════════════════════════════════════════
  drawSectionHeader('5. Training Plan Overview');
  drawParagraph(plan.description);

  if (requirements.objectives?.length > 0) {
    drawSubHeader('Training Objectives');
    drawBulletList(requirements.objectives);
  }
  if (requirements.targetSkills?.length > 0) {
    drawSubHeader('Target Skills');
    drawParagraph(requirements.targetSkills.join(', '));
  }

  // ═══════════════════════════════════════════
  // 6. MODULES
  // ═══════════════════════════════════════════
  if (plan.modules?.length > 0) {
    drawSectionHeader('6. Training Modules');
    
    const moduleData = plan.modules.map((m: any, idx: number) => [
      (idx + 1).toString(),
      m.title || m.name || '',
      m.duration || 'N/A',
      m.type || m.delivery_method || 'Mixed',
      m.certification_level || 'N/A',
      typeof m.estimated_cost === 'number' ? `${m.estimated_cost.toLocaleString()} MAD` : 'N/A',
    ]);

    checkPageBreak(40);
    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Module', 'Duration', 'Type', 'Level', 'Cost']],
      body: moduleData,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY] as any, fontSize: 9 },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
      columnStyles: { 0: { cellWidth: 10 }, 1: { cellWidth: 55 } },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    // Module details
    plan.modules.forEach((m: any, idx: number) => {
      drawSubHeader(`Module ${idx + 1}: ${m.title || m.name}`);
      if (m.description) drawParagraph(m.description, 5);
      if (m.skills_covered?.length) {
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        checkPageBreak(8);
        doc.text(`Skills: ${m.skills_covered.join(', ')}`, margin + 10, yPos);
        yPos += 7;
      }
      if (m.assessment_methods?.length) {
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        checkPageBreak(8);
        doc.text(`Assessment: ${m.assessment_methods.join(', ')}`, margin + 10, yPos);
        yPos += 7;
      }
      yPos += 3;
    });
  }

  // ═══════════════════════════════════════════
  // 7. BUDGET
  // ═══════════════════════════════════════════
  if (plan.budget_breakdown) {
    drawSectionHeader('7. Budget Breakdown');
    const budgetData = Object.entries(plan.budget_breakdown).map(([key, value]) => [
      key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      typeof value === 'number' ? `${value.toLocaleString()} MAD` : String(value),
    ]);
    const total = Object.values(plan.budget_breakdown).reduce((sum: number, v) => sum + (typeof v === 'number' ? v : 0), 0);
    budgetData.push(['TOTAL', `${(total as number).toLocaleString()} MAD`]);

    checkPageBreak(40);
    autoTable(doc, {
      startY: yPos,
      head: [['Category', 'Amount']],
      body: budgetData,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY] as any },
      margin: { left: margin, right: margin },
      styles: { fontSize: 9 },
      didParseCell: (data: any) => {
        if (data.row.index === budgetData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fillColor = [240, 240, 250];
        }
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // ═══════════════════════════════════════════
  // 8. KPIs
  // ═══════════════════════════════════════════
  if (plan.kpis?.length > 0) {
    drawSectionHeader('8. Key Performance Indicators');
    const kpiData = plan.kpis.map((kpi: any) => [
      kpi.name,
      kpi.target,
      kpi.measurement_frequency || 'Quarterly',
      kpi.baseline || 'N/A',
      kpi.improvement_expected || 'N/A',
    ]);

    checkPageBreak(40);
    autoTable(doc, {
      startY: yPos,
      head: [['KPI', 'Target', 'Frequency', 'Baseline', 'Expected Improvement']],
      body: kpiData,
      theme: 'grid',
      headStyles: { fillColor: [...PRIMARY] as any, fontSize: 8 },
      styles: { fontSize: 8 },
      margin: { left: margin, right: margin },
    });
    yPos = (doc as any).lastAutoTable.finalY + 12;
  }

  // ═══════════════════════════════════════════
  // 9. IMPLEMENTATION ROADMAP
  // ═══════════════════════════════════════════
  if (plan.implementation_roadmap?.phases?.length) {
    drawSectionHeader('9. Implementation Roadmap');
    plan.implementation_roadmap.phases.forEach((phase: any) => {
      drawSubHeader(`${phase.name} (${phase.duration})`);
      if (phase.activities?.length) {
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        checkPageBreak(6);
        doc.text('Activities:', margin + 5, yPos);
        yPos += 6;
        drawBulletList(phase.activities, 10);
      }
      if (phase.deliverables?.length) {
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        checkPageBreak(6);
        doc.text('Deliverables:', margin + 5, yPos);
        yPos += 6;
        drawBulletList(phase.deliverables, 10);
      }
    });
  }

  // ═══════════════════════════════════════════
  // 10. RISK ASSESSMENT
  // ═══════════════════════════════════════════
  if (plan.risk_assessment) {
    drawSectionHeader('10. Risk Assessment');
    const ra = plan.risk_assessment;
    if (ra.high_risks?.length) {
      drawSubHeader('High Risks');
      drawBulletList(ra.high_risks, 10);
    }
    if (ra.medium_risks?.length) {
      drawSubHeader('Medium Risks');
      drawBulletList(ra.medium_risks, 10);
    }
    if (ra.mitigation_strategies?.length) {
      drawSubHeader('Mitigation Strategies');
      drawBulletList(ra.mitigation_strategies, 10);
    }
    if (ra.contingency_plans?.length) {
      drawSubHeader('Contingency Plans');
      drawBulletList(ra.contingency_plans, 10);
    }
  }

  // ═══════════════════════════════════════════
  // 11. RECOMMENDATIONS
  // ═══════════════════════════════════════════
  if (plan.recommendations?.length > 0) {
    drawSectionHeader('11. Strategic Recommendations');
    plan.recommendations.forEach((rec: string, idx: number) => {
      checkPageBreak(12);
      doc.setFontSize(10);
      doc.setTextColor(...DARK);
      const lines = doc.splitTextToSize(`${idx + 1}. ${rec}`, contentWidth - 10);
      doc.text(lines, margin + 5, yPos);
      yPos += lines.length * 5.5 + 3;
    });
    yPos += 5;
  }

  // ═══════════════════════════════════════════
  // 12. REGULATORY FRAMEWORK
  // ═══════════════════════════════════════════
  if (plan.regulatory_framework) {
    drawSectionHeader('12. Regulatory Framework');
    const rf = plan.regulatory_framework;
    if (rf.country) {
      drawSubHeader(`Country: ${rf.country}`);
    }
    if (rf.governing_bodies?.length) {
      drawSubHeader('Governing Bodies');
      drawBulletList(rf.governing_bodies, 10);
    }
    if (rf.key_regulations?.length) {
      drawSubHeader('Key Regulations');
      drawBulletList(rf.key_regulations, 10);
    }
    if (rf.funding_programs?.length) {
      drawSubHeader('Funding Programs');
      drawBulletList(rf.funding_programs, 10);
    }
    if (rf.compliance_checklist?.length) {
      drawSubHeader('Compliance Checklist');
      drawBulletList(rf.compliance_checklist, 10);
    }
  }

  // ═══════════════════════════════════════════
  // 13. INNOVATION & SUSTAINABILITY
  // ═══════════════════════════════════════════
  if (plan.innovation_features || plan.sustainability_plan) {
    drawSectionHeader('13. Innovation & Sustainability');
    
    if (plan.innovation_features) {
      drawSubHeader('Innovation Features');
      Object.entries(plan.innovation_features).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setTextColor(...PRIMARY);
          doc.setFont('helvetica', 'bold');
          doc.text(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ':', margin + 5, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          const lines = doc.splitTextToSize(value, contentWidth - 15);
          doc.text(lines, margin + 10, yPos);
          yPos += lines.length * 5 + 4;
        }
      });
    }

    if (plan.sustainability_plan) {
      drawSubHeader('Sustainability Plan');
      Object.entries(plan.sustainability_plan).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          checkPageBreak(12);
          doc.setFontSize(9);
          doc.setTextColor(...PRIMARY);
          doc.setFont('helvetica', 'bold');
          doc.text(key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ':', margin + 5, yPos);
          yPos += 5;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(...DARK);
          const lines = doc.splitTextToSize(value, contentWidth - 15);
          doc.text(lines, margin + 10, yPos);
          yPos += lines.length * 5 + 4;
        }
      });
    }
  }

  // SUCCESS METRICS
  if (plan.success_metrics?.length) {
    drawSectionHeader('Success Metrics');
    drawBulletList(plan.success_metrics.map(m => `✓ ${m}`));
  }

  // ═══════════════════════════════════════════
  // FOOTER ON ALL PAGES
  // ═══════════════════════════════════════════
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Footer line
    doc.setDrawColor(...LIGHT_GRAY);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(
      `${requirements.company || 'Company'} — Strategic Training Report`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: 'right' }
    );
  }

  const fileName = `${(plan.title || 'Training_Plan').replace(/[^a-z0-9]/gi, '_')}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
  return fileName;
};
