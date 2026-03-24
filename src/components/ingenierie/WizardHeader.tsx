import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Download, FileText } from 'lucide-react';
import { useDeadlineAlerts } from '@/hooks/useDeadlineAlerts';
import { useLanguage } from '@/contexts/LanguageContext';
import { AlertTriangle } from 'lucide-react';

const STEPS = [
  { id: 1, labelFr: 'Fiche signalétique', labelEn: 'Company Info' },
  { id: 2, labelFr: 'SWOT', labelEn: 'SWOT' },
  { id: 3, labelFr: 'Besoins', labelEn: 'Needs' },
  { id: 4, labelFr: 'Actions', labelEn: 'Actions' },
  { id: 5, labelFr: 'Budget', labelEn: 'Budget' },
  { id: 6, labelFr: 'Calendrier', labelEn: 'Calendar' },
  { id: 7, labelFr: 'Annexes', labelEn: 'Annexes' },
];

const GIAC_SECTORS: Record<string, string> = {
  IMMEE: 'IMMEE',
  'Textile-Cuir': 'Textile-Cuir',
  Technologies: 'Technologies',
  BTP: 'BTP',
  Tourisme: 'Tourisme',
  Agroalimentaire: 'Agroalimentaire',
  TRANSLOG: 'TRANSLOG',
  Tertiaire: 'Tertiaire',
  'Pêches-Maritimes': 'Pêches-Maritimes',
};

interface WizardHeaderProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
  exerciseYear: number;
  giacSector: string | null;
  status: string;
  onExportPDF: () => void;
  onExportDOCX: () => void;
  isExporting: boolean;
}

export function WizardHeader({
  currentStep,
  completedSteps,
  onStepClick,
  exerciseYear,
  giacSector,
  status,
  onExportPDF,
  onExportDOCX,
  isExporting,
}: WizardHeaderProps) {
  const { language } = useLanguage();
  const deadlines = useDeadlineAlerts();
  const urgentDeadlines = deadlines.filter((d) => d.variant === 'urgent' || d.variant === 'warning');

  const statusLabel: Record<string, { fr: string; en: string; color: string }> = {
    draft: { fr: 'Brouillon', en: 'Draft', color: 'bg-gray-100 text-gray-700' },
    in_progress: { fr: 'En cours', en: 'In Progress', color: 'bg-blue-100 text-blue-700' },
    finalized: { fr: 'Finalisé', en: 'Finalized', color: 'bg-green-100 text-green-700' },
    submitted: { fr: 'Soumis', en: 'Submitted', color: 'bg-purple-100 text-purple-700' },
  };

  const currentStatus = statusLabel[status] ?? statusLabel.draft;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 space-y-4">
      {/* Top row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-lg font-semibold text-gray-900">
            {language === 'fr' ? "Ingénierie de Formation" : "Training Engineering"}
            <span className="ml-2 text-gray-400 font-normal">{exerciseYear}</span>
          </h1>
          {giacSector && (
            <Badge variant="outline" className="text-xs font-medium border-green-600 text-green-700">
              GIAC {GIAC_SECTORS[giacSector] ?? giacSector}
            </Badge>
          )}
          <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', currentStatus.color)}>
            {language === 'fr' ? currentStatus.fr : currentStatus.en}
          </span>
        </div>

        {/* Deadline badges */}
        <div className="flex items-center gap-2">
          {urgentDeadlines.map((d) => (
            <span
              key={d.key}
              className={cn(
                'flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium',
                d.variant === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
              )}
            >
              <AlertTriangle className="h-3 w-3" />
              {language === 'fr' ? d.labelFr : d.labelEn}
              {' '}J-{d.daysUntil}
            </span>
          ))}
          <Button size="sm" variant="outline" onClick={onExportPDF} disabled={isExporting}>
            <FileText className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button size="sm" variant="outline" onClick={onExportDOCX} disabled={isExporting}>
            <Download className="h-4 w-4 mr-1" />
            Word
          </Button>
        </div>
      </div>

      {/* Step progress */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {STEPS.map((step, index) => {
          const isCompleted = completedSteps.includes(step.id);
          const isCurrent = currentStep === step.id;
          const isAccessible = step.id <= currentStep || isCompleted;

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isAccessible && onStepClick(step.id)}
                disabled={!isAccessible}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
                  isCurrent && 'bg-primary text-primary-foreground',
                  isCompleted && !isCurrent && 'bg-green-100 text-green-700 hover:bg-green-200',
                  !isCurrent && !isCompleted && isAccessible && 'text-gray-600 hover:bg-gray-100',
                  !isAccessible && 'text-gray-300 cursor-not-allowed'
                )}
              >
                {isCompleted && !isCurrent ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Circle className={cn('h-3.5 w-3.5', isCurrent && 'fill-current')} />
                )}
                <span>{language === 'fr' ? step.labelFr : step.labelEn}</span>
              </button>
              {index < STEPS.length - 1 && (
                <div className={cn('h-px w-4 mx-0.5', isCompleted ? 'bg-green-300' : 'bg-gray-200')} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
