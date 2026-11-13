import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TransformationDemoGuide } from './TransformationDemoGuide';

describe('TransformationDemoGuide', () => {
  it('shows the six-step Atlas journey and opens the next cockpit view', () => {
    const onStepChange = vi.fn();

    render(
      <TransformationDemoGuide
        fr
        currentStep={0}
        onStepChange={onStepChange}
        onLoadDemo={vi.fn()}
        loading={false}
        hasDemoData
      />,
    );

    expect(screen.getByText('Comprendre la transformation avec Atlas Industries')).toBeInTheDocument();
    expect(screen.getByText('Données nécessaires')).toBeInTheDocument();
    expect(screen.getByText('Ce que Qimatak analyse')).toBeInTheDocument();
    expect(screen.getByText('Livrable')).toBeInTheDocument();
    expect(screen.getByText('Décision & impact')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Voir cette étape/i }));
    expect(onStepChange).toHaveBeenCalledWith(1, 'capabilities');
  });
});