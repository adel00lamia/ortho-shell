import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import {
  Download, Upload, Plus, Trash2, UserPlus, Users, Loader2,
  FileText, Edit2, Search, AlertCircle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

interface CompanyEmployee {
  id: string;
  full_name: string;
  email: string | null;
  department: string | null;
  position: string | null;
  matricule: string | null;
  phone: string | null;
  hire_date: string | null;
  contract_type: string | null;
  status: string;
}

interface EmployeeListProps {
  companyId: string;
  fr: boolean;
}

const CSV_TEMPLATE_HEADERS = [
  "full_name", "email", "department", "position", "matricule",
  "phone", "hire_date", "contract_type"
];

const CSV_TEMPLATE = `full_name,email,department,position,matricule,phone,hire_date,contract_type
Ahmed Benali,ahmed@company.ma,IT,Développeur Full Stack,EMP001,+212600000001,2022-01-15,CDI
Sara Idrissi,sara@company.ma,Marketing,Responsable Marketing,EMP002,+212600000002,2021-06-01,CDI
Karim Tazi,karim@company.ma,Finance,Comptable,EMP003,+212600000003,2023-03-10,CDD
Fatima Zahra El Amrani,fatima@company.ma,RH,Chargée RH,EMP004,+212600000004,2020-09-01,CDI`;

const EMPTY_FORM: Omit<CompanyEmployee, 'id' | 'status'> = {
  full_name: '', email: '', department: '', position: '',
  matricule: '', phone: '', hire_date: '', contract_type: 'CDI',
};

const CONTRACT_TYPES = ['CDI', 'CDD', 'Stage', 'Intérim', 'Freelance'];

export default function EmployeeList({ companyId, fr }: EmployeeListProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [importing, setImporting] = useState(false);
  const [parseErrors, setParseErrors] = useState<string[]>([]);

  const { data: employees = [], isLoading } = useQuery({
    queryKey: ['company-employees', companyId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('company_employees')
        .select('*')
        .eq('company_id', companyId)
        .order('full_name');
      if (error) throw error;
      return (data || []) as CompanyEmployee[];
    },
    enabled: !!companyId,
  });

  const saveMutation = useMutation({
    mutationFn: async (emp: Omit<CompanyEmployee, 'id' | 'status'>) => {
      if (editingId) {
        const { error } = await (supabase as any)
          .from('company_employees')
          .update({ ...emp, updated_at: new Date().toISOString() })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('company_employees')
          .insert({ ...emp, company_id: companyId, created_by: user!.id, status: 'active' });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees', companyId] });
      toast.success(editingId
        ? (fr ? 'Employé mis à jour' : 'Employee updated')
        : (fr ? 'Employé ajouté' : 'Employee added'));
      resetDialog();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('company_employees').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company-employees', companyId] });
      toast.success(fr ? 'Employé supprimé' : 'Employee deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const resetDialog = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setDialogOpen(false);
  };

  const openEdit = (emp: CompanyEmployee) => {
    setForm({
      full_name: emp.full_name, email: emp.email || '', department: emp.department || '',
      position: emp.position || '', matricule: emp.matricule || '', phone: emp.phone || '',
      hire_date: emp.hire_date || '', contract_type: emp.contract_type || 'CDI',
    });
    setEditingId(emp.id);
    setDialogOpen(true);
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "employees_template.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success(fr ? "Modèle téléchargé" : "Template downloaded");
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.csv')) {
      toast.error(fr ? 'Veuillez utiliser un fichier CSV' : 'Please use a CSV file');
      return;
    }

    setImporting(true);
    setParseErrors([]);
    try {
      const text = await file.text();
      const lines = text.trim().split('\n');
      if (lines.length < 2) throw new Error(fr ? 'Fichier vide' : 'Empty file');

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const nameIdx = headers.findIndex(h => h === 'full_name' || h === 'nom_complet' || h === 'nom');
      if (nameIdx === -1) throw new Error(fr ? "Colonne 'full_name' manquante" : "Missing 'full_name' column");

      const errors: string[] = [];
      const rows: Omit<CompanyEmployee, 'id' | 'status'>[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const values = parseCSVLine(line);
        const name = values[nameIdx]?.trim();
        if (!name) { errors.push(`${fr ? 'Ligne' : 'Row'} ${i + 1}: ${fr ? 'nom manquant' : 'missing name'}`); continue; }

        rows.push({
          full_name: name,
          email: getVal(headers, values, ['email']) || null,
          department: getVal(headers, values, ['department', 'departement']) || null,
          position: getVal(headers, values, ['position', 'poste']) || null,
          matricule: getVal(headers, values, ['matricule', 'employee_id']) || null,
          phone: getVal(headers, values, ['phone', 'telephone']) || null,
          hire_date: getVal(headers, values, ['hire_date', 'date_embauche']) || null,
          contract_type: getVal(headers, values, ['contract_type', 'type_contrat']) || 'CDI',
        });
      }

      setParseErrors(errors);
      if (rows.length === 0) throw new Error(fr ? 'Aucun employé valide' : 'No valid employees');

      const insertData = rows.map(r => ({ ...r, company_id: companyId, created_by: user!.id, status: 'active' }));
      const { error } = await supabase.from('company_employees').insert(insertData);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ['company-employees', companyId] });
      toast.success(`${rows.length} ${fr ? 'employé(s) importé(s)' : 'employee(s) imported'}`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const parseCSVLine = (line: string): string[] => {
    const values: string[] = [];
    let current = '', inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else { current += char; }
    }
    values.push(current.trim());
    return values;
  };

  const getVal = (headers: string[], values: string[], keys: string[]): string | undefined => {
    for (const key of keys) {
      const idx = headers.indexOf(key);
      if (idx >= 0 && values[idx]) return values[idx].trim();
    }
    return undefined;
  };

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.department || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.position || '').toLowerCase().includes(search.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {fr ? 'Liste des employés' : 'Employee List'}
              </CardTitle>
              <CardDescription>
                {fr ? "Gérez les employés de votre entreprise" : 'Manage your company employees'}
                {employees.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{employees.length}</Badge>
                )}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-1" />
                {fr ? 'Modèle CSV' : 'CSV Template'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                {importing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                {fr ? 'Importer CSV' : 'Import CSV'}
              </Button>
              <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
              <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetDialog(); else setDialogOpen(true); }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <UserPlus className="h-4 w-4 mr-1" />
                    {fr ? 'Ajouter' : 'Add'}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>
                      {editingId
                        ? (fr ? "Modifier l'employé" : 'Edit Employee')
                        : (fr ? 'Ajouter un employé' : 'Add Employee')}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <Label>{fr ? 'Nom complet' : 'Full Name'} *</Label>
                        <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Ahmed Benali" />
                      </div>
                      <div>
                        <Label>Email</Label>
                        <Input type="email" value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ahmed@company.ma" />
                      </div>
                      <div>
                        <Label>{fr ? 'Téléphone' : 'Phone'}</Label>
                        <Input value={form.phone || ''} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+212 6XX-XXXXXX" />
                      </div>
                      <div>
                        <Label>{fr ? 'Département' : 'Department'}</Label>
                        <Input value={form.department || ''} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} placeholder="IT, Marketing, RH..." />
                      </div>
                      <div>
                        <Label>{fr ? 'Poste' : 'Position'}</Label>
                        <Input value={form.position || ''} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder={fr ? 'Développeur, Manager...' : 'Developer, Manager...'} />
                      </div>
                      <div>
                        <Label>{fr ? 'Matricule' : 'Employee ID'}</Label>
                        <Input value={form.matricule || ''} onChange={e => setForm(f => ({ ...f, matricule: e.target.value }))} placeholder="EMP001" />
                      </div>
                      <div>
                        <Label>{fr ? "Type de contrat" : 'Contract Type'}</Label>
                        <Select value={form.contract_type || 'CDI'} onValueChange={v => setForm(f => ({ ...f, contract_type: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTRACT_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>{fr ? "Date d'embauche" : 'Hire Date'}</Label>
                        <Input type="date" value={form.hire_date || ''} onChange={e => setForm(f => ({ ...f, hire_date: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetDialog}>{fr ? 'Annuler' : 'Cancel'}</Button>
                    <Button onClick={() => saveMutation.mutate(form)} disabled={!form.full_name || saveMutation.isPending}>
                      {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                      {editingId ? (fr ? 'Mettre à jour' : 'Update') : (fr ? 'Ajouter' : 'Add')}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {parseErrors.length > 0 && (
            <div className="p-3 mb-4 bg-destructive/10 rounded-lg text-sm space-y-1">
              <div className="flex items-center gap-2 text-destructive font-medium">
                <AlertCircle className="w-4 h-4" />
                {fr ? "Erreurs d'import" : 'Import errors'}
              </div>
              {parseErrors.map((err, i) => (
                <p key={i} className="text-destructive/80 text-xs">• {err}</p>
              ))}
            </div>
          )}

          {employees.length > 0 && (
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={fr ? 'Rechercher par nom, département, poste...' : 'Search by name, department, position...'}
                className="pl-9"
              />
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : employees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm font-medium">{fr ? 'Aucun employé ajouté' : 'No employees added'}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {fr ? 'Ajoutez manuellement ou importez via CSV' : 'Add manually or import via CSV'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{fr ? 'Nom' : 'Name'}</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>{fr ? 'Département' : 'Department'}</TableHead>
                    <TableHead>{fr ? 'Poste' : 'Position'}</TableHead>
                    <TableHead>{fr ? 'Matricule' : 'ID'}</TableHead>
                    <TableHead>{fr ? 'Contrat' : 'Contract'}</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(emp => (
                    <TableRow key={emp.id}>
                      <TableCell className="font-medium">{emp.full_name}</TableCell>
                      <TableCell className="text-muted-foreground text-xs">{emp.email || '—'}</TableCell>
                      <TableCell>{emp.department ? <Badge variant="secondary" className="text-xs">{emp.department}</Badge> : '—'}</TableCell>
                      <TableCell className="text-sm">{emp.position || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{emp.matricule || '—'}</TableCell>
                      <TableCell>{emp.contract_type ? <Badge variant="outline" className="text-xs">{emp.contract_type}</Badge> : '—'}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(emp)}>
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(emp.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
