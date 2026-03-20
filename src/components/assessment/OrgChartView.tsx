import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import {
  Building2, Users, Plus, Sparkles, Loader2, ChevronDown, ChevronRight,
  UserCircle, AlertTriangle, TrendingUp, Download, Network, CircleDot,
} from 'lucide-react';
import { POSITION_STATUSES } from '@/data/jobDescriptionTemplates';
import { exportOrgChartPDF } from '@/lib/exportOrgChartPDF';

interface Department {
  id: string;
  name: string;
  description: string | null;
  level: number;
  employee_count: number;
  head_employee_name: string | null;
  parent_department_id: string | null;
  children?: Department[];
}

interface Position {
  id: string;
  title: string;
  level: string;
  status: string;
  current_holder_name: string | null;
  department_id: string | null;
  is_critical: boolean;
  match_score: number | null;
  upskill_potential: boolean;
  reskill_candidate: boolean;
}

interface OrgChartViewProps {
  companyId: string | null;
  departments: Department[];
  positions: Position[];
  onRefresh: () => void;
  jobDescriptions: any[];
  evaluations: any[];
}

const fadeIn = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };

export const OrgChartView = ({ companyId, departments, positions, onRefresh, jobDescriptions, evaluations }: OrgChartViewProps) => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(departments.map(d => d.id)));
  const [aiDetecting, setAiDetecting] = useState(false);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', parentId: '' });
  const [addPosOpen, setAddPosOpen] = useState(false);
  const [newPos, setNewPos] = useState({ title: '', level: 'mid', status: 'filled', departmentId: '', holderName: '' });

  const toggleExpand = (id: string) => {
    setExpandedDepts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const buildTree = (depts: Department[]): Department[] => {
    const map = new Map<string, Department>();
    depts.forEach(d => map.set(d.id, { ...d, children: [] }));
    const roots: Department[] = [];
    depts.forEach(d => {
      const node = map.get(d.id)!;
      if (d.parent_department_id && map.has(d.parent_department_id)) {
        map.get(d.parent_department_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });
    return roots;
  };

  const tree = buildTree(departments);

  const handleAIAutoDetect = async () => {
    if (!companyId) { toast.error('Company not found'); return; }
    setAiDetecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-org-assessment', {
        body: {
          action: 'auto-detect-org',
          data: {
            jobDescriptions: jobDescriptions.map(j => ({ title: j.title, department: j.department, level: j.level })),
            evaluations: evaluations.map(e => ({ name: e.employee_name, department: e.department, rating: e.overall_rating })),
          },
        },
      });
      if (error) throw error;
      const result = data?.result;
      if (result?.suggestedDepartments) {
        for (const dept of result.suggestedDepartments) {
          const { data: insertedDept } = await supabase.from('departments').insert({
            company_id: companyId, name: dept.name, description: dept.description,
            level: dept.level || 0, head_employee_name: dept.suggestedHead,
            employee_count: dept.positions?.length || 0,
          }).select().single();
          if (insertedDept && dept.positions) {
            for (const pos of dept.positions) {
              await supabase.from('positions').insert({
                company_id: companyId, department_id: insertedDept.id,
                title: pos.title, level: pos.level || 'mid', status: pos.status || 'filled',
                current_holder_name: pos.currentHolder, is_critical: pos.isCritical || false,
                skills_required: pos.skills || [],
              });
            }
          }
        }
        toast.success(fr ? 'Structure organisationnelle détectée et créée par AI' : 'Organizational structure detected and created by AI');
        onRefresh();
      }
    } catch (err: any) {
      toast.error(err.message || 'AI detection failed');
    } finally {
      setAiDetecting(false);
    }
  };

  const handleAddDepartment = async () => {
    if (!companyId || !newDept.name.trim()) return;
    const { error } = await supabase.from('departments').insert({
      company_id: companyId, name: newDept.name,
      description: newDept.description || null,
      parent_department_id: newDept.parentId || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(fr ? 'Département ajouté' : 'Department added');
    setAddDeptOpen(false);
    setNewDept({ name: '', description: '', parentId: '' });
    onRefresh();
  };

  const handleAddPosition = async () => {
    if (!companyId || !newPos.title.trim()) return;
    const { error } = await supabase.from('positions').insert({
      company_id: companyId, title: newPos.title, level: newPos.level,
      status: newPos.status, department_id: newPos.departmentId || null,
      current_holder_name: newPos.holderName || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(fr ? 'Poste ajouté' : 'Position added');
    setAddPosOpen(false);
    setNewPos({ title: '', level: 'mid', status: 'filled', departmentId: '', holderName: '' });
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    const s = POSITION_STATUSES.find(p => p.value === status);
    return <Badge className={`text-xs ${s?.color || ''}`}>{s?.[fr ? 'labelFr' : 'label'] || status}</Badge>;
  };

  const deptPositions = (deptId: string) => positions.filter(p => p.department_id === deptId);
  const unassignedPositions = positions.filter(p => !p.department_id);
  const openCount = positions.filter(p => p.status === 'open').length;
  const criticalCount = positions.filter(p => p.is_critical).length;
  const filledCount = positions.filter(p => p.status === 'filled').length;

  const hasData = tree.length > 0 || unassignedPositions.length > 0;

  const renderDept = (dept: Department, depth: number = 0) => (
    <motion.div
      key={dept.id}
      variants={fadeIn}
      className={`${depth > 0 ? 'ml-5 border-l-2 border-primary/20 pl-4' : ''}`}
    >
      <div
        className="flex items-center gap-2.5 p-3 rounded-xl hover:bg-accent/50 cursor-pointer transition-all group"
        onClick={() => toggleExpand(dept.id)}
      >
        {dept.children && dept.children.length > 0 ? (
          expandedDepts.has(dept.id)
            ? <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
            : <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : <CircleDot className="h-3 w-3 text-muted-foreground/50" />}
        <div className="p-1.5 rounded-lg bg-primary/10">
          <Building2 className="h-4 w-4 text-primary" />
        </div>
        <span className="font-semibold text-sm">{dept.name}</span>
        <Badge variant="secondary" className="text-xs font-normal">
          {deptPositions(dept.id).length} {fr ? 'postes' : 'positions'}
        </Badge>
        {dept.head_employee_name && (
          <span className="text-xs text-muted-foreground flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <UserCircle className="h-3.5 w-3.5" /> {dept.head_employee_name}
          </span>
        )}
      </div>
      {expandedDepts.has(dept.id) && (
        <motion.div variants={stagger} initial="hidden" animate="show" className="ml-5 space-y-1.5 mb-3">
          {deptPositions(dept.id).map(pos => (
            <motion.div
              key={pos.id}
              variants={fadeIn}
              className="flex items-center gap-2.5 p-2.5 rounded-lg text-sm bg-card border border-border/50 hover:border-border hover:shadow-sm transition-all"
            >
              <UserCircle className="h-4 w-4 text-muted-foreground/70" />
              <span className="font-medium">{pos.title}</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">{pos.level}</Badge>
              {getStatusBadge(pos.status)}
              {pos.is_critical && (
                <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-medium">
                  <AlertTriangle className="h-3 w-3" /> {fr ? 'Critique' : 'Critical'}
                </span>
              )}
              {pos.upskill_potential && <TrendingUp className="h-3 w-3 text-emerald-500" />}
              {pos.current_holder_name && (
                <span className="text-xs text-muted-foreground ml-auto">— {pos.current_holder_name}</span>
              )}
              {pos.match_score != null && (
                <Badge variant={pos.match_score >= 70 ? 'default' : 'destructive'} className="text-[10px] ml-auto">
                  {Math.round(pos.match_score)}%
                </Badge>
              )}
            </motion.div>
          ))}
          {dept.children?.map(child => renderDept(child, depth + 1))}
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-5">
      {/* Actions bar */}
      <motion.div variants={fadeIn} className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setAddDeptOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> {fr ? 'Département' : 'Department'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAddPosOpen(true)} className="gap-1.5">
          <Plus className="h-4 w-4" /> {fr ? 'Poste' : 'Position'}
        </Button>
        <Button onClick={handleAIAutoDetect} disabled={aiDetecting} size="sm" className="gap-1.5">
          {aiDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {fr ? 'Détection AI' : 'AI Auto-Detect'}
        </Button>
        <div className="flex-1" />
        <Button
          variant="outline" size="sm"
          onClick={() => {
            exportOrgChartPDF({ companyName: 'Company', departments, positions, lang: language });
            toast.success(fr ? 'PDF téléchargé' : 'PDF downloaded');
          }}
          disabled={!hasData}
          className="gap-1.5"
        >
          <Download className="h-4 w-4" /> PDF
        </Button>
      </motion.div>

      {/* Org Tree */}
      <motion.div variants={fadeIn}>
        <Card className="overflow-hidden">
          <CardHeader className="border-b bg-muted/30 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">{fr ? 'Organigramme' : 'Organization Chart'}</CardTitle>
                <CardDescription>
                  {fr ? 'Structure hiérarchique de l\'entreprise' : 'Company hierarchical structure'}
                  {hasData && (
                    <span className="ml-2 text-foreground/70">
                      — {departments.length} {fr ? 'dépts' : 'depts'}, {positions.length} {fr ? 'postes' : 'positions'}
                      {openCount > 0 && <span className="text-destructive"> ({openCount} {fr ? 'ouverts' : 'open'})</span>}
                      {criticalCount > 0 && <span className="text-amber-500"> ({criticalCount} {fr ? 'critiques' : 'critical'})</span>}
                    </span>
                  )}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            {!hasData ? (
              <div className="text-center py-16">
                <div className="mx-auto mb-5 p-4 rounded-2xl bg-muted/50 w-fit">
                  <Building2 className="h-12 w-12 text-muted-foreground/40" />
                </div>
                <h3 className="font-semibold text-lg mb-1">
                  {fr ? 'Aucune structure définie' : 'No structure defined'}
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  {fr
                    ? 'Utilisez la détection AI pour générer automatiquement votre organigramme à partir des fiches de poste, ou ajoutez manuellement.'
                    : 'Use AI detection to auto-generate your org chart from job descriptions, or add departments and positions manually.'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleAIAutoDetect} disabled={aiDetecting} className="gap-1.5">
                    {aiDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {fr ? 'Détection AI' : 'AI Auto-Detect'}
                  </Button>
                  <Button variant="outline" onClick={() => setAddDeptOpen(true)} className="gap-1.5">
                    <Plus className="h-4 w-4" /> {fr ? 'Ajouter manuellement' : 'Add Manually'}
                  </Button>
                </div>
              </div>
            ) : (
              <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-1">
                {tree.map(dept => renderDept(dept))}
                {unassignedPositions.length > 0 && (
                  <motion.div variants={fadeIn} className="mt-5 pt-5 border-t border-dashed">
                    <h4 className="text-sm font-semibold text-muted-foreground mb-2.5 flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {fr ? 'Postes non assignés' : 'Unassigned Positions'}
                      <Badge variant="outline" className="text-[10px]">{unassignedPositions.length}</Badge>
                    </h4>
                    <div className="space-y-1.5">
                      {unassignedPositions.map(pos => (
                        <div key={pos.id} className="flex items-center gap-2.5 p-2.5 rounded-lg text-sm bg-muted/40 border border-dashed border-border/50">
                          <UserCircle className="h-4 w-4 text-muted-foreground/50" />
                          <span>{pos.title}</span>
                          {getStatusBadge(pos.status)}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr ? 'Ajouter un département' : 'Add Department'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{fr ? 'Nom' : 'Name'}</Label><Input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} placeholder={fr ? 'Ex: Ressources Humaines' : 'e.g., Human Resources'} /></div>
            <div><Label>Description</Label><Input value={newDept.description} onChange={e => setNewDept(p => ({ ...p, description: e.target.value }))} placeholder={fr ? 'Description optionnelle...' : 'Optional description...'} /></div>
            {departments.length > 0 && (
              <div>
                <Label>{fr ? 'Département parent' : 'Parent Department'}</Label>
                <Select value={newDept.parentId} onValueChange={v => setNewDept(p => ({ ...p, parentId: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Aucun (racine)' : 'None (root)'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{fr ? 'Aucun' : 'None'}</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleAddDepartment} className="w-full">{fr ? 'Ajouter' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={addPosOpen} onOpenChange={setAddPosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fr ? 'Ajouter un poste' : 'Add Position'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div><Label>{fr ? 'Titre' : 'Title'}</Label><Input value={newPos.title} onChange={e => setNewPos(p => ({ ...p, title: e.target.value }))} placeholder={fr ? 'Ex: Chef de projet' : 'e.g., Project Manager'} /></div>
            <div>
              <Label>{fr ? 'Département' : 'Department'}</Label>
              <Select value={newPos.departmentId} onValueChange={v => setNewPos(p => ({ ...p, departmentId: v }))}>
                <SelectTrigger><SelectValue placeholder={fr ? 'Choisir...' : 'Select...'} /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{fr ? 'Niveau' : 'Level'}</Label>
                <Select value={newPos.level} onValueChange={v => setNewPos(p => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['junior','mid','senior','lead','manager','director','vp','c-level'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={newPos.status} onValueChange={v => setNewPos(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{fr ? s.labelFr : s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{fr ? 'Occupant actuel' : 'Current holder'}</Label><Input value={newPos.holderName} onChange={e => setNewPos(p => ({ ...p, holderName: e.target.value }))} placeholder={fr ? 'Nom complet' : 'Full name'} /></div>
            <Button onClick={handleAddPosition} className="w-full">{fr ? 'Ajouter' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
