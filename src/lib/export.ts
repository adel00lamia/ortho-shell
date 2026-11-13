/**
 * Data export utilities — CSV and simple PDF generation.
 * No external dependencies required.
 */

// ─── CSV ───────────────────────────────────────────────────
interface CsvOptions {
  filename: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export function exportCsv({ filename, headers, rows }: CsvOptions) {
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ].join('\n');

  downloadBlob(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
}

// ─── Simple Print-Based PDF ────────────────────────────────
interface PdfOptions {
  title: string;
  subtitle?: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  orientation?: 'portrait' | 'landscape';
}

export function exportPdf({ title, subtitle, headers, rows, orientation = 'portrait' }: PdfOptions) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    @page { size: A4 ${orientation}; margin: 20mm; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; margin: 0; padding: 20px; }
    h1 { font-size: 20px; margin-bottom: 4px; color: #1a1a2e; }
    .subtitle { font-size: 13px; color: #666; margin-bottom: 20px; }
    .meta { font-size: 11px; color: #999; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f0f0f5; text-align: left; padding: 10px 12px; font-weight: 600; border-bottom: 2px solid #ddd; }
    td { padding: 8px 12px; border-bottom: 1px solid #eee; }
    tr:nth-child(even) td { background: #fafafa; }
    .footer { margin-top: 24px; font-size: 10px; color: #aaa; text-align: center; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  ${subtitle ? `<p class="subtitle">${subtitle}</p>` : ''}
  <p class="meta">Generated on ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} — Qimatak</p>
  <table>
    <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${cell ?? ''}</td>`).join('')}</tr>`).join('')}</tbody>
  </table>
  <p class="footer">© ${new Date().getFullYear()} Qimatak — Confidential</p>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

// ─── JSON Export ───────────────────────────────────────────
export function exportJson(data: unknown, filename: string) {
  const json = JSON.stringify(data, null, 2);
  downloadBlob(json, `${filename}.json`, 'application/json');
}

// ─── Helpers ───────────────────────────────────────────────
function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob(['\ufeff' + content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
