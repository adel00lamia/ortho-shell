import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  Building2, Plus, Sparkles, Loader2, ChevronDown, ChevronRight,
  UserCircle, AlertTriangle, TrendingUp, Download, Network, GitBranch,
  Users, Briefcase, Shield, GripVertical, Pencil, Check, X,
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

export const OrgChartView = ({ companyId, departments, positions, onRefresh, jobDescriptions, evaluations }: OrgChartViewProps) => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set(departments.map(d => d.id)));
  const [aiDetecting, setAiDetecting] = useState(false);
  const [addDeptOpen, setAddDeptOpen] = useState(false);
  const [newDept, setNewDept] = useState({ name: '', description: '', parentId: '' });
  const [addPosOpen, setAddPosOpen] = useState(false);
  const [newPos, setNewPos] = useState({ title: '', level: 'mid', status: 'filled', departmentId: '', holderName: '' });
  const [aiConfirmOpen, setAiConfirmOpen] = useState(false);
  const [editingPosId, setEditingPosId] = useState<string | null>(null);
  const [editPosData, setEditPosData] = useState({ title: '', level: '', holderName: '' });

  const startEditPosition = (pos: Position, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPosId(pos.id);
    setEditPosData({ title: pos.title, level: pos.level || 'mid', holderName: pos.current_holder_name || '' });
  };

  const cancelEditPosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPosId(null);
  };

  const saveEditPosition = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editingPosId || !editPosData.title.trim()) return;
    const { error } = await supabase.from('positions').update({
      title: editPosData.title.trim(),
      level: editPosData.level,
      current_holder_name: editPosData.holderName.trim() || null,
    }).eq('id', editingPosId);
    if (error) { toast.error(error.message); return; }
    toast.success(fr ? 'Poste mis à jour' : 'Position updated');
    setEditingPosId(null);
    onRefresh();
  };

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

  // --- Drag and Drop handler ---
  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination || !companyId) return;
    // Same location — no-op
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newDeptId = destination.droppableId === 'unassigned' ? null : destination.droppableId;
    const pos = positions.find(p => p.id === draggableId);
    if (!pos) return;

    // Optimistic: show toast immediately
    const targetDeptName = newDeptId
      ? departments.find(d => d.id === newDeptId)?.name || '?'
      : (fr ? 'Non assigné' : 'Unassigned');

    const { error } = await supabase
      .from('positions')
      .update({ department_id: newDeptId })
      .eq('id', draggableId);

    if (error) {
      toast.error(fr ? 'Erreur lors du déplacement' : 'Failed to move position');
      return;
    }

    toast.success(
      fr
        ? `"${pos.title}" déplacé vers ${targetDeptName}`
        : `"${pos.title}" moved to ${targetDeptName}`
    );

    // Auto-expand target department
    if (newDeptId) {
      setExpandedDepts(prev => {
        const next = new Set(prev);
        next.add(newDeptId);
        return next;
      });
    }

    onRefresh();
  };

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
        const existingNames = new Set(departments.map(d => d.name.toLowerCase()));
        for (const dept of result.suggestedDepartments) {
          if (existingNames.has(dept.name.toLowerCase())) continue;
          existingNames.add(dept.name.toLowerCase());
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
    const colorMap: Record<string, string> = {
      filled: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      open: 'bg-destructive/15 text-destructive border-destructive/20',
      planned: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20',
      frozen: 'bg-muted text-muted-foreground border-muted',
    };
    return (
      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colorMap[status] || 'bg-secondary text-secondary-foreground border-border'}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${status === 'filled' ? 'bg-emerald-500' : status === 'open' ? 'bg-destructive' : status === 'planned' ? 'bg-blue-500' : 'bg-muted-foreground'}`} />
        {s?.[fr ? 'labelFr' : 'label'] || status}
      </span>
    );
  };

  const deptPositions = (deptId: string) => positions.filter(p => p.department_id === deptId);
  const unassignedPositions = positions.filter(p => !p.department_id);
  const openCount = positions.filter(p => p.status === 'open').length;
  const criticalCount = positions.filter(p => p.is_critical).length;
  const filledCount = positions.filter(p => p.status === 'filled').length;
  const hasData = tree.length > 0 || unassignedPositions.length > 0;

  // --- Render a single draggable position card ---
  const renderPositionCard = (pos: Position, index: number) => (
    <Draggable key={pos.id} draggableId={pos.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`
            flex items-center gap-3 p-3 rounded-xl bg-card border transition-all duration-200 group/pos
            ${snapshot.isDragging
              ? 'border-primary shadow-lg shadow-primary/10 ring-2 ring-primary/20 z-50'
              : 'border-border/60 hover:border-primary/30 hover:shadow-sm'
            }
          `}
        >
          {/* Drag handle */}
          <div
            {...provided.dragHandleProps}
            className="flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-accent/60 text-muted-foreground/40 hover:text-muted-foreground transition-colors"
          >
            <GripVertical className="h-4 w-4" />
          </div>

          {/* Avatar placeholder */}
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
            ${pos.status === 'open'
              ? 'bg-destructive/10 text-destructive border border-dashed border-destructive/30'
              : 'bg-secondary text-secondary-foreground'
            }
          `}>
            {pos.current_holder_name
              ? pos.current_holder_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
              : '?'}
          </div>

          {/* Position info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm truncate">{pos.title}</span>
              {pos.is_critical && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Shield className="h-3 w-3" /> {fr ? 'Critique' : 'Critical'}
                </span>
              )}
              {pos.upskill_potential && (
                <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <TrendingUp className="h-3 w-3" /> Upskill
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-muted-foreground capitalize">{pos.level}</span>
              {pos.current_holder_name && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <span className="text-[11px] text-muted-foreground">{pos.current_holder_name}</span>
                </>
              )}
            </div>
          </div>

          {/* Status + score */}
          <div className="flex items-center gap-2">
            {getStatusBadge(pos.status)}
            {pos.match_score != null && (
              <div className={`
                text-[10px] font-bold px-2 py-0.5 rounded-full
                ${pos.match_score >= 70
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : pos.match_score >= 40
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-destructive/15 text-destructive'
                }
              `}>
                {Math.round(pos.match_score)}%
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );

  // --- Render a department with droppable zone ---
  const renderDept = (dept: Department, depth: number = 0) => {
    const dPos = deptPositions(dept.id);
    const isExpanded = expandedDepts.has(dept.id);
    const hasChildren = (dept.children && dept.children.length > 0) || dPos.length > 0;

    return (
      <motion.div
        key={dept.id}
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, delay: depth * 0.05 }}
        className={depth > 0 ? 'ml-4 relative' : ''}
      >
        {depth > 0 && (
          <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-primary/30 to-transparent" />
        )}

        <div
          className={`
            relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all duration-200 group
            ${depth > 0 ? 'ml-4' : ''}
            hover:bg-accent/40 hover:shadow-sm
            ${isExpanded && hasChildren ? 'bg-accent/20' : ''}
          `}
          onClick={() => toggleExpand(dept.id)}
        >
          {depth > 0 && (
            <div className="absolute -left-4 top-1/2 w-4 h-px bg-primary/20" />
          )}

          <div className={`flex-shrink-0 p-1 rounded-md transition-colors ${hasChildren ? 'hover:bg-accent' : ''}`}>
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="h-4 w-4 text-primary" />
                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : <div className="w-4 h-4" />}
          </div>

          <div className="flex-shrink-0 p-2 rounded-xl bg-primary/10 ring-1 ring-primary/20">
            <Building2 className="h-4 w-4 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm truncate">{dept.name}</span>
              {dept.description && (
                <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[200px]">
                  — {dept.description}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {dPos.length} {fr ? 'postes' : 'positions'}
              </span>
              {dPos.filter(p => p.status === 'open').length > 0 && (
                <span className="text-[10px] text-destructive font-medium">
                  {dPos.filter(p => p.status === 'open').length} {fr ? 'ouvert(s)' : 'open'}
                </span>
              )}
            </div>
          </div>

          {dept.head_employee_name && (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary/80 border border-border/50">
              <UserCircle className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">{dept.head_employee_name}</span>
            </div>
          )}
        </div>

        {/* Expanded: droppable positions + children */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <Droppable droppableId={dept.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                      ${depth > 0 ? 'ml-4' : ''} ml-8 space-y-1.5 py-2 min-h-[40px] rounded-lg transition-colors duration-200
                      ${snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-primary/20 ring-dashed' : ''}
                    `}
                  >
                    {dPos.map((pos, i) => renderPositionCard(pos, i))}
                    {provided.placeholder}
                    {dPos.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-xs text-muted-foreground/50 text-center py-2 italic">
                        {fr ? 'Glissez des postes ici' : 'Drag positions here'}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
              <div className={`${depth > 0 ? 'ml-4' : ''} ml-8`}>
                {dept.children?.map(child => renderDept(child, depth + 1))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Compact stats + actions bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex items-center gap-3">
          {[
            { icon: Building2, value: departments.length, label: fr ? 'Dépts' : 'Depts', color: 'text-primary' },
            { icon: Users, value: positions.length, label: fr ? 'Postes' : 'Positions', color: 'text-foreground' },
            { icon: Briefcase, value: filledCount, label: fr ? 'Pourvus' : 'Filled', color: 'text-emerald-500' },
            ...(openCount > 0 ? [{ icon: AlertTriangle, value: openCount, label: fr ? 'Ouverts' : 'Open', color: 'text-destructive' }] : []),
            ...(criticalCount > 0 ? [{ icon: Shield, value: criticalCount, label: fr ? 'Critiques' : 'Critical', color: 'text-amber-500' }] : []),
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-1.5 text-sm">
              <stat.icon className={`h-3.5 w-3.5 ${stat.color}`} />
              <span className="font-bold">{stat.value}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">{stat.label}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setAddDeptOpen(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> {fr ? 'Département' : 'Department'}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddPosOpen(true)} className="h-8 gap-1.5 text-xs">
            <Plus className="h-3.5 w-3.5" /> {fr ? 'Poste' : 'Position'}
          </Button>
          <Button onClick={() => setAiConfirmOpen(true)} disabled={aiDetecting} size="sm" className="h-8 gap-1.5 text-xs">
            {aiDetecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            {fr ? 'Détection AI' : 'AI Detect'}
          </Button>
          {hasData && (
            <Button
              variant="ghost" size="sm"
              onClick={() => {
                exportOrgChartPDF({ companyName: 'TrainPro Academy', departments, positions, lang: language });
                toast.success(fr ? 'PDF téléchargé' : 'PDF downloaded');
              }}
              className="h-8 gap-1.5 text-xs"
            >
              <Download className="h-3.5 w-3.5" /> PDF
            </Button>
          )}
        </div>
      </motion.div>

      {/* Main org chart card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="overflow-hidden border-border/60">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/8 via-primary/4 to-accent/8" />
            <CardHeader className="relative pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                  <Network className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold">
                    {fr ? 'Organigramme' : 'Organization Chart'}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {fr ? 'Structure hiérarchique — glissez les postes entre départements' : 'Hierarchical structure — drag positions between departments'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </div>

          <CardContent className="pt-2 pb-6">
            {!hasData ? (
              /* Empty state */
              <div className="relative py-16">
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                  <GitBranch className="h-64 w-64 rotate-180" />
                </div>

                <div className="relative text-center max-w-lg mx-auto">
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    className="mx-auto mb-6 relative w-20 h-20"
                  >
                    <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-pulse" />
                    <div className="relative flex items-center justify-center w-full h-full rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/20">
                      <Building2 className="h-9 w-9 text-primary" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                    <div className="absolute -bottom-1 -left-1 w-3 h-3 rounded-full bg-accent/30 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                  </motion.div>

                  <motion.h3
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold mb-2"
                  >
                    {fr ? 'Construisez votre organigramme' : 'Build Your Org Chart'}
                  </motion.h3>

                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="text-sm text-muted-foreground mb-8 leading-relaxed"
                  >
                    {fr
                      ? 'Notre AI peut analyser vos fiches de poste et évaluations pour générer automatiquement votre structure organisationnelle complète.'
                      : 'Our AI can analyze your job descriptions and evaluations to automatically generate your complete organizational structure.'}
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center justify-center gap-3"
                  >
                    <Button onClick={() => setAiConfirmOpen(true)} disabled={aiDetecting} size="lg" className="gap-2 shadow-md shadow-primary/20">
                      {aiDetecting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                      {fr ? 'Détection AI automatique' : 'AI Auto-Detect'}
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setAddDeptOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" /> {fr ? 'Ajout manuel' : 'Manual Setup'}
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="mt-10 grid grid-cols-2 gap-3 max-w-sm mx-auto"
                  >
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/30 border border-border/40">
                      <Sparkles className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{fr ? 'AI analyse vos données' : 'AI analyzes your data'}</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/30 border border-border/40">
                      <GitBranch className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-[11px] text-muted-foreground">{fr ? 'Hiérarchie auto-générée' : 'Auto-generated hierarchy'}</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            ) : (
              /* Org chart tree wrapped in DragDropContext */
              <DragDropContext onDragEnd={handleDragEnd}>
                <div className="space-y-1 pt-2">
                  {tree.map(dept => renderDept(dept))}

                  {/* Unassigned positions droppable */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-5 pt-5 border-t border-dashed border-border"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                      <h4 className="text-sm font-semibold">
                        {fr ? 'Postes non assignés' : 'Unassigned Positions'}
                      </h4>
                      <Badge variant="outline" className="text-[10px] h-5">{unassignedPositions.length}</Badge>
                    </div>
                    <Droppable droppableId="unassigned">
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`
                            grid grid-cols-1 sm:grid-cols-2 gap-2 min-h-[48px] rounded-lg p-2 transition-colors duration-200
                            ${snapshot.isDraggingOver ? 'bg-amber-500/5 ring-1 ring-amber-500/20 ring-dashed' : ''}
                          `}
                        >
                          {unassignedPositions.map((pos, i) => renderPositionCard(pos, i))}
                          {provided.placeholder}
                          {unassignedPositions.length === 0 && !snapshot.isDraggingOver && (
                            <div className="col-span-2 text-xs text-muted-foreground/50 text-center py-3 italic">
                              {fr ? 'Glissez des postes ici pour les désassigner' : 'Drag positions here to unassign them'}
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </motion.div>
                </div>
              </DragDropContext>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Add Department Dialog */}
      <Dialog open={addDeptOpen} onOpenChange={setAddDeptOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {fr ? 'Ajouter un département' : 'Add Department'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{fr ? 'Nom' : 'Name'}</Label>
              <Input value={newDept.name} onChange={e => setNewDept(p => ({ ...p, name: e.target.value }))} placeholder={fr ? 'Ex: Ressources Humaines' : 'e.g., Human Resources'} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newDept.description} onChange={e => setNewDept(p => ({ ...p, description: e.target.value }))} placeholder={fr ? 'Description optionnelle...' : 'Optional description...'} />
            </div>
            {departments.length > 0 && (
              <div>
                <Label>{fr ? 'Département parent' : 'Parent Department'}</Label>
                <Select value={newDept.parentId} onValueChange={v => setNewDept(p => ({ ...p, parentId: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Aucun (racine)' : 'None (root)'} /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button onClick={handleAddDepartment} className="w-full gap-2">
              <Plus className="h-4 w-4" /> {fr ? 'Ajouter' : 'Add Department'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Position Dialog */}
      <Dialog open={addPosOpen} onOpenChange={setAddPosOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-primary" />
              {fr ? 'Ajouter un poste' : 'Add Position'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{fr ? 'Intitulé du poste' : 'Position Title'}</Label>
              <Input value={newPos.title} onChange={e => setNewPos(p => ({ ...p, title: e.target.value }))} placeholder={fr ? 'Ex: Chef de projet' : 'e.g., Project Manager'} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{fr ? 'Niveau' : 'Level'}</Label>
                <Select value={newPos.level} onValueChange={v => setNewPos(p => ({ ...p, level: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{fr ? 'Statut' : 'Status'}</Label>
                <Select value={newPos.status} onValueChange={v => setNewPos(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {POSITION_STATUSES.map(s => (
                      <SelectItem key={s.value} value={s.value}>{fr ? s.labelFr : s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {departments.length > 0 && (
              <div>
                <Label>{fr ? 'Département' : 'Department'}</Label>
                <Select value={newPos.departmentId} onValueChange={v => setNewPos(p => ({ ...p, departmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder={fr ? 'Non assigné' : 'Unassigned'} /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>{fr ? 'Titulaire actuel' : 'Current Holder'}</Label>
              <Input value={newPos.holderName} onChange={e => setNewPos(p => ({ ...p, holderName: e.target.value }))} placeholder={fr ? 'Nom du titulaire (optionnel)' : 'Holder name (optional)'} />
            </div>
            <Button onClick={handleAddPosition} className="w-full gap-2">
              <Plus className="h-4 w-4" /> {fr ? 'Ajouter' : 'Add Position'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* AI Detect Confirmation */}
      <AlertDialog open={aiConfirmOpen} onOpenChange={setAiConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {fr ? "Détection AI de l'organigramme" : 'AI Org Chart Detection'}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                {fr
                  ? "L'IA va analyser vos fiches de poste et évaluations pour suggérer automatiquement des départements et postes."
                  : 'AI will analyze your job descriptions and evaluations to automatically suggest departments and positions.'}
              </p>
              <p className="font-medium text-foreground">
                {fr
                  ? '⚠️ De nouveaux départements et postes seront créés. Les départements existants ne seront pas dupliqués.'
                  : '⚠️ New departments and positions will be created. Existing departments will not be duplicated.'}
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{fr ? 'Annuler' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setAiConfirmOpen(false); handleAIAutoDetect(); }}>
              <Sparkles className="h-4 w-4 mr-1.5" />
              {fr ? 'Lancer la détection' : 'Run Detection'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
