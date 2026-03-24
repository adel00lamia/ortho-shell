/**
 * OFPPT/GIAC Annual Deadlines
 * - Jun 30: GIAC validation deadline
 * - Jan 30: OFPPT plan deposit
 * - Apr 30: Financial reimbursement dossier
 */
import { useMemo } from 'react';

export interface DeadlineAlert {
  key: string;
  labelFr: string;
  labelEn: string;
  date: Date;
  daysUntil: number;
  variant: 'safe' | 'warning' | 'urgent' | 'passed';
}

function getNextOccurrence(month: number, day: number): Date {
  const now = new Date();
  const year = now.getFullYear();
  const candidate = new Date(year, month - 1, day);
  if (candidate < now) {
    return new Date(year + 1, month - 1, day);
  }
  return candidate;
}

export function useDeadlineAlerts(): DeadlineAlert[] {
  return useMemo(() => {
    const now = new Date();

    const deadlines = [
      {
        key: 'giac_validation',
        labelFr: 'Validation GIAC',
        labelEn: 'GIAC Validation',
        date: getNextOccurrence(6, 30),
      },
      {
        key: 'ofppt_deposit',
        labelFr: 'Dépôt plan OFPPT',
        labelEn: 'OFPPT Plan Deposit',
        date: getNextOccurrence(1, 30),
      },
      {
        key: 'reimbursement_dossier',
        labelFr: 'Dossier remboursement',
        labelEn: 'Reimbursement Dossier',
        date: getNextOccurrence(4, 30),
      },
    ];

    return deadlines.map(({ key, labelFr, labelEn, date }) => {
      const daysUntil = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      let variant: DeadlineAlert['variant'] = 'safe';
      if (daysUntil < 0) variant = 'passed';
      else if (daysUntil <= 14) variant = 'urgent';
      else if (daysUntil <= 30) variant = 'warning';
      return { key, labelFr, labelEn, date, daysUntil, variant };
    });
  }, []);
}
