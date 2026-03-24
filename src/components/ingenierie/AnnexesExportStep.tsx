import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, FileText, Download, Upload, CheckCircle2, Lock, ExternalLink } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { IngenierieDossier } from '@/hooks/useIngenierie';

const db = supabase as any;

interface Props {
  dossier: IngenierieDossier;
  completedSteps: number[];
  onSave: (data: Partial<IngenierieDossier>) => Promise<void>;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExporting: boolean;
  onPrev: () => void;
}

const REQUIRED_DOCS = [
  { key: 'csf_attestation', labelFr: 'Attestation CSF OFPPT', labelEn: 'CSF OFPPT Attestation', required: true },
  { key: 'giac_attestation', labelFr: 'Attestation GIAC', labelEn: 'GIAC Attestation', required: true },
  { key: 'convention', labelFr: 'Convention de formation signée', labelEn: 'Signed training agreement', required: false },
  { key: 'devis', labelFr: 'Devis prestataires', labelEn: 'Provider quotes', required: false },
];

export function AnnexesExportStep({ dossier, completedSteps, onSave, onExportPDF, onExportDOCX, isExporting, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedUrls, setUploadedUrls] = useState<Record<string, string>>({
    csf_attestation: dossier.csf_attestation_url ?? '',
    giac_attestation: dossier.giac_attestation_url ?? '',
  });

  const allStepsComplete = [1, 2, 3, 4, 5, 6].every((s) => completedSteps.includes(s));

  const handleUpload = async (docKey: string, file: File) => {
    setUploading(docKey);
    try {
      const path = `ingenierie/${dossier.id}/${docKey}-${Date.now()}-${file.name}`;
      const { error: uploadError } = await db.storage.from('ofppt-documents').upload(path, file);
      if (uploadError) throw uploadError;
      const { data: urlData } = db.storage.from('ofppt-documents').getPublicUrl(path);
      const url = urlData.publicUrl;
      setUploadedUrls((prev) => ({ ...prev, [docKey]: url }));
      if (docKey === 'csf_attestation') await onSave({ csf_attestation_url: url });
      if (docKey === 'giac_attestation') await onSave({ giac_attestation_url: url });
      toast.success(fr ? 'Document téléversé' : 'Document uploaded');
    } catch {
      toast.error(fr ? 'Erreur lors du téléversement' : 'Upload error');
    } finally {
      setUploading(null);
    }
  };

  const handleFinalize = async () => {
    await onSave({ status: 'finalized' });
    toast.success(fr ? 'Dossier finalisé !' : 'Dossier finalized!');
  };

  return (
    <div className="space-y-6">
      {/* Step completion checklist */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{fr ? 'Checklist dossier' : 'Dossier checklist'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { step: 1, labelFr: 'Fiche signalétique', labelEn: 'Company info' },
              { step: 2, labelFr: 'Analyse SWOT', labelEn: 'SWOT analysis' },
              { step: 3, labelFr: 'Besoins de formation', labelEn: 'Training needs' },
              { step: 4, labelFr: 'Fiches techniques', labelEn: 'Training actions' },
              { step: 5, labelFr: 'Budget prévisionnel', labelEn: 'Budget' },
              { step: 6, labelFr: 'Calendrier', labelEn: 'Calendar' },
            ].map(({ step, labelFr: lFr, labelEn: lEn }) => {
              const done = completedSteps.includes(step);
              return (
                <div key={step} className="flex items-center gap-2 text-sm">
                  {done
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <div className="h-4 w-4 rounded-full border-2 border-gray-300" />}
                  <span className={cn(done ? 'text-gray-900' : 'text-muted-foreground')}>
                    {fr ? lFr : lEn}
                  </span>
                  {!done && <Badge variant="outline" className="text-xs text-orange-600">{fr ? 'Incomplet' : 'Incomplete'}</Badge>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document upload */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{fr ? 'Documents annexes' : 'Annexe documents'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {REQUIRED_DOCS.map((doc) => {
            const uploaded = uploadedUrls[doc.key];
            return (
              <div key={doc.key} className="flex items-center justify-between gap-3 p-3 rounded-lg border">
                <div className="flex items-center gap-2">
                  {uploaded
                    ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                    : <div className={cn('h-4 w-4 rounded-full border-2', doc.required ? 'border-red-400' : 'border-gray-300')} />}
                  <div>
                    <p className="text-sm font-medium">{fr ? doc.labelFr : doc.labelEn}</p>
                    {doc.required && !uploaded && (
                      <p className="text-xs text-red-500">{fr ? 'Requis' : 'Required'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {uploaded && (
                    <a href={uploaded} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </a>
                  )}
                  <label>
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.jpg,.png"
                      onChange={(e) => e.target.files?.[0] && handleUpload(doc.key, e.target.files[0])}
                    />
                    <Button size="sm" variant="outline" className="h-7 text-xs cursor-pointer" asChild>
                      <span>
                        <Upload className="h-3 w-3 mr-1" />
                        {uploading === doc.key ? (fr ? 'Envoi...' : 'Uploading...') : (uploaded ? (fr ? 'Remplacer' : 'Replace') : (fr ? 'Téléverser' : 'Upload'))}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Export section */}
      <Card className={cn(!allStepsComplete && 'opacity-60')}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">{fr ? 'Export du dossier' : 'Dossier export'}</CardTitle>
            {!allStepsComplete && <Lock className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!allStepsComplete && (
            <Alert>
              <AlertDescription className="text-xs">
                {fr ? 'Complétez toutes les étapes pour activer l\'export.' : 'Complete all steps to enable export.'}
              </AlertDescription>
            </Alert>
          )}
          <div className="flex gap-3">
            <Button onClick={onExportPDF} disabled={!allStepsComplete || isExporting} className="flex-1">
              <FileText className="h-4 w-4 mr-2" />
              {fr ? 'Exporter en PDF' : 'Export PDF'}
            </Button>
            <Button onClick={onExportDOCX} variant="outline" disabled={!allStepsComplete || isExporting} className="flex-1">
              <Download className="h-4 w-4 mr-2" />
              {fr ? 'Exporter en Word' : 'Export Word'}
            </Button>
          </div>
          {dossier.status !== 'finalized' && dossier.status !== 'submitted' && (
            <Button onClick={handleFinalize} disabled={!allStepsComplete} variant="default" className="w-full bg-green-600 hover:bg-green-700">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {fr ? 'Finaliser le dossier' : 'Finalize dossier'}
            </Button>
          )}
          {(dossier.status === 'finalized' || dossier.status === 'submitted') && (
            <Badge className="w-full justify-center py-2 bg-green-100 text-green-700 text-sm">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {dossier.status === 'submitted' ? (fr ? 'Dossier soumis' : 'Dossier submitted') : (fr ? 'Dossier finalisé' : 'Dossier finalized')}
            </Badge>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Link to="/workflow/track/reimbursement">
          <Button variant="ghost" className="text-sm text-muted-foreground">
            {fr ? 'Aller au suivi remboursement →' : 'Go to reimbursement tracking →'}
          </Button>
        </Link>
      </div>
    </div>
  );
}
