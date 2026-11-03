import { useState, useEffect } from 'react';
import { useIngenierieDossier, useIngenierieActions } from '@/hooks/useIngenierie';
import { useIngenierieExport } from '@/hooks/useIngenierieExport';
import { useLanguage } from '@/contexts/LanguageContext';
import { WizardHeader } from '@/components/ingenierie/WizardHeader';
import { OFPPTDeadlineAlert } from '@/components/ingenierie/OFPPTDeadlineAlert';
import { FicheSignaletiqueStep } from '@/components/ingenierie/FicheSignaletiqueStep';
import { SWOTStep } from '@/components/ingenierie/SWOTStep';
import { BesoinsStep } from '@/components/ingenierie/BesoinsStep';
import { FichesTechniquesStep } from '@/components/ingenierie/FichesTechniquesStep';
import { BudgetStep } from '@/components/ingenierie/BudgetStep';
import { CalendrierStep } from '@/components/ingenierie/CalendrierStep';
import { AnnexesExportStep } from '@/components/ingenierie/AnnexesExportStep';
import type { IngenierieDossier } from '@/hooks/useIngenierie';

const Loader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const CURRENT_YEAR = new Date().getFullYear();

export default function IngenieriePage() {
  const { language } = useLanguage();

  const { dossier, isLoading, createDossier, updateDossier, advanceStep } = useIngenierieDossier(CURRENT_YEAR);
  const { actions, addAction, updateAction, deleteAction } = useIngenierieActions(dossier?.id ?? null);

  const companyName = 'Mon Entreprise';
  const { exportPDF, exportDOCX, isExporting } = useIngenierieExport(dossier, actions, companyName);

  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  useEffect(() => {
    if (dossier) {
      setCurrentStep(dossier.current_step ?? 1);
      setCompletedSteps(dossier.completed_steps ?? []);
    }
  }, [dossier?.id]);

  useEffect(() => {
    if (!isLoading && !dossier) {
      createDossier.mutate({});
    }
  }, [isLoading, dossier]);

  const handleSave = async (data: Partial<IngenierieDossier>) => {
    if (!dossier) return;
    await updateDossier.mutateAsync({ id: dossier.id, ...data });
  };

  const handleAdvance = async (toStep: number) => {
    if (!dossier) return;
    const newCompleted = completedSteps.includes(currentStep)
      ? completedSteps
      : [...completedSteps, currentStep];
    setCompletedSteps(newCompleted);
    setCurrentStep(toStep);
    await advanceStep.mutateAsync({ id: dossier.id, step: toStep, completedSteps: newCompleted });
  };

  const handleNext = () => handleAdvance(Math.min(currentStep + 1, 7));
  const handlePrev = () => setCurrentStep((s) => Math.max(s - 1, 1));
  const handleStepClick = (step: number) => setCurrentStep(step);

  if (isLoading) return <Loader />;
  if (!dossier) return <Loader />;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <WizardHeader
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={handleStepClick}
        exerciseYear={CURRENT_YEAR}
        giacSector={dossier.giac_sector}
        status={dossier.status}
        onExportPDF={exportPDF}
        onExportDOCX={exportDOCX}
        isExporting={isExporting}
      />

      <div className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-4">
        <OFPPTDeadlineAlert />

        {currentStep === 1 && (
          <FicheSignaletiqueStep dossier={dossier} onSave={handleSave} onNext={handleNext} />
        )}
        {currentStep === 2 && (
          <SWOTStep dossier={dossier} onSave={handleSave} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 3 && (
          <BesoinsStep dossier={dossier} onSave={handleSave} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 4 && (
          <FichesTechniquesStep
            dossierId={dossier.id}
            actions={actions}
            onAddAction={async (a) => { await addAction.mutateAsync(a); }}
            onUpdateAction={async (a) => { await updateAction.mutateAsync(a); }}
            onDeleteAction={async (id) => { await deleteAction.mutateAsync(id); }}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        )}
        {currentStep === 5 && (
          <BudgetStep dossier={dossier} actions={actions} onSave={handleSave} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 6 && (
          <CalendrierStep actions={actions} exerciseYear={CURRENT_YEAR} onNext={handleNext} onPrev={handlePrev} />
        )}
        {currentStep === 7 && (
          <AnnexesExportStep
            dossier={dossier}
            completedSteps={completedSteps}
            onSave={handleSave}
            onExportPDF={exportPDF}
            onExportDOCX={exportDOCX}
            isExporting={isExporting}
            onPrev={handlePrev}
          />
        )}
      </div>
    </div>
  );
}
