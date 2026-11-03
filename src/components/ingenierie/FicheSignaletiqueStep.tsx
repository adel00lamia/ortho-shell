import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormField, FormItem, FormLabel, FormMessage, FormControl } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, ArrowRight, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { computeTFP, computeReimbursementCap, formatDH } from '@/lib/ofpptFinancials';
import type { IngenierieDossier } from '@/hooks/useIngenierie';
import { useFicheSignaletiquePreFill } from '@/hooks/useIngenieriePreFill';

const GIAC_SECTORS = [
  'IMMEE', 'Textile-Cuir', 'Technologies', 'BTP', 'Tourisme',
  'Agroalimentaire', 'TRANSLOG', 'Tertiaire', 'Pêches-Maritimes',
];

const schema = z.object({
  giac_sector: z.string().min(1, 'Secteur GIAC requis'),
  if_number: z.string().regex(/^\d{8}$/, 'Numéro IF : 8 chiffres').optional().or(z.literal('')),
  gross_annual_payroll: z.coerce.number().positive('Masse salariale requise'),
  contact_name: z.string().min(1, 'Nom du responsable requis'),
  contact_phone: z.string().optional(),
  contact_email: z.string().email('Email invalide').optional().or(z.literal('')),
  followed_strategic_diagnostic: z.boolean(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  dossier: IngenierieDossier;
  onSave: (data: Partial<IngenierieDossier>) => Promise<void>;
  onNext: () => void;
}

export function FicheSignaletiqueStep({ dossier, onSave, onNext }: Props) {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const { defaults, isLoading: prefillLoading } = useFicheSignaletiquePreFill();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      giac_sector: dossier.giac_sector ?? '',
      if_number: dossier.if_number ?? '',
      gross_annual_payroll: dossier.gross_annual_payroll ?? 0,
      contact_name: dossier.contact_name ?? '',
      contact_phone: dossier.contact_phone ?? '',
      contact_email: dossier.contact_email ?? '',
      followed_strategic_diagnostic: dossier.followed_strategic_diagnostic ?? false,
    },
  });

  // Auto-populate from company profile only if dossier fields are still empty
  useEffect(() => {
    if (prefillLoading || !defaults) return;
    if (!dossier.contact_name && defaults.contact_name) form.setValue('contact_name', defaults.contact_name);
    if (!dossier.contact_email && defaults.contact_email) form.setValue('contact_email', defaults.contact_email);
    if (!dossier.contact_phone && defaults.contact_phone) form.setValue('contact_phone', defaults.contact_phone);
    if (!dossier.giac_sector && defaults.giac_sector) form.setValue('giac_sector', defaults.giac_sector);
  }, [prefillLoading]);

  const payroll = form.watch('gross_annual_payroll');
  const tfp = computeTFP(payroll || 0);
  const cap = computeReimbursementCap(tfp);

  const handleSubmit = async (data: FormData) => {
    await onSave(data);
    onNext();
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Identification GIAC' : 'GIAC Identification'}</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="giac_sector"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? 'Secteur GIAC *' : 'GIAC Sector *'}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={fr ? 'Sélectionner...' : 'Select...'} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {GIAC_SECTORS.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="if_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? 'N° Identifiant Fiscal (IF)' : 'Tax ID Number (IF)'}</FormLabel>
                    <FormControl>
                      <Input placeholder="12345678" maxLength={8} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Masse Salariale & TFP' : 'Payroll & TFP'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="gross_annual_payroll"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? 'Masse salariale annuelle brute (DH) *' : 'Gross Annual Payroll (DH) *'}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="5000000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {payroll > 0 && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p className="text-xs text-blue-600 font-medium">{fr ? 'TFP (1,6%)' : 'TFP (1.6%)'}</p>
                    <p className="text-lg font-bold text-blue-800">{formatDH(tfp)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <p className="text-xs text-green-600 font-medium">{fr ? 'Plafond remboursement' : 'Reimbursement Cap'}</p>
                    <p className="text-lg font-bold text-green-800">{formatDH(cap)}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{fr ? 'Responsable Formation' : 'Training Contact'}</CardTitle>
                {!prefillLoading && (defaults.contact_name || defaults.contact_email) && (
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Sparkles className="h-3 w-3" />
                    {fr ? 'Pré-rempli depuis le profil' : 'Pre-filled from profile'}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="contact_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? 'Nom & Prénom *' : 'Full Name *'}</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? 'Téléphone' : 'Phone'}</FormLabel>
                    <FormControl><Input placeholder="+212 6XX XXX XXX" {...field} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contact_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl><Input type="email" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="followed_strategic_diagnostic"
                render={({ field }) => (
                  <FormItem className="flex items-start gap-3">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <div>
                      <FormLabel className="cursor-pointer">
                        {fr ? 'Diagnostic stratégique réalisé (taux GIAC 80%)' : 'Strategic diagnostic completed (80% GIAC rate)'}
                      </FormLabel>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {fr ? 'Sans diagnostic : taux de 70%' : 'Without diagnostic: 70% rate'}
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit">
              {fr ? 'Enregistrer & Suivant' : 'Save & Next'}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
