import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import {
  Plus, Upload, FileText, CheckCircle2, Clock, AlertCircle, 
  Trash2, Eye, Download, FolderOpen, Send, XCircle, DollarSign, Calculator, BarChart3
} from 'lucide-react';
import ReimbursementDashboard from '@/components/ofppt/ReimbursementDashboard';
import { AnnualReportGenerator } from '@/components/ofppt/AnnualReportGenerator';

const DOCUMENT_TYPES = [
  { value: 'modele_1_recap_actions', label: 'Modèle 1 - Récapitulatif des actions' },
  { value: 'modele_2_contrat_csf', label: 'Modèle 2 - Contrat spécial de formation' },
  { value: 'modele_3_avis_annulation', label: 'Modèle 3 - Avis d\'annulation/modification' },
  { value: 'modele_4_facture', label: 'Modèle 4 - Facture de formation' },
  { value: 'modele_5_liste_presence', label: 'Modèle 5 - Liste de présence' },
  { value: 'modele_6_attestation_realisation', label: 'Modèle 6 - Attestation de réalisation' },
  { value: 'modele_7_synthese_besoins', label: 'Modèle 7 - Synthèse des besoins (FG)' },
  { value: 'modele_8_delegation_pouvoirs', label: 'Modèle 8 - Délégation de pouvoirs (FG)' },
  { value: 'modele_9_contrat_formation_groupee', label: 'Modèle 9 - Contrat formation groupée' },
  { value: 'modele_10_liste_presence_fg', label: 'Modèle 10 - Liste de présence (FG)' },
  { value: 'other', label: 'Autre document' },
] as const;

const STATUS_CONFIG: Record<string, { color: string; icon: typeof Clock }> = {
  draft: { color: 'bg-muted text-muted-foreground', icon: Clock },
  submitted: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: Send },
  under_review: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Eye },
  approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: CheckCircle2 },
  rejected: { color: 'bg-destructive/10 text-destructive', icon: XCircle },
  reimbursed: { color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: DollarSign },
};

interface Dossier {
  id: string;
  title: string;
  exercise_year: number;
  status: string;
  total_amount: number;
  reimbursement_amount: number;
  total_hours: number;
  total_participants: number;
  cost_per_hour_per_person: number;
  submission_date: string | null;
  approval_date: string | null;
  reimbursement_date: string | null;
  notes: string | null;
  created_at: string;
  training_plan_id: string | null;
}

interface DossierDocument {
  id: string;
  dossier_id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  uploaded_at: string;
  notes: string | null;
}

export default function OFPPTReimbursement() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const r = t.reimbursement;

  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [documents, setDocuments] = useState<DossierDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewDossier, setShowNewDossier] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // New dossier form
  const [newTitle, setNewTitle] = useState('');
  const [newYear, setNewYear] = useState(new Date().getFullYear().toString());
  const [newTotalAmount, setNewTotalAmount] = useState('');
  const [newHours, setNewHours] = useState('');
  const [newParticipants, setNewParticipants] = useState('');
  const [newCostPerHourPerson, setNewCostPerHourPerson] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // CSF calculation constants
  const CSF_RATE = 0.7; // 70% reimbursement
  const CSF_CAP_PER_HOUR_PERSON = 40; // 40 DH/hour/person cap

  const calculateReimbursement = (hours: number, participants: number, costPerHourPerson: number) => {
    const cappedCost = Math.min(costPerHourPerson, CSF_CAP_PER_HOUR_PERSON);
    const totalEligible = cappedCost * hours * participants;
    const reimbursement = totalEligible * CSF_RATE;
    return { cappedCost, totalEligible, reimbursement };
  };

  const newCalc = calculateReimbursement(
    parseFloat(newHours) || 0,
    parseInt(newParticipants) || 0,
    parseFloat(newCostPerHourPerson) || 0,
  );

  // Upload form
  const [uploadDocType, setUploadDocType] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadNotes, setUploadNotes] = useState('');

  useEffect(() => {
    fetchDossiers();
  }, []);

  useEffect(() => {
    if (selectedDossier) {
      fetchDocuments(selectedDossier.id);
    }
  }, [selectedDossier]);

  const fetchDossiers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('ofppt_reimbursement_dossiers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: r.errorLoading, variant: 'destructive' });
    } else {
      setDossiers((data || []) as any);
    }
    setLoading(false);
  };

  const fetchDocuments = async (dossierId: string) => {
    const { data, error } = await supabase
      .from('ofppt_dossier_documents')
      .select('*')
      .eq('dossier_id', dossierId)
      .order('uploaded_at', { ascending: false });

    if (!error) setDocuments(data || []);
  };

  const getProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user?.id ?? '')
      .single();
    return data;
  };

  const createDossier = async () => {
    if (!newTitle.trim()) return;
    const profile = await getProfile();
    if (!profile?.company_id) {
      toast({ title: r.noCompany, variant: 'destructive' });
      return;
    }

    const hours = parseFloat(newHours) || 0;
    const participants = parseInt(newParticipants) || 0;
    const costPerHourPerson = parseFloat(newCostPerHourPerson) || 0;
    const calc = calculateReimbursement(hours, participants, costPerHourPerson);

    const { error } = await supabase.from('ofppt_reimbursement_dossiers').insert({
      title: newTitle,
      exercise_year: parseInt(newYear),
      total_amount: parseFloat(newTotalAmount) || calc.totalEligible,
      reimbursement_amount: calc.reimbursement,
      total_hours: hours,
      total_participants: participants,
      cost_per_hour_per_person: costPerHourPerson,
      notes: newNotes || null,
      company_id: profile.company_id,
      created_by: user?.id,
    });

    if (error) {
      toast({ title: r.errorCreating, variant: 'destructive' });
    } else {
      toast({ title: r.dossierCreated });
      setShowNewDossier(false);
      setNewTitle('');
      setNewTotalAmount('');
      setNewHours('');
      setNewParticipants('');
      setNewCostPerHourPerson('');
      setNewNotes('');
      fetchDossiers();
    }
  };

  const uploadDocument = async () => {
    if (!selectedDossier || !uploadFile || !uploadDocType) return;
    setUploading(true);

    const filePath = `${selectedDossier.id}/${Date.now()}_${uploadFile.name}`;
    const { error: uploadError } = await supabase.storage
      .from('ofppt-documents')
      .upload(filePath, uploadFile);

    if (uploadError) {
      toast({ title: r.errorUploading, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { error } = await supabase.from('ofppt_dossier_documents').insert({
      dossier_id: selectedDossier.id,
      document_type: uploadDocType,
      file_name: uploadFile.name,
      file_path: filePath,
      file_size: uploadFile.size,
      uploaded_by: user?.id,
      notes: uploadNotes || null,
    });

    if (error) {
      toast({ title: r.errorSavingDoc, variant: 'destructive' });
    } else {
      toast({ title: r.documentUploaded });
      setUploadFile(null);
      setUploadDocType('');
      setUploadNotes('');
      fetchDocuments(selectedDossier.id);
    }
    setUploading(false);
  };

  const deleteDocument = async (doc: DossierDocument) => {
    await supabase.storage.from('ofppt-documents').remove([doc.file_path]);
    const { error } = await supabase.from('ofppt_dossier_documents').delete().eq('id', doc.id);
    if (!error && selectedDossier) {
      toast({ title: r.documentDeleted });
      fetchDocuments(selectedDossier.id);
    }
  };

  const updateDossierStatus = async (dossierId: string, status: string) => {
    const updates: Record<string, any> = { status };
    if (status === 'submitted') updates.submission_date = new Date().toISOString().split('T')[0];
    if (status === 'approved') updates.approval_date = new Date().toISOString().split('T')[0];
    if (status === 'reimbursed') updates.reimbursement_date = new Date().toISOString().split('T')[0];

    const { error } = await supabase
      .from('ofppt_reimbursement_dossiers')
      .update(updates)
      .eq('id', dossierId);

    if (!error) {
      toast({ title: r.statusUpdated });
      fetchDossiers();
      if (selectedDossier?.id === dossierId) {
        setSelectedDossier({ ...selectedDossier, ...updates });
      }
    }
  };

  const getStatusLabel = (status: string) => {
    return (r.statuses as any)?.[status] || status;
  };

  const getDocTypeLabel = (type: string) => {
    return DOCUMENT_TYPES.find(d => d.value === type)?.label || type;
  };

  const getRequiredDocs = () => {
    const required = [
      'modele_1_recap_actions', 'modele_2_contrat_csf', 'modele_4_facture',
      'modele_5_liste_presence', 'modele_6_attestation_realisation',
    ];
    const uploaded = documents.map(d => d.document_type);
    return required.map(r => ({ type: r, uploaded: uploaded.includes(r) }));
  };

  const completionPct = selectedDossier
    ? Math.round((getRequiredDocs().filter(d => d.uploaded).length / getRequiredDocs().length) * 100)
    : 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{r.title}</h1>
          <p className="text-muted-foreground">{r.subtitle}</p>
        </div>
        <Dialog open={showNewDossier} onOpenChange={setShowNewDossier}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />{r.newDossier}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{r.createDossier}</DialogTitle>
              <DialogDescription>{r.createDossierDesc}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>{r.dossierTitle}</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder={r.dossierTitlePlaceholder} />
              </div>
              <div>
                <Label>{r.exerciseYear}</Label>
                <Input type="number" value={newYear} onChange={e => setNewYear(e.target.value)} />
              </div>

              {/* CSF Calculator */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
                <h4 className="font-medium flex items-center gap-2 text-sm">
                  <Calculator className="h-4 w-4" />{r.calculator}
                </h4>
                <p className="text-xs text-muted-foreground">{r.calculatorDesc}</p>
                <div className="grid gap-3 grid-cols-3">
                  <div>
                    <Label className="text-xs">{r.totalHours}</Label>
                    <Input type="number" value={newHours} onChange={e => setNewHours(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">{r.participants}</Label>
                    <Input type="number" value={newParticipants} onChange={e => setNewParticipants(e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <Label className="text-xs">{r.costPerHourPerson} (MAD)</Label>
                    <Input type="number" value={newCostPerHourPerson} onChange={e => setNewCostPerHourPerson(e.target.value)} placeholder="0" />
                  </div>
                </div>
                {(parseFloat(newHours) > 0 && parseInt(newParticipants) > 0) && (
                  <div className="border-t pt-3 space-y-1.5 text-sm">
                    {parseFloat(newCostPerHourPerson) > CSF_CAP_PER_HOUR_PERSON && (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3.5 w-3.5" />
                        <span className="text-xs">{r.capApplied} ({CSF_CAP_PER_HOUR_PERSON} MAD/h/{r.person})</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{r.eligibleAmount}:</span>
                      <span className="font-medium">{newCalc.totalEligible.toLocaleString()} MAD</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{r.reimbursementRate} (70%):</span>
                      <span className="font-bold text-primary">{newCalc.reimbursement.toLocaleString()} MAD</span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>{r.totalAmount} (MAD)</Label>
                <Input type="number" value={newTotalAmount} onChange={e => setNewTotalAmount(e.target.value)} placeholder={newCalc.totalEligible > 0 ? newCalc.totalEligible.toString() : '0.00'} />
                <p className="text-xs text-muted-foreground mt-1">{r.totalAmountHint}</p>
              </div>
              <div>
                <Label>{r.notes}</Label>
                <Textarea value={newNotes} onChange={e => setNewNotes(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewDossier(false)}>{t.common.cancel}</Button>
              <Button onClick={createDossier} disabled={!newTitle.trim()}>{t.common.create}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: r.totalDossiers, value: dossiers.length, icon: FolderOpen },
          { label: r.pending, value: dossiers.filter(d => ['submitted', 'under_review'].includes(d.status)).length, icon: Clock },
          { label: r.approved, value: dossiers.filter(d => d.status === 'approved').includes ? dossiers.filter(d => d.status === 'approved' || d.status === 'reimbursed').length : 0, icon: CheckCircle2 },
          { label: r.totalReimbursed, value: `${dossiers.filter(d => d.status === 'reimbursed').reduce((s, d) => s + (d.reimbursement_amount || 0), 0).toLocaleString()} MAD`, icon: DollarSign },
        ].map((stat, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard"><BarChart3 className="h-4 w-4 mr-1.5" />{(r as any).dashboardTab || 'Dashboard'}</TabsTrigger>
          <TabsTrigger value="dossiers">{r.allDossiers}</TabsTrigger>
          <TabsTrigger value="annual-report"><FileText className="h-4 w-4 mr-1.5" />{language === 'fr' ? 'Bilan Annuel' : 'Annual Report'}</TabsTrigger>
          {selectedDossier && <TabsTrigger value="details">{r.dossierDetails}</TabsTrigger>}
        </TabsList>

        <TabsContent value="dashboard">
          <ReimbursementDashboard dossiers={dossiers} />
        </TabsContent>

        <TabsContent value="annual-report">
          <AnnualReportGenerator />
        </TabsContent>

        {/* Dossier List */}
        <TabsContent value="dossiers">
          <Card>
            <CardHeader>
              <CardTitle>{r.allDossiers}</CardTitle>
              <CardDescription>{r.allDossiersDesc}</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground">{t.common.loading}</p>
              ) : dossiers.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">{r.noDossiers}</p>
                  <Button className="mt-4" onClick={() => setShowNewDossier(true)}>
                    <Plus className="h-4 w-4 mr-2" />{r.newDossier}
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{r.dossierTitle}</TableHead>
                      <TableHead>{r.exerciseYear}</TableHead>
                      <TableHead>{r.status}</TableHead>
                      <TableHead>{r.totalAmount}</TableHead>
                      <TableHead>{r.reimbursementAmount}</TableHead>
                      <TableHead>{r.actions}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dossiers.map((dossier) => {
                      const statusConf = STATUS_CONFIG[dossier.status] || STATUS_CONFIG.draft;
                      const StatusIcon = statusConf.icon;
                      return (
                        <TableRow key={dossier.id}>
                          <TableCell className="font-medium">{dossier.title}</TableCell>
                          <TableCell>{dossier.exercise_year}</TableCell>
                          <TableCell>
                            <Badge className={statusConf.color}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {getStatusLabel(dossier.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>{(dossier.total_amount || 0).toLocaleString()} MAD</TableCell>
                          <TableCell>{(dossier.reimbursement_amount || 0).toLocaleString()} MAD</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedDossier(dossier);
                                setActiveTab('details');
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />{t.common.view}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dossier Details */}
        {selectedDossier && (
          <TabsContent value="details">
            <div className="space-y-6">
              {/* Dossier Info */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedDossier.title}</CardTitle>
                      <CardDescription>{r.exerciseYear}: {selectedDossier.exercise_year}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {selectedDossier.status === 'draft' && (
                        <Button onClick={() => updateDossierStatus(selectedDossier.id, 'submitted')}>
                          <Send className="h-4 w-4 mr-2" />{r.submit}
                        </Button>
                      )}
                      {selectedDossier.status === 'submitted' && (
                        <Button variant="outline" onClick={() => updateDossierStatus(selectedDossier.id, 'under_review')}>
                          {r.markUnderReview}
                        </Button>
                      )}
                      {selectedDossier.status === 'under_review' && (
                        <>
                          <Button onClick={() => updateDossierStatus(selectedDossier.id, 'approved')}>
                            <CheckCircle2 className="h-4 w-4 mr-2" />{r.approve}
                          </Button>
                          <Button variant="destructive" onClick={() => updateDossierStatus(selectedDossier.id, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-2" />{r.reject}
                          </Button>
                        </>
                      )}
                      {selectedDossier.status === 'approved' && (
                        <Button onClick={() => updateDossierStatus(selectedDossier.id, 'reimbursed')}>
                          <DollarSign className="h-4 w-4 mr-2" />{r.markReimbursed}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    <div>
                      <p className="text-sm text-muted-foreground">{r.totalHours}</p>
                      <p className="text-lg font-semibold">{selectedDossier.total_hours || 0}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.participants}</p>
                      <p className="text-lg font-semibold">{selectedDossier.total_participants || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.costPerHourPerson}</p>
                      <p className="text-lg font-semibold">{(selectedDossier.cost_per_hour_per_person || 0).toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.totalAmount}</p>
                      <p className="text-lg font-semibold">{(selectedDossier.total_amount || 0).toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.reimbursementAmount} (70%)</p>
                      <p className="text-lg font-bold text-primary">{(selectedDossier.reimbursement_amount || 0).toLocaleString()} MAD</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{r.status}</p>
                      <Badge className={STATUS_CONFIG[selectedDossier.status]?.color || ''}>
                        {getStatusLabel(selectedDossier.status)}
                      </Badge>
                    </div>
                  </div>
                  {selectedDossier.cost_per_hour_per_person > CSF_CAP_PER_HOUR_PERSON && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{r.capApplied} — {r.costPerHourPerson} {selectedDossier.cost_per_hour_per_person} MAD → {CSF_CAP_PER_HOUR_PERSON} MAD</span>
                    </div>
                  )}
                  {selectedDossier.notes && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">{r.notes}</p>
                      <p className="text-sm">{selectedDossier.notes}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Document Checklist */}
              <Card>
                <CardHeader>
                  <CardTitle>{r.documentChecklist}</CardTitle>
                  <CardDescription>{r.documentChecklistDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{r.completion}</span>
                      <span className="font-medium">{completionPct}%</span>
                    </div>
                    <Progress value={completionPct} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    {getRequiredDocs().map((doc) => (
                      <div key={doc.type} className="flex items-center gap-3 p-2 rounded-lg border">
                        {doc.uploaded ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-muted-foreground" />
                        )}
                        <span className="text-sm flex-1">{getDocTypeLabel(doc.type)}</span>
                        <Badge variant={doc.uploaded ? 'default' : 'outline'}>
                          {doc.uploaded ? r.uploaded : r.missing}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Upload & Documents */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{r.documents}</CardTitle>
                      <CardDescription>{r.documentsDesc}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Upload Form */}
                  {selectedDossier.status === 'draft' && (
                    <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
                      <h4 className="font-medium flex items-center gap-2">
                        <Upload className="h-4 w-4" />{r.uploadDocument}
                      </h4>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <Label>{r.documentType}</Label>
                          <Select value={uploadDocType} onValueChange={setUploadDocType}>
                            <SelectTrigger><SelectValue placeholder={r.selectDocType} /></SelectTrigger>
                            <SelectContent>
                              {DOCUMENT_TYPES.map(dt => (
                                <SelectItem key={dt.value} value={dt.value}>{dt.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>{r.file}</Label>
                          <Input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.png"
                            onChange={e => setUploadFile(e.target.files?.[0] || null)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label>{r.notes}</Label>
                        <Input value={uploadNotes} onChange={e => setUploadNotes(e.target.value)} placeholder={r.optionalNotes} />
                      </div>
                      <Button onClick={uploadDocument} disabled={!uploadFile || !uploadDocType || uploading}>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? t.common.loading : r.upload}
                      </Button>
                    </div>
                  )}

                  {/* Document List */}
                  {documents.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">{r.noDocuments}</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{r.documentType}</TableHead>
                          <TableHead>{r.fileName}</TableHead>
                          <TableHead>{r.uploadedAt}</TableHead>
                          <TableHead>{r.actions}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map(doc => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{getDocTypeLabel(doc.document_type)}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{doc.file_name}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={async () => {
                                    const { data } = await supabase.storage
                                      .from('ofppt-documents')
                                      .createSignedUrl(doc.file_path, 3600);
                                    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
                                  }}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                {selectedDossier.status === 'draft' && (
                                  <Button variant="ghost" size="icon" onClick={() => deleteDocument(doc)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
