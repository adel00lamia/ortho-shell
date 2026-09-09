import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeGiacReimbursement, formatDH } from '@/lib/ofpptFinancials';
import { FundingRulesDisclaimer } from '@/components/funding/FundingRulesDisclaimer';
import { useBudgetCalculations } from '@/hooks/useIngenierie';
import type { IngenierieDossier, IngenierieAction } from '@/hooks/useIngenierie';

interface Props {
  dossier: IngenierieDossier;
  actions: IngenierieAction[];
  onSave: (data: Partial<IngenierieDossier>) => Promise<void>;
  onNext: () => void;
  onPrev: () => void;
}

export function BudgetStep({ dossier, actions, onSave, onNext, onPrev }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [giacCost, setGiacCost] = useState(0);

  const budget = useBudgetCalculations(
    actions,
    dossier.gross_annual_payroll ?? 0,
    dossier.followed_strategic_diagnostic,
    giacCost
  );

  const capTierLabel = () => {
    if (budget.tfp < 20_000) return fr ? 'Palier (hypothèse) : TFP < 20 000 → plafond = TFP × 10' : 'Tier (assumption): TFP < 20,000 → cap = TFP × 10';
    if (budget.tfp <= 200_000) return fr ? 'Palier (hypothèse) : 20 000 ≤ TFP ≤ 200 000 → plafond = 200 000 DH' : 'Tier (assumption): 20,000 ≤ TFP ≤ 200,000 → cap = 200,000 DH';
    return fr ? 'Palier (hypothèse) : TFP > 200 000 → plafond = TFP' : 'Tier (assumption): TFP > 200,000 → cap = TFP';
  };

  const isValid = actions.length > 0 && (dossier.gross_annual_payroll ?? 0) > 0;

  const handleNext = async () => {
    await onSave({ estimated_reimbursement: budget.totalReimbursement });
    onNext();
  };

  return (
    <div className="space-y-6">
      <FundingRulesDisclaimer fr={fr} />
      {/* TFP Summary */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-blue-800">{fr ? 'Calcul TFP' : 'TFP Calculation'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-blue-600">{fr ? 'Masse salariale brute' : 'Gross payroll'}</p>
              <p className="font-bold text-blue-900">{formatDH(dossier.gross_annual_payroll ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">{fr ? 'TFP (taux paramétrable)' : 'TFP (configurable rate)'}</p>
              <p className="font-bold text-blue-900">{formatDH(budget.tfp)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600">{fr ? 'Plafond remboursement' : 'Reimb. cap'}</p>
              <p className="font-bold text-blue-900">{formatDH(budget.cap)}</p>
            </div>
          </div>
          <p className="text-xs text-blue-600 text-center mt-2 italic">{capTierLabel()}</p>
        </CardContent>
      </Card>

      {/* Actions table */}
      {actions.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{fr ? 'Actions de formation' : 'Training actions'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 pr-4 font-medium">{fr ? 'Action' : 'Action'}</th>
                    <th className="text-right py-2 pr-3 font-medium">{fr ? 'Heures' : 'Hours'}</th>
                    <th className="text-right py-2 pr-3 font-medium">{fr ? 'Pers.' : 'Pers.'}</th>
                    <th className="text-right py-2 pr-3 font-medium">{fr ? 'Coût HT' : 'Cost HT'}</th>
                    <th className="text-right py-2 pr-3 font-medium">{fr ? 'Taux' : 'Rate'}</th>
                    <th className="text-right py-2 font-medium">{fr ? 'Remboursement' : 'Reimbursement'}</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.actionRows.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2 pr-4 max-w-[180px] truncate">{row.title}</td>
                      <td className="py-2 pr-3 text-right">{row.duration_hours ?? '—'}</td>
                      <td className="py-2 pr-3 text-right">{row.participant_count ?? '—'}</td>
                      <td className="py-2 pr-3 text-right">{row.cost_ht ? formatDH(row.cost_ht) : '—'}</td>
                      <td className="py-2 pr-3 text-right">
                        <Badge variant={row.is_planned ? 'default' : 'secondary'} className="text-[10px] px-1">
                          {(row.rate * 100).toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-2 text-right font-medium text-blue-700">
                        {row.cost_ht ? formatDH(row.cappedAmount) : '—'}
                        {row.exceedsHourlyCap && <AlertTriangle className="h-3 w-3 text-orange-500 inline ml-1" />}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold border-t-2">
                    <td colSpan={3} className="py-2">{fr ? 'Total actions' : 'Actions total'}</td>
                    <td className="py-2 text-right">{formatDH(budget.totalCostHt)}</td>
                    <td />
                    <td className="py-2 text-right text-blue-700">{formatDH(budget.totalActionsReimbursement)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* GIAC Engineering cost */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{fr ? 'Ingénierie GIAC' : 'GIAC Engineering'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs">{fr ? 'Coût ingénierie HT (DH)' : 'Engineering cost HT (DH)'}</Label>
              <Input type="number" min={0} value={giacCost || ''} onChange={(e) => setGiacCost(Number(e.target.value))}
                placeholder="0" className="mt-1" />
              <p className="text-xs text-muted-foreground mt-1">
                {fr ? 'Taux et plafond issus des paramètres de référence (non vérifiés) — à confirmer selon le cadre officiel applicable.'
                  : 'Rate and ceiling come from unverified reference parameters — confirm against the applicable official framework.'}
              </p>
            </div>
            <div className="bg-green-50 rounded-lg p-3 flex flex-col justify-center">
              <p className="text-xs text-green-600">{fr ? 'Remboursement GIAC' : 'GIAC Reimbursement'}</p>
              <p className="font-bold text-green-800 text-lg">{formatDH(budget.giacReimbursement)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total summary */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-xs text-green-600">{fr ? 'Total remboursement demandé' : 'Total reimbursement requested'}</p>
              <p className="text-2xl font-bold text-green-800">{formatDH(budget.totalReimbursement)}</p>
            </div>
            <div>
              <p className="text-xs text-green-600">{fr ? 'Plafond disponible' : 'Available cap'}</p>
              <p className="text-2xl font-bold text-green-800">{formatDH(budget.cap)}</p>
            </div>
          </div>
          {budget.totalReimbursement >= budget.cap && (
            <Alert className="mt-3 border-orange-300 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-xs text-orange-700">
                {fr ? 'Le plafond de remboursement est atteint.' : 'Reimbursement cap reached.'}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}><ArrowLeft className="h-4 w-4 mr-2" />{fr ? 'Précédent' : 'Previous'}</Button>
        <Button onClick={handleNext} disabled={!isValid}>
          {fr ? 'Enregistrer & Suivant' : 'Save & Next'}<ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
