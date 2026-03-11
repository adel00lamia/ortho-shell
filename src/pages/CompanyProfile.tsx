import { useState, useEffect } from 'react';
import EmployeeList from '@/components/company/EmployeeList';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Building2, Save, Upload, Loader2, CheckCircle2, Image,
  FileText, Palette, MapPin, Phone, Mail, Users, Factory,
  Hash, Shield, Globe, Sparkles, AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import { useRef } from 'react';

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'Manufacturing', 'Retail',
  'Education', 'Hospitality', 'Construction', 'Transportation', 'Energy',
  'Consumer Goods', 'Tourisme & Hôtellerie', 'Pêche Maritime', 'Artisanat',
  'Commerce & Distribution', 'Santé', 'TIC', 'Énergie & Mines',
  'Transport & Logistique', 'Automobile', 'Textile', 'Agroalimentaire',
  'BTP', 'Aéronautique', 'Offshoring/BPO',
];

const COMPANY_SIZES = [
  { value: 'micro', label: '1-9', labelFr: 'Micro (1-9)' },
  { value: 'small', label: '10-49', labelFr: 'Petite (10-49)' },
  { value: 'medium', label: '50-199', labelFr: 'Moyenne (50-199)' },
  { value: 'large', label: '200-499', labelFr: 'Grande (200-499)' },
  { value: 'enterprise', label: '500+', labelFr: 'Très Grande (500+)' },
];

export default function CompanyProfile() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const fr = language === 'fr';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [docExtracting, setDocExtracting] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const docInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [form, setForm] = useState({
    name: '',
    cnss_number: '',
    rc_number: '',
    ice_number: '',
    industry: '',
    company_size: '',
    employee_count: '',
    address: '',
    city: '',
    phone: '',
    contact_email: '',
    domain: '',
    logo_url: '',
    primary_color: '#3B82F6',
    org_chart_url: '',
  });

  useEffect(() => {
    loadCompanyData();
  }, [user]);

  const loadCompanyData = async () => {
    if (!user) { setLoading(false); return; }
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', user.id)
        .single();

      if (!profile?.company_id) {
        setLoading(false);
        return;
      }

      setCompanyId(profile.company_id);

      const { data: company } = await supabase
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single();

      if (company) {
        setForm({
          name: company.name || '',
          cnss_number: (company as any).cnss_number || '',
          rc_number: (company as any).rc_number || '',
          ice_number: (company as any).ice_number || '',
          industry: (company as any).industry || '',
          company_size: (company as any).company_size || '',
          employee_count: (company as any).employee_count?.toString() || '',
          address: (company as any).address || '',
          city: (company as any).city || '',
          phone: (company as any).phone || '',
          contact_email: (company as any).contact_email || '',
          domain: company.domain || '',
          logo_url: company.logo_url || '',
          primary_color: company.primary_color || '#3B82F6',
          org_chart_url: (company as any).org_chart_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error(fr ? 'Entreprise non trouvée' : 'Company not found');
      return;
    }

    setSaving(true);
    try {
      const updateData: any = {
        name: form.name,
        cnss_number: form.cnss_number || null,
        rc_number: form.rc_number || null,
        ice_number: form.ice_number || null,
        industry: form.industry || null,
        company_size: form.company_size || null,
        employee_count: form.employee_count ? parseInt(form.employee_count) : null,
        address: form.address || null,
        city: form.city || null,
        phone: form.phone || null,
        contact_email: form.contact_email || null,
        domain: form.domain || null,
        logo_url: form.logo_url || null,
        primary_color: form.primary_color || '#3B82F6',
        org_chart_url: form.org_chart_url || null,
        profile_completed: true,
      };

      const { error } = await supabase
        .from('companies')
        .update(updateData)
        .eq('id', companyId);

      if (error) throw error;

      toast.success(fr ? 'Profil entreprise sauvegardé' : 'Company profile saved');
    } catch (error: any) {
      toast.error(error.message || (fr ? 'Erreur de sauvegarde' : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleOrgChartUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(fr ? 'Format non supporté. Utilisez PNG, JPG, WEBP ou PDF.' : 'Unsupported format. Use PNG, JPG, WEBP or PDF.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error(fr ? 'Fichier trop volumineux (max 10 Mo)' : 'File too large (max 10 MB)');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${companyId}/organigramme.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('org-charts')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('org-charts')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, org_chart_url: urlData.publicUrl }));
      toast.success(fr ? 'Organigramme uploadé' : 'Org chart uploaded');
    } catch (error: any) {
      toast.error(error.message || (fr ? 'Erreur d\'upload' : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    if (!file.type.startsWith('image/')) {
      toast.error(fr ? 'Veuillez sélectionner une image' : 'Please select an image');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${companyId}/logo.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('org-charts')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('org-charts')
        .getPublicUrl(filePath);

      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      toast.success(fr ? 'Logo uploadé' : 'Logo uploaded');
    } catch (error: any) {
      toast.error(error.message || (fr ? 'Erreur d\'upload' : 'Upload failed'));
    } finally {
      setUploading(false);
    }
  };

  const LEGAL_DOC_TYPES = [
    { key: 'cnss', label: fr ? 'Attestation CNSS' : 'CNSS Certificate', icon: '🏛️', desc: fr ? 'Attestation d\'affiliation ou bordereau' : 'Affiliation certificate or statement' },
    { key: 'rc', label: fr ? 'Registre de Commerce (RC)' : 'Trade Register (RC)', icon: '📋', desc: fr ? 'Extrait du registre de commerce' : 'Trade register extract' },
    { key: 'ice', label: fr ? 'Attestation ICE' : 'ICE Certificate', icon: '🔖', desc: fr ? 'Identifiant Commun de l\'Entreprise' : 'Common Business Identifier' },
    { key: 'patente', label: fr ? 'Patente' : 'Business License', icon: '📄', desc: fr ? 'Taxe professionnelle / patente' : 'Professional tax / business license' },
  ];

  const handleDocUpload = async (docType: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(fr ? 'Format non supporté. Utilisez PDF, PNG ou JPG.' : 'Unsupported format. Use PDF, PNG or JPG.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error(fr ? 'Fichier trop volumineux (max 10 Mo)' : 'File too large (max 10 MB)');
      return;
    }

    setDocExtracting(docType);
    try {
      const ext = file.name.split('.').pop();
      const filePath = `${companyId}/${docType}-document.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from('employee-cvs')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      toast.success(fr ? `Document ${docType.toUpperCase()} uploadé, extraction en cours...` : `${docType.toUpperCase()} document uploaded, extracting...`);

      const { data: extractData, error: extractError } = await supabase.functions.invoke('cnss-extract', {
        body: { filePath: data.path, documentType: docType },
      });

      if (extractError) throw extractError;

      if (extractData?.extracted) {
        const d = extractData.extracted;
        setForm(prev => ({
          ...prev,
          cnss_number: d.cnss_number || prev.cnss_number,
          name: d.company_name || prev.name,
          ice_number: d.ice_number || prev.ice_number,
          rc_number: d.rc_number || prev.rc_number,
          address: d.address || prev.address,
          city: d.city || prev.city,
          phone: d.phone || prev.phone,
          contact_email: d.email || prev.contact_email,
          industry: d.industry || prev.industry,
          employee_count: d.employee_count?.toString() || prev.employee_count,
        }));
        toast.success(fr ? 'Informations extraites avec succès !' : 'Information extracted successfully!');
      }
    } catch (error: any) {
      toast.error(error.message || (fr ? "Erreur lors de l'extraction" : 'Extraction failed'));
    } finally {
      setDocExtracting(null);
      const ref = docInputRefs.current[docType];
      if (ref) ref.value = '';
    }
  };

  const updateField = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const isProfileComplete = form.name && form.industry && form.city;

  // Calculate completion percentage
  const completionFields = [
    { filled: !!form.name, label: fr ? 'Raison sociale' : 'Company Name' },
    { filled: !!form.cnss_number, label: 'CNSS' },
    { filled: !!form.rc_number, label: 'RC' },
    { filled: !!form.ice_number, label: 'ICE' },
    { filled: !!form.industry, label: fr ? 'Secteur' : 'Industry' },
    { filled: !!form.company_size, label: fr ? 'Taille' : 'Size' },
    { filled: !!form.address, label: fr ? 'Adresse' : 'Address' },
    { filled: !!form.city, label: fr ? 'Ville' : 'City' },
    { filled: !!form.contact_email, label: 'Email' },
    { filled: !!form.logo_url, label: 'Logo' },
  ];
  const filledCount = completionFields.filter(f => f.filled).length;
  const completionPercent = Math.round((filledCount / completionFields.length) * 100);
  const missingFields = completionFields.filter(f => !f.filled);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-2xl text-center">
        <Card>
          <CardContent className="py-12">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">
              {fr ? 'Aucune entreprise associée' : 'No company associated'}
            </h2>
            <p className="text-muted-foreground mb-4">
              {fr ? 'Veuillez contacter votre administrateur pour être rattaché à une entreprise.' : 'Please contact your administrator to be linked to a company.'}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header with progress */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {fr ? "Profil de l'entreprise" : 'Company Profile'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {fr
              ? "Identifiez votre entreprise avant de démarrer l'évaluation 360°"
              : 'Identify your company before starting the 360° assessment'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {completionPercent === 100 && (
            <Badge className="bg-green-500/90 text-white">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {fr ? 'Profil complet' : 'Profile complete'}
            </Badge>
          )}
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {fr ? 'Sauvegarder' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Completion progress bar */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">
                {fr ? 'Complétion du profil' : 'Profile completion'}
              </span>
              <span className="text-sm font-bold text-primary">{completionPercent}%</span>
            </div>
            <Progress value={completionPercent} className="h-2" />
          </div>
          {missingFields.length > 0 && missingFields.length <= 4 && (
            <div className="flex gap-1.5 flex-wrap">
              {missingFields.map(f => (
                <Badge key={f.label} variant="outline" className="text-xs text-muted-foreground">
                  {f.label}
                </Badge>
              ))}
            </div>
          )}
          {missingFields.length > 4 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {missingFields.length} {fr ? 'champs manquants' : 'fields missing'}
            </Badge>
          )}
        </div>
      </Card>

      <Tabs defaultValue="identification" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="identification">
            <Shield className="h-4 w-4 mr-2" />
            {fr ? 'Identification' : 'Identification'}
          </TabsTrigger>
          <TabsTrigger value="employees">
            <Users className="h-4 w-4 mr-2" />
            {fr ? 'Employés' : 'Employees'}
          </TabsTrigger>
          <TabsTrigger value="branding">
            <Palette className="h-4 w-4 mr-2" />
            {fr ? 'Branding' : 'Branding'}
          </TabsTrigger>
          <TabsTrigger value="orgchart">
            <FileText className="h-4 w-4 mr-2" />
            {fr ? 'Organigramme' : 'Org Chart'}
          </TabsTrigger>
        </TabsList>

        {/* ── Identification Tab ── */}
        <TabsContent value="identification" className="space-y-6">
          {/* Company Name + Legal IDs */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" />
                {fr ? 'Informations légales' : 'Legal Information'}
              </CardTitle>
              <CardDescription>
                {fr ? "Numéros d'immatriculation et identifiants de l'entreprise" : 'Registration numbers and company identifiers'}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>{fr ? "Raison sociale" : 'Company Name'} *</Label>
                <Input value={form.name} onChange={e => updateField('name', e.target.value)} placeholder={fr ? "Nom de l'entreprise" : 'Company name'} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Hash className="h-3 w-3" /> CNSS</Label>
                <Input value={form.cnss_number} onChange={e => updateField('cnss_number', e.target.value)} placeholder="Ex: 1234567" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Hash className="h-3 w-3" /> RC ({fr ? 'Registre de Commerce' : 'Trade Register'})</Label>
                <Input value={form.rc_number} onChange={e => updateField('rc_number', e.target.value)} placeholder="Ex: 123456" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Hash className="h-3 w-3" /> ICE</Label>
                <Input value={form.ice_number} onChange={e => updateField('ice_number', e.target.value)} placeholder="Ex: 001234567000089" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> {fr ? 'Site web' : 'Website'}</Label>
                <Input value={form.domain} onChange={e => updateField('domain', e.target.value)} placeholder="www.example.com" />
              </div>
            </CardContent>
          </Card>

          {/* Legal Document Upload with AI Extraction */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                {fr ? 'Extraction IA depuis documents légaux' : 'AI Extraction from Legal Documents'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? 'Uploadez vos documents légaux pour remplir automatiquement les champs du profil'
                  : 'Upload your legal documents to auto-fill profile fields'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {LEGAL_DOC_TYPES.map((doc) => {
                  const isActive = docExtracting === doc.key;
                  return (
                    <div
                      key={doc.key}
                      className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                        isActive
                          ? 'border-primary bg-primary/5'
                          : 'border-muted-foreground/30 hover:border-primary/50'
                      }`}
                      onClick={() => !docExtracting && docInputRefs.current[doc.key]?.click()}
                    >
                      {isActive ? (
                        <div className="space-y-1">
                          <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                          <p className="text-xs font-medium">
                            {fr ? 'Extraction IA...' : 'AI extracting...'}
                          </p>
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl block mb-1">{doc.icon}</span>
                          <p className="text-sm font-medium">{doc.label}</p>
                          <p className="text-xs text-muted-foreground">{doc.desc}</p>
                        </>
                      )}
                      <input
                        ref={(el) => { docInputRefs.current[doc.key] = el; }}
                        type="file"
                        accept=".pdf,.png,.jpg,.jpeg"
                        className="hidden"
                        onChange={(e) => handleDocUpload(doc.key, e)}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex items-start gap-2 p-2 rounded bg-muted text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {fr
                    ? "L'IA extraira automatiquement les identifiants légaux (CNSS, ICE, RC), la raison sociale, l'adresse et d'autres informations de vos documents."
                    : 'AI will automatically extract legal identifiers (CNSS, ICE, RC), company name, address and other information from your documents.'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Industry & Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Factory className="h-4 w-4 text-primary" />
                {fr ? 'Secteur & Taille' : 'Industry & Size'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>{fr ? "Secteur d'activité" : 'Industry'} *</Label>
                <Select value={form.industry} onValueChange={v => updateField('industry', v)}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Sélectionner' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(ind => (
                      <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{fr ? "Taille de l'entreprise" : 'Company Size'}</Label>
                <Select value={form.company_size} onValueChange={v => updateField('company_size', v)}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Sélectionner' : 'Select'} /></SelectTrigger>
                  <SelectContent>
                    {COMPANY_SIZES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{fr ? s.labelFr : s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="flex items-center gap-1"><Users className="h-3 w-3" /> {fr ? 'Effectif' : 'Headcount'}</Label>
                <Input type="number" value={form.employee_count} onChange={e => updateField('employee_count', e.target.value)} placeholder="Ex: 250" />
              </div>
            </CardContent>
          </Card>

          {/* Address & Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                {fr ? 'Adresse & Contact' : 'Address & Contact'}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label>{fr ? 'Adresse du siège' : 'Headquarters Address'}</Label>
                <Input value={form.address} onChange={e => updateField('address', e.target.value)} placeholder={fr ? 'Adresse complète' : 'Full address'} />
              </div>
              <div>
                <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {fr ? 'Ville' : 'City'} *</Label>
                <Input value={form.city} onChange={e => updateField('city', e.target.value)} placeholder="Ex: Casablanca" />
              </div>
              <div>
                <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> {fr ? 'Téléphone' : 'Phone'}</Label>
                <Input value={form.phone} onChange={e => updateField('phone', e.target.value)} placeholder="Ex: +212 5XX-XXXXXX" />
              </div>
              <div className="md:col-span-2">
                <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> {fr ? 'Email de contact' : 'Contact Email'}</Label>
                <Input type="email" value={form.contact_email} onChange={e => updateField('contact_email', e.target.value)} placeholder="contact@example.com" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Employees Tab ── */}
        <TabsContent value="employees">
          <EmployeeList companyId={companyId} fr={fr} />
        </TabsContent>


        {/* ── Branding Tab ── */}
        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Image className="h-4 w-4 text-primary" />
                {fr ? 'Logo & Couleurs' : 'Logo & Colors'}
              </CardTitle>
              <CardDescription>
                {fr ? "Personnalisez les rapports PDF avec votre branding" : 'Customize PDF reports with your branding'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-6">
                {/* Logo preview */}
                <div className="shrink-0">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt="Logo" className="h-24 w-24 rounded-lg object-contain bg-muted p-2 border" />
                  ) : (
                    <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                      <Building2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-3">
                  <div>
                    <Label>{fr ? 'Logo de l\'entreprise' : 'Company Logo'}</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        value={form.logo_url}
                        onChange={e => updateField('logo_url', e.target.value)}
                        placeholder={fr ? 'URL du logo ou uploadez' : 'Logo URL or upload'}
                        className="flex-1"
                      />
                      <Button variant="outline" size="sm" asChild className="relative">
                        <label>
                          <Upload className="h-4 w-4 mr-1" />
                          Upload
                          <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleLogoUpload} />
                        </label>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label>{fr ? 'Couleur primaire' : 'Primary Color'}</Label>
                    <div className="flex items-center gap-3 mt-1">
                      <input
                        type="color"
                        value={form.primary_color}
                        onChange={e => updateField('primary_color', e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input value={form.primary_color} onChange={e => updateField('primary_color', e.target.value)} className="w-32" />
                      <div className="h-10 flex-1 rounded-lg" style={{ backgroundColor: form.primary_color }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <Separator />
              <div>
                <p className="text-sm font-medium mb-3">{fr ? 'Aperçu du rapport PDF' : 'PDF Report Preview'}</p>
                <div className="border rounded-lg p-4 bg-white dark:bg-card">
                  <div className="h-2 rounded-full mb-4" style={{ backgroundColor: form.primary_color }} />
                  <div className="flex items-center gap-3 mb-3">
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="" className="h-8 w-8 object-contain" />
                    ) : (
                      <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Building2 className="h-4 w-4" /></div>
                    )}
                    <span className="font-semibold" style={{ color: form.primary_color }}>{form.name || 'Company Name'}</span>
                  </div>
                  <div className="h-2 bg-muted rounded mb-2 w-3/4" />
                  <div className="h-2 bg-muted rounded mb-2 w-1/2" />
                  <div className="h-2 rounded-full mt-4" style={{ backgroundColor: form.primary_color, opacity: 0.3 }} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Org Chart Tab ── */}
        <TabsContent value="orgchart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" />
                {fr ? 'Organigramme' : 'Organization Chart'}
              </CardTitle>
              <CardDescription>
                {fr
                  ? "Uploadez votre organigramme existant ou construisez-le dans l'outil Diagnostic"
                  : 'Upload your existing org chart or build one in the Diagnostic tool'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Upload zone */}
              <div className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center">
                {form.org_chart_url ? (
                  <div className="space-y-4">
                    {form.org_chart_url.endsWith('.pdf') ? (
                      <div className="flex items-center justify-center gap-2">
                        <FileText className="h-12 w-12 text-primary" />
                        <span className="text-sm font-medium">{fr ? 'Organigramme PDF uploadé' : 'PDF org chart uploaded'}</span>
                      </div>
                    ) : (
                      <img src={form.org_chart_url} alt="Org Chart" className="max-h-64 mx-auto rounded-lg border" />
                    )}
                    <Badge variant="secondary" className="mx-auto">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {fr ? 'Fichier uploadé' : 'File uploaded'}
                    </Badge>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {fr ? 'Glissez-déposez ou cliquez pour uploader' : 'Drag & drop or click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground">PNG, JPG, WEBP, PDF · Max 10 Mo</p>
                  </>
                )}
                <Button variant="outline" size="sm" className="mt-4 relative" disabled={uploading}>
                  <label className="flex items-center gap-2 cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {form.org_chart_url
                      ? (fr ? 'Remplacer le fichier' : 'Replace file')
                      : (fr ? 'Sélectionner un fichier' : 'Select file')}
                    <input type="file" accept="image/*,application/pdf" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleOrgChartUpload} />
                  </label>
                </Button>
              </div>

              <Separator />

              {/* Link to interactive builder */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-sm">
                    {fr ? 'Constructeur visuel interactif' : 'Interactive Visual Builder'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {fr
                      ? "Construisez votre organigramme dans l'outil de diagnostic"
                      : 'Build your org chart in the diagnostic tool'}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => navigate('/workflow/assess/diagnostic')}>
                  {fr ? 'Ouvrir le builder' : 'Open Builder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom CTA */}
      <div className="flex items-center justify-between mt-8 p-4 bg-muted rounded-lg">
        <div>
          <p className="font-medium">
            {fr ? "Prêt à démarrer l'évaluation ?" : 'Ready to start the assessment?'}
          </p>
          <p className="text-sm text-muted-foreground">
            {fr
              ? "Sauvegardez votre profil puis lancez le diagnostic 360°"
              : 'Save your profile then launch the 360° diagnostic'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {fr ? 'Sauvegarder' : 'Save'}
          </Button>
          <Button
            onClick={async () => {
              await handleSave();
              navigate('/workflow/assess/diagnostic');
            }}
            disabled={!isProfileComplete || saving}
          >
            {fr ? 'Lancer le diagnostic →' : 'Start Diagnostic →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
