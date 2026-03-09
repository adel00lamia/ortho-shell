import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download } from 'lucide-react';

interface CsvImportDialogProps {
  /** Column definitions expected in the CSV */
  columns: { key: string; label: string; required?: boolean }[];
  /** Called with parsed rows when user confirms */
  onImport: (rows: Record<string, string>[]) => Promise<void>;
  /** Template download data */
  templateFilename?: string;
  trigger?: React.ReactNode;
}

function parseCsv(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const rows = lines.slice(1).map(line => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; continue; }
      if (char === ',' && !inQuotes) { cells.push(current.trim()); current = ''; continue; }
      current += char;
    }
    cells.push(current.trim());
    return cells;
  });
  return { headers, rows };
}

export const CsvImportDialog = ({
  columns,
  onImport,
  templateFilename = 'import_template',
  trigger,
}: CsvImportDialogProps) => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const fileRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Record<string, string>[] | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { headers, rows } = parseCsv(text);
      const errs: string[] = [];

      // Validate headers
      const missingHeaders = columns
        .filter(c => c.required)
        .filter(c => !headers.includes(c.key))
        .map(c => c.label);

      if (missingHeaders.length) {
        errs.push(`${fr ? 'Colonnes manquantes' : 'Missing columns'}: ${missingHeaders.join(', ')}`);
      }

      // Parse rows
      const parsed = rows.map((row, i) => {
        const obj: Record<string, string> = {};
        headers.forEach((h, j) => { obj[h] = row[j] || ''; });

        // Check required fields
        columns.filter(c => c.required).forEach(c => {
          if (!obj[c.key]?.trim()) {
            errs.push(`${fr ? 'Ligne' : 'Row'} ${i + 2}: ${c.label} ${fr ? 'est vide' : 'is empty'}`);
          }
        });

        return obj;
      });

      setErrors(errs.slice(0, 10)); // cap at 10
      setPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    setImporting(true);
    try {
      await onImport(preview);
      setOpen(false);
      setPreview(null);
      setErrors([]);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const csv = columns.map(c => c.key).join(',') + '\n' +
      columns.map(c => c.required ? `Example ${c.label}` : '').join(',');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateFilename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setPreview(null); setErrors([]); } }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {fr ? 'Importer CSV' : 'Import CSV'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            {fr ? 'Importer depuis un CSV' : 'Import from CSV'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template download */}
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">
              {fr ? 'Télécharger le modèle CSV' : 'Download CSV template'}
            </span>
            <Button variant="ghost" size="sm" onClick={downloadTemplate} className="gap-1">
              <Download className="h-3 w-3" />
              {fr ? 'Modèle' : 'Template'}
            </Button>
          </div>

          {/* File input */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
          >
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {fr ? 'Cliquez pour sélectionner un fichier CSV' : 'Click to select a CSV file'}
            </p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
          </div>

          {/* Preview */}
          {preview && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {preview.length} {fr ? 'lignes trouvées' : 'rows found'}
                </Badge>
                {errors.length > 0 && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {errors.length} {fr ? 'erreurs' : 'errors'}
                  </Badge>
                )}
              </div>

              {errors.length > 0 && (
                <ScrollArea className="max-h-24 rounded border p-2">
                  {errors.map((err, i) => (
                    <p key={i} className="text-xs text-destructive">{err}</p>
                  ))}
                </ScrollArea>
              )}

              {/* Preview table */}
              <ScrollArea className="max-h-40 rounded border">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted">
                      {columns.map(c => (
                        <th key={c.key} className="px-2 py-1.5 text-left font-medium">{c.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.slice(0, 5).map((row, i) => (
                      <tr key={i} className="border-t">
                        {columns.map(c => (
                          <td key={c.key} className="px-2 py-1.5 truncate max-w-32">{row[c.key] || '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </ScrollArea>

              <Button
                onClick={handleImport}
                disabled={importing || errors.some(e => e.includes('Missing columns'))}
                className="w-full gap-2"
              >
                {importing
                  ? (fr ? 'Importation...' : 'Importing...')
                  : `${fr ? 'Importer' : 'Import'} ${preview.length} ${fr ? 'lignes' : 'rows'}`}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
