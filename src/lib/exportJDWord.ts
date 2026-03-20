/**
 * Export a Job Description as a professional .docx file
 */
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  Header, Footer, PageNumber, LevelFormat,
} from 'docx';
import { saveAs } from 'file-saver';

interface JDExportData {
  title: string;
  department?: string;
  level?: string;
  description?: string;
  responsibilities?: string[];
  required_skills?: any[];
  preferred_skills?: any[];
  competencies?: { name: string; requiredLevel: number; category?: string }[];
  companyName?: string;
}

const PRIMARY = '1A365D';
const ACCENT = '2B6CB0';
const LIGHT_BG = 'EBF4FF';
const BORDER_COLOR = 'CBD5E0';

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: BORDER_COLOR };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

export async function exportJDToWord(data: JDExportData, lang: string = 'en') {
  const fr = lang === 'fr';
  const today = new Date().toLocaleDateString(fr ? 'fr-FR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 } } },
      paragraphStyles: [
        {
          id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 36, bold: true, font: 'Calibri', color: PRIMARY },
          paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 },
        },
        {
          id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
          run: { size: 28, bold: true, font: 'Calibri', color: ACCENT },
          paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({ text: data.companyName || 'TrainPro Academy', font: 'Calibri', size: 18, color: '999999' }),
              ],
              border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'DDDDDD', space: 4 } },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: fr ? 'Page ' : 'Page ', size: 16, color: '999999' }),
                new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '999999' }),
              ],
            }),
          ],
        }),
      },
      children: [
        // Title block
        new Paragraph({
          spacing: { after: 80 },
          children: [new TextRun({ text: fr ? 'FICHE DE POSTE' : 'JOB DESCRIPTION', size: 20, bold: true, color: '999999', font: 'Calibri' })],
        }),
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          children: [new TextRun({ text: data.title })],
        }),

        // Info table
        buildInfoTable(data, fr, today),

        // Description
        ...(data.description ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr ? 'Description du poste' : 'Job Description' })] }),
          new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: data.description, size: 22 })] }),
        ] : []),

        // Responsibilities
        ...(data.responsibilities && data.responsibilities.length > 0 ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr ? 'Responsabilités clés' : 'Key Responsibilities' })] }),
          ...data.responsibilities.map(r =>
            new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              spacing: { after: 80 },
              children: [new TextRun({ text: r, size: 22 })],
            })
          ),
        ] : []),

        // Competencies table
        ...(data.competencies && data.competencies.length > 0 ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr ? 'Compétences requises' : 'Required Competencies' })] }),
          buildCompetenciesTable(data.competencies, fr),
        ] : []),

        // Skills
        ...(data.required_skills && data.required_skills.length > 0 ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr ? 'Compétences techniques' : 'Technical Skills' })] }),
          ...data.required_skills.map(s =>
            new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              spacing: { after: 60 },
              children: [new TextRun({ text: typeof s === 'string' ? s : s.name || String(s), size: 22 })],
            })
          ),
        ] : []),

        ...(data.preferred_skills && data.preferred_skills.length > 0 ? [
          new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: fr ? 'Compétences souhaitées' : 'Preferred Skills' })] }),
          ...data.preferred_skills.map(s =>
            new Paragraph({
              numbering: { reference: 'bullets', level: 0 },
              spacing: { after: 60 },
              children: [new TextRun({ text: typeof s === 'string' ? s : s.name || String(s), size: 22 })],
            })
          ),
        ] : []),

        // Footer note
        new Paragraph({ spacing: { before: 600 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({
            text: fr ? `Document généré le ${today} — ${data.companyName || 'TrainPro Academy'}`
              : `Generated on ${today} — ${data.companyName || 'TrainPro Academy'}`,
            size: 18, color: 'AAAAAA', italics: true,
          })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  const filename = `${data.title.replace(/[^a-zA-Z0-9À-ÿ ]/g, '').replace(/\s+/g, '_')}_JD.docx`;
  saveAs(blob, filename);
  return filename;
}

function buildInfoTable(data: JDExportData, fr: boolean, date: string): Table {
  const rows: [string, string][] = [];
  if (data.department) rows.push([fr ? 'Département' : 'Department', data.department]);
  if (data.level) rows.push([fr ? 'Niveau' : 'Level', data.level]);
  rows.push([fr ? 'Date' : 'Date', date]);

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [3000, 6026],
    rows: rows.map(([label, value]) =>
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders,
            width: { size: 3000, type: WidthType.DXA },
            shading: { fill: LIGHT_BG, type: ShadingType.CLEAR },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 22, color: PRIMARY })] })],
          }),
          new TableCell({
            borders: cellBorders,
            width: { size: 6026, type: WidthType.DXA },
            margins: { top: 60, bottom: 60, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: value, size: 22 })] })],
          }),
        ],
      })
    ),
  });
}

function buildCompetenciesTable(competencies: { name: string; requiredLevel: number; category?: string }[], fr: boolean): Table {
  const headerRow = new TableRow({
    children: [
      fr ? 'Compétence' : 'Competency',
      fr ? 'Catégorie' : 'Category',
      fr ? 'Niveau requis' : 'Required Level',
    ].map((text, i) =>
      new TableCell({
        borders: cellBorders,
        width: { size: i === 0 ? 3500 : i === 1 ? 3026 : 2500, type: WidthType.DXA },
        shading: { fill: PRIMARY, type: ShadingType.CLEAR },
        margins: { top: 60, bottom: 60, left: 120, right: 120 },
        children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20, color: 'FFFFFF' })] })],
      })
    ),
  });

  const levelLabel = (l: number) => {
    const labels = fr
      ? ['', 'Débutant', 'Base', 'Intermédiaire', 'Avancé', 'Expert']
      : ['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];
    return `${l}/5 — ${labels[l] || ''}`;
  };

  const dataRows = competencies.map(c =>
    new TableRow({
      children: [
        new TableCell({
          borders: cellBorders, width: { size: 3500, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: c.name, size: 22, bold: true })] })],
        }),
        new TableCell({
          borders: cellBorders, width: { size: 3026, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: c.category || '—', size: 22 })] })],
        }),
        new TableCell({
          borders: cellBorders, width: { size: 2500, type: WidthType.DXA },
          margins: { top: 60, bottom: 60, left: 120, right: 120 },
          shading: { fill: c.requiredLevel >= 4 ? 'FFF5F5' : c.requiredLevel >= 3 ? 'FFFFF0' : 'F0FFF4', type: ShadingType.CLEAR },
          children: [new Paragraph({ children: [new TextRun({ text: levelLabel(c.requiredLevel), size: 22 })] })],
        }),
      ],
    })
  );

  return new Table({
    width: { size: 9026, type: WidthType.DXA },
    columnWidths: [3500, 3026, 2500],
    rows: [headerRow, ...dataRows],
  });
}
