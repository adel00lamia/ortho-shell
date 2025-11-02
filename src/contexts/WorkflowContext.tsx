import React, { createContext, useContext, useState, ReactNode } from 'react';

export type WorkflowStep = 'assess' | 'plan' | 'execute' | 'track';

interface WorkflowContextType {
  currentStep: WorkflowStep | null;
  diagnosticData: any | null;
  selectedPlan: any | null;
  performanceData: any | null;
  setCurrentStep: (step: WorkflowStep) => void;
  setDiagnosticData: (data: any) => void;
  setSelectedPlan: (plan: any) => void;
  setPerformanceData: (data: any) => void;
  clearWorkflowData: () => void;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(undefined);

export const WorkflowProvider = ({ children }: { children: ReactNode }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep | null>(null);
  const [diagnosticData, setDiagnosticData] = useState<any | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<any | null>(null);
  const [performanceData, setPerformanceData] = useState<any | null>(null);

  const clearWorkflowData = () => {
    setCurrentStep(null);
    setDiagnosticData(null);
    setSelectedPlan(null);
    setPerformanceData(null);
  };

  return (
    <WorkflowContext.Provider
      value={{
        currentStep,
        diagnosticData,
        selectedPlan,
        performanceData,
        setCurrentStep,
        setDiagnosticData,
        setSelectedPlan,
        setPerformanceData,
        clearWorkflowData,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};
