/**
 * Export Org Chart as a professionally designed PDF using jsPDF
 */
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Department {
  id: string;
  name: string;
  description: string | null;
  employee_count: number;
  head_employee_name: string | null;
  parent_department_id: string | null;
  children?: Department[];
}

interface Position {
  id: string;
  title: string;
  level: string;
  status: string;
  current_holder_name: string | null;
  department_id: string | null;
  is_critical: boolean;
  match_score: number | null;
}

interface OrgChartExportData {
  companyName: string;
  departments: Department[];
  positions: Position[];
  lang: string;
}

const PRIMARY_RGB: [number, number, number] = [26, 54, 93];
const ACCENT_RGB: [number, number, number] = [43, 108, 176];
const LIGHT_BG: [number, number, number] = [235, 244, 255];
const CRITICAL_RGB: [number, number, number] = [217, 119, 6];
const OPEN_RGB: [number, number, number] = [220, 38, 38];

export function exportOrgChartPDF(data: OrgChartExportData) {
  const { companyName, departments, positions, lang } = data;
  const fr = lang === 'fr';
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  let y = 0;

  const addFooter = () => {
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(160);
      doc.text(`${companyName} — ${fr ? 'Organigramme' : 'Organization Chart'}`, 15, pageH - 8);
      doc.text(`${fr ? 'Page' : 'Page'} ${i}/${pages}`, pageW - 30, pageH - 8);
    }
  };

  // Cover section
  doc.setFillColor(...PRIMARY_RGB);
  doc.rect(0, 0, pageW, 50, 'F');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text(fr ? 'Organigramme' : 'Organization Chart', 20, 30);
  doc.setFontSize(14);
  doc.text(companyName, 20, 42);

  // Stats bar
  y = 58;
  const openCount = positions.filter(p => p.status === 'open').length;
  const criticalCount = positions.filter(p => p.is_critical).length;
  const filledCount = positions.filter(p => p.status === 'filled').length;

  const stats = [
    { label: fr ? 'Départements' : 'Departments', value: String(departments.length), color: PRIMARY_RGB },
    { label: fr ? 'Postes total' : 'Total Positions', value: String(positions.length), color: ACCENT_RGB },
    { label: fr ? 'Postes pourvus' : 'Filled', value: String(filledCount), color: [22, 163, 74] as [number, number, number] },
    { label: fr ? 'Postes ouverts' : 'Open', value: String(openCount), color: OPEN_RGB },
    { label: fr ? 'Postes critiques' : 'Critical', value: String(criticalCount), color: CRITICAL_RGB },
  ];

  const boxW = (pageW - 40) / stats.length;
  stats.forEach((s, i) => {
    const x = 15 + i * boxW + 3;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(x, y, boxW - 6, 22, 3, 3, 'F');
    doc.setFontSize(18);
    doc.setTextColor(...s.color);
    doc.text(s.value, x + (boxW - 6) / 2, y + 11, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(s.label, x + (boxW - 6) / 2, y + 18, { align: 'center' });
  });

  y = 88;

  // Build tree
  const tree = buildTree(departments);
  const deptPositions = (deptId: string) => positions.filter(p => p.department_id === deptId);

  // Render departments as table
  const tableData: any[][] = [];

  const flattenTree = (dept: Department, depth: number = 0) => {
    const dPos = deptPositions(dept.id);
    const prefix = '  '.repeat(depth) + (depth > 0 ? '└ ' : '');
    tableData.push([
      { content: prefix + dept.name, styles: { fontStyle: 'bold', textColor: PRIMARY_RGB } },
      dept.head_employee_name || '—',
      String(dPos.length),
      String(dPos.filter(p => p.status === 'open').length),
      String(dPos.filter(p => p.is_critical).length),
    ]);

    // Add positions under department
    dPos.forEach(p => {
      const statusColor = p.status === 'open' ? OPEN_RGB : p.status === 'filled' ? [22, 163, 74] : [120, 120, 120];
      tableData.push([
        { content: '  '.repeat(depth + 1) + '  • ' + p.title, styles: { textColor: [80, 80, 80] as [number, number, number], fontSize: 8 } },
        p.current_holder_name || (fr ? 'Vacant' : 'Vacant'),
        p.level || '—',
        { content: p.status, styles: { textColor: statusColor as [number, number, number] } },
        p.is_critical ? '⚠' : '',
      ]);
    });

    dept.children?.forEach(child => flattenTree(child, depth + 1));
  };

  tree.forEach(dept => flattenTree(dept));

  // Unassigned positions
  const unassigned = positions.filter(p => !p.department_id);
  if (unassigned.length > 0) {
    tableData.push([
      { content: fr ? '— Non assignés —' : '— Unassigned —', colSpan: 5, styles: { fontStyle: 'bold', textColor: CRITICAL_RGB, fillColor: [255, 248, 235] } },
    ]);
    unassigned.forEach(p => {
      tableData.push([
        '  • ' + p.title,
        p.current_holder_name || (fr ? 'Vacant' : 'Vacant'),
        p.level || '—',
        p.status,
        p.is_critical ? '⚠' : '',
      ]);
    });
  }

  (doc as any).autoTable({
    startY: y,
    head: [[
      fr ? 'Département / Poste' : 'Department / Position',
      fr ? 'Responsable / Occupant' : 'Head / Holder',
      fr ? 'Effectif / Niveau' : 'Count / Level',
      fr ? 'Statut' : 'Status',
      fr ? 'Critique' : 'Critical',
    ]],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3, lineColor: [200, 200, 200], lineWidth: 0.2 },
    headStyles: { fillColor: PRIMARY_RGB, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: [250, 250, 255] },
    margin: { left: 15, right: 15 },
    didDrawPage: () => {
      // Re-draw header on continuation pages
    },
  });

  // Date stamp
  const finalY = (doc as any).lastAutoTable?.finalY || y + 20;
  doc.setFontSize(8);
  doc.setTextColor(160);
  const dateStr = new Date().toLocaleDateString(fr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(
    fr ? `Généré le ${dateStr}` : `Generated on ${dateStr}`,
    pageW / 2, finalY + 8, { align: 'center' }
  );

  addFooter();

  const filename = `${companyName.replace(/\s+/g, '_')}_OrgChart_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
  return filename;
}

function buildTree(depts: Department[]): Department[] {
  const map = new Map<string, Department>();
  depts.forEach(d => map.set(d.id, { ...d, children: [] }));
  const roots: Department[] = [];
  depts.forEach(d => {
    const node = map.get(d.id)!;
    if (d.parent_department_id && map.has(d.parent_department_id)) {
      map.get(d.parent_department_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}
