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
import { Building2, Users, Plus, Sparkles, Loader2, ChevronDown, ChevronRight, UserCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { POSITION_STATUSES } from '@/data/jobDescriptionTemplates';

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

export const OrgChartView = ({ companyId, departments, positions, onRefresh, jobDescriptions, evaluations }: OrgChartViewProps) => {
  const { language } = useLanguage();
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
        // Insert suggested departments
        for (const dept of result.suggestedDepartments) {
          const { data: insertedDept } = await supabase.from('departments').insert({
            company_id: companyId,
            name: dept.name,
            description: dept.description,
            level: dept.level || 0,
            head_employee_name: dept.suggestedHead,
            employee_count: dept.positions?.length || 0,
          }).select().single();

          if (insertedDept && dept.positions) {
            for (const pos of dept.positions) {
              await supabase.from('positions').insert({
                company_id: companyId,
                department_id: insertedDept.id,
                title: pos.title,
                level: pos.level || 'mid',
                status: pos.status || 'filled',
                current_holder_name: pos.currentHolder,
                is_critical: pos.isCritical || false,
                skills_required: pos.skills || [],
              });
            }
          }
        }
        toast.success(language === 'fr' ? 'Structure organisationnelle détectée et créée par AI' : 'Organizational structure detected and created by AI');
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
      company_id: companyId,
      name: newDept.name,
      description: newDept.description || null,
      parent_department_id: newDept.parentId || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(language === 'fr' ? 'Département ajouté' : 'Department added');
    setAddDeptOpen(false);
    setNewDept({ name: '', description: '', parentId: '' });
    onRefresh();
  };

  const handleAddPosition = async () => {
    if (!companyId || !newPos.title.trim()) return;
    const { error } = await supabase.from('positions').insert({
      company_id: companyId,
      title: newPos.title,
      level: newPos.level,
      status: newPos.status,
      department_id: newPos.departmentId || null,
      current_holder_name: newPos.holderName || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success(language === 'fr' ? 'Poste ajouté' : 'Position added');
    setAddPosOpen(false);
    setNewPos({ title: '', level: 'mid', status: 'filled', departmentId: '', holderName: '' });
    onRefresh();
  };

  const getStatusBadge = (status: string) => {
    const s = POSITION_STATUSES.find(p => p.value === status);
    return <Badge className={`text-xs ${s?.color || ''}`}>{s?.[language === 'fr' ? 'labelFr' : 'label'] || status}</Badge>;
  };

  const deptPositions = (deptId: string) => positions.filter(p => p.department_id === deptId);
  const unassignedPositions = positions.filter(p => !p.department_id);

  const openCount = positions.filter(p => p.status === 'open').length;
  const criticalCount = positions.filter(p => p.is_critical).length;
  const upskillCount = positions.filter(p => p.upskill_potential).length;

  const renderDept = (dept: Department, depth: number = 0) => (
    <div key={dept.id} className={`${depth > 0 ? 'ml-6 border-l-2 border-muted pl-4' : ''}`}>
      <div
        className="flex items-center gap-2 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => toggleExpand(dept.id)}
      >
        {dept.children && dept.children.length > 0 ? (
          expandedDepts.has(dept.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
        ) : <div className="w-4" />}
        <Building2 className="h-4 w-4 text-primary" />
        <span className="font-medium text-sm">{dept.name}</span>
        <Badge variant="outline" className="text-xs">{deptPositions(dept.id).length} {language === 'fr' ? 'postes' : 'positions'}</Badge>
        {dept.head_employee_name && (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <UserCircle className="h-3 w-3" /> {dept.head_employee_name}
          </span>
        )}
      </div>
      {expandedDepts.has(dept.id) && (
        <div className="ml-6 space-y-1 mb-2">
          {deptPositions(dept.id).map(pos => (
            <div key={pos.id} className="flex items-center gap-2 p-2 rounded text-sm bg-background border">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{pos.title}</span>
              <Badge variant="outline" className="text-xs">{pos.level}</Badge>
              {getStatusBadge(pos.status)}
              {pos.is_critical && <AlertTriangle className="h-3 w-3 text-amber-500" />}
              {pos.upskill_potential && <TrendingUp className="h-3 w-3 text-green-500" />}
              {pos.current_holder_name && <span className="text-xs text-muted-foreground">— {pos.current_holder_name}</span>}
              {pos.match_score != null && (
                <Badge variant={pos.match_score >= 70 ? 'default' : 'destructive'} className="text-xs ml-auto">
                  {Math.round(pos.match_score)}%
                </Badge>
              )}
            </div>
          ))}
          {dept.children?.map(child => renderDept(child, depth + 1))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="text-2xl font-bold">{departments.length}</div>
          <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Départements' : 'Departments'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{positions.length}</div>
          <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Postes' : 'Positions'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-red-600">{openCount}</div>
          <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Postes ouverts' : 'Open positions'}</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-amber-600">{criticalCount}</div>
          <div className="text-sm text-muted-foreground">{language === 'fr' ? 'Postes critiques' : 'Critical positions'}</div>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={() => setAddDeptOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> {language === 'fr' ? 'Département' : 'Department'}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setAddPosOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> {language === 'fr' ? 'Poste' : 'Position'}
        </Button>
        <Button onClick={handleAIAutoDetect} disabled={aiDetecting} size="sm">
          {aiDetecting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {language === 'fr' ? 'Détection AI de la structure' : 'AI Auto-Detect Structure'}
        </Button>
      </div>

      {/* Org Tree */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'fr' ? 'Organigramme' : 'Organization Chart'}</CardTitle>
          <CardDescription>
            {language === 'fr' ? 'Structure hiérarchique de l\'entreprise' : 'Company hierarchical structure'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tree.length === 0 && unassignedPositions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === 'fr' ? 'Aucune structure définie. Utilisez la détection AI ou ajoutez manuellement.' : 'No structure defined. Use AI detection or add manually.'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {tree.map(dept => renderDept(dept))}
              {unassignedPositions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    {language === 'fr' ? 'Postes non assignés' : 'Unassigned Positions'}
                  </h4>
                  {unassignedPositions.map(pos => (
                    <div key={pos.id} className="flex items-center gap-2 p-2 rounded text-sm bg-muted/30">
                      <UserCircle className="h-4 w-4" />
                      <span>{pos.title}</span>
                      {getStatusBadge(pos.status)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === 'fr' ? 'Ajouter un département' : 'Add Department'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === 'fr' ? 'Nom' : 'Name'}</Label><Input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} /></div>
            <div><Label>Description</Label><Input value={newDept.description} onChange={e => setNewDept(p => ({ ...p, description: e.target.value }))} /></div>
            {departments.length > 0 && (
              <div>
                <Label>{language === 'fr' ? 'Département parent' : 'Parent Department'}</Label>
                <Select value={newDept.parentId} onValueChange={v => setNewDept(p => ({ ...p, parentId: v }))}>
                  <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Aucun (racine)' : 'None (root)'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{language === 'fr' ? 'Aucun' : 'None'}</SelectItem>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleAddDepartment} className="w-full">{language === 'fr' ? 'Ajouter' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={addPosOpen} onOpenChange={setAddPosOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{language === 'fr' ? 'Ajouter un poste' : 'Add Position'}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === 'fr' ? 'Titre' : 'Title'}</Label><Input value={newPos.title} onChange={e => setNewPos(p => ({ ...p, title: e.target.value }))} /></div>
            <div>
              <Label>{language === 'fr' ? 'Département' : 'Department'}</Label>
              <Select value={newPos.departmentId} onValueChange={v => setNewPos(p => ({ ...p, departmentId: v }))}>
                <SelectTrigger><SelectValue placeholder={language === 'fr' ? 'Choisir...' : 'Select...'} /></SelectTrigger>
                <SelectContent>
                  {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{language === 'fr' ? 'Niveau' : 'Level'}</Label>
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
                    {POSITION_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{language === 'fr' ? s.labelFr : s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>{language === 'fr' ? 'Occupant actuel' : 'Current holder'}</Label><Input value={newPos.holderName} onChange={e => setNewPos(p => ({ ...p, holderName: e.target.value }))} /></div>
            <Button onClick={handleAddPosition} className="w-full">{language === 'fr' ? 'Ajouter' : 'Add'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
