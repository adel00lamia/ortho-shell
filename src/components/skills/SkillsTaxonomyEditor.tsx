import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';
import {
  useSkillCategories,
  useSkills,
  useAddCategory,
  useAddSkill,
  useDeleteCategory,
  useDeleteSkill,
} from '@/hooks/useSkillsTaxonomy';
import {
  Plus, ChevronDown, Trash2, Layers, GraduationCap, Loader2,
  Search, ChevronsUpDown, Sparkles, BookOpen, Target, BarChart3
} from 'lucide-react';

export const SkillsTaxonomyEditor = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';

  const { data: categories = [], isLoading: catLoading } = useSkillCategories();
  const { data: allSkills = [], isLoading: skillsLoading } = useSkills();

  const addCategory = useAddCategory();
  const addSkill = useAddSkill();
  const deleteCategory = useDeleteCategory();
  const deleteSkill = useDeleteSkill();

  const [openCategories, setOpenCategories] = useState<string[]>([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddSkill, setShowAddSkill] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [newCat, setNewCat] = useState({ name_fr: '', name_en: '', ofppt_sector_code: '' });
  const [newSkill, setNewSkill] = useState({ name_fr: '', name_en: '', description: '' });

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    if (openCategories.length === categories.length) {
      setOpenCategories([]);
    } else {
      setOpenCategories(categories.map(c => c.id));
    }
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase();
    return categories.filter(cat => {
      if (cat.name_fr.toLowerCase().includes(q) || cat.name_en.toLowerCase().includes(q)) return true;
      return allSkills.some(s => s.category_id === cat.id &&
        (s.name_fr.toLowerCase().includes(q) || s.name_en.toLowerCase().includes(q))
      );
    });
  }, [categories, allSkills, searchQuery]);

  const handleAddCategory = async () => {
    if (!newCat.name_fr || !newCat.name_en) return;
    try {
      await addCategory.mutateAsync(newCat);
      setNewCat({ name_fr: '', name_en: '', ofppt_sector_code: '' });
      setShowAddCategory(false);
      toast.success(fr ? 'Catégorie ajoutée' : 'Category added');
    } catch {
      toast.error(fr ? "Erreur lors de l'ajout" : 'Error adding category');
    }
  };

  const handleAddSkill = async (categoryId: string) => {
    if (!newSkill.name_fr || !newSkill.name_en) return;
    try {
      await addSkill.mutateAsync({ category_id: categoryId, ...newSkill });
      setNewSkill({ name_fr: '', name_en: '', description: '' });
      setShowAddSkill(null);
      toast.success(fr ? 'Compétence ajoutée' : 'Skill added');
    } catch {
      toast.error(fr ? "Erreur lors de l'ajout" : 'Error adding skill');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(fr ? 'Catégorie supprimée' : 'Category deleted');
    } catch {
      toast.error(fr ? 'Erreur lors de la suppression' : 'Error deleting category');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await deleteSkill.mutateAsync(id);
      toast.success(fr ? 'Compétence supprimée' : 'Skill deleted');
    } catch {
      toast.error(fr ? 'Erreur lors de la suppression' : 'Error deleting skill');
    }
  };

  // Category with most skills
  const topCategory = useMemo(() => {
    if (!categories.length) return null;
    let best = categories[0];
    let max = 0;
    for (const cat of categories) {
      const count = allSkills.filter(s => s.category_id === cat.id).length;
      if (count > max) { max = count; best = cat; }
    }
    return { cat: best, count: max };
  }, [categories, allSkills]);

  if (catLoading || skillsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {fr ? 'Taxonomie des compétences' : 'Skills Taxonomy'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fr ? 'Référentiel structuré des compétences de votre organisation' : 'Structured skills framework for your organization'}
          </p>
        </div>
        <div className="flex gap-2">
          {categories.length > 0 && (
            <Button variant="outline" size="sm" onClick={toggleAll}>
              <ChevronsUpDown className="h-4 w-4 mr-1" />
              {openCategories.length === categories.length
                ? (fr ? 'Réduire tout' : 'Collapse all')
                : (fr ? 'Tout ouvrir' : 'Expand all')}
            </Button>
          )}
          <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {fr ? 'Catégorie' : 'Category'}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{fr ? 'Nouvelle catégorie' : 'New Category'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label>{fr ? 'Nom (français)' : 'Name (French)'}</Label>
                  <Input value={newCat.name_fr} onChange={e => setNewCat(p => ({ ...p, name_fr: e.target.value }))} placeholder="Ex: Compétences numériques" />
                </div>
                <div className="space-y-1">
                  <Label>{fr ? 'Nom (anglais)' : 'Name (English)'}</Label>
                  <Input value={newCat.name_en} onChange={e => setNewCat(p => ({ ...p, name_en: e.target.value }))} placeholder="Ex: Digital Skills" />
                </div>
                <div className="space-y-1">
                  <Label>{fr ? 'Code secteur OFPPT (optionnel)' : 'OFPPT Sector Code (optional)'}</Label>
                  <Input value={newCat.ofppt_sector_code} onChange={e => setNewCat(p => ({ ...p, ofppt_sector_code: e.target.value }))} placeholder="Ex: NTIC" />
                </div>
                <Button onClick={handleAddCategory} disabled={addCategory.isPending} className="w-full">
                  {addCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  {fr ? 'Ajouter' : 'Add'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={fr ? 'Rechercher une catégorie ou compétence...' : 'Search categories or skills...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4 border-l-4 border-l-primary">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Layers className="h-3.5 w-3.5" />
            {fr ? 'Catégories' : 'Categories'}
          </div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-chart-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Sparkles className="h-3.5 w-3.5" />
            {fr ? 'Compétences' : 'Skills'}
          </div>
          <div className="text-2xl font-bold">{allSkills.length}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-chart-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <BarChart3 className="h-3.5 w-3.5" />
            {fr ? 'Moy/catégorie' : 'Avg/category'}
          </div>
          <div className="text-2xl font-bold">{categories.length ? Math.round(allSkills.length / categories.length) : 0}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-chart-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Target className="h-3.5 w-3.5" />
            {fr ? 'Plus riche' : 'Top category'}
          </div>
          <div className="text-lg font-bold truncate">
            {topCategory ? (fr ? topCategory.cat.name_fr : topCategory.cat.name_en) : '—'}
          </div>
          {topCategory && <div className="text-xs text-muted-foreground">{topCategory.count} {fr ? 'comp.' : 'skills'}</div>}
        </Card>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <Card className="p-8 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">{fr ? 'Aucune catégorie' : 'No categories yet'}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {fr ? 'Commencez par créer des catégories de compétences alignées avec les secteurs OFPPT' : 'Start by creating skill categories aligned with OFPPT sectors'}
          </p>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-1" /> {fr ? 'Créer la première catégorie' : 'Create first category'}
          </Button>
        </Card>
      )}

      {/* Search empty state */}
      {searchQuery && filteredCategories.length === 0 && (
        <Card className="p-6 text-center">
          <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            {fr ? `Aucun résultat pour "${searchQuery}"` : `No results for "${searchQuery}"`}
          </p>
        </Card>
      )}

      {/* Category list with skills */}
      {filteredCategories.map(cat => {
        const catSkills = allSkills.filter(s => s.category_id === cat.id);
        const matchingSkills = searchQuery.trim()
          ? catSkills.filter(s =>
              s.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
              s.name_en.toLowerCase().includes(searchQuery.toLowerCase())
            )
          : catSkills;
        const isOpen = openCategories.includes(cat.id);
        const fillPercent = allSkills.length > 0 ? Math.round((catSkills.length / allSkills.length) * 100) : 0;

        return (
          <Card key={cat.id} className="overflow-hidden">
            <Collapsible open={isOpen} onOpenChange={() => toggleCategory(cat.id)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 shrink-0">
                      <ChevronDown className={`h-4 w-4 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-medium truncate">{fr ? cat.name_fr : cat.name_en}</p>
                      <p className="text-xs text-muted-foreground truncate">{fr ? cat.name_en : cat.name_fr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {cat.ofppt_sector_code && (
                      <Badge variant="outline" className="text-xs hidden sm:flex">OFPPT: {cat.ofppt_sector_code}</Badge>
                    )}
                    <Badge variant="secondary" className="font-mono">{catSkills.length}</Badge>
                  </div>
                </div>
                {/* Distribution bar under header */}
                <div className="px-4 pb-1">
                  <Progress value={fillPercent} className="h-1" />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-2 border-t pt-3">
                  {/* Skills grid */}
                  {(searchQuery ? matchingSkills : catSkills).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-3">
                      {fr ? 'Aucune compétence dans cette catégorie' : 'No skills in this category'}
                    </p>
                  )}

                  {(searchQuery ? matchingSkills : catSkills).map(skill => (
                    <div key={skill.id} className="group flex items-start justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <BookOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="text-sm font-medium">{fr ? skill.name_fr : skill.name_en}</span>
                          <span className="text-xs text-muted-foreground hidden sm:inline">({fr ? skill.name_en : skill.name_fr})</span>
                        </div>
                        {skill.description && (
                          <p className="text-xs text-muted-foreground mt-1 ml-5.5 line-clamp-2">{skill.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5">L1-{skill.max_level}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add skill inline - enhanced with description field */}
                  {showAddSkill === cat.id ? (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <p className="text-xs font-medium text-primary">{fr ? 'Nouvelle compétence' : 'New Skill'}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Input
                          placeholder={fr ? 'Nom en français' : 'French name'}
                          value={newSkill.name_fr}
                          onChange={e => setNewSkill(p => ({ ...p, name_fr: e.target.value }))}
                          className="h-8 text-sm"
                        />
                        <Input
                          placeholder={fr ? 'Nom en anglais' : 'English name'}
                          value={newSkill.name_en}
                          onChange={e => setNewSkill(p => ({ ...p, name_en: e.target.value }))}
                          className="h-8 text-sm"
                        />
                      </div>
                      <Textarea
                        placeholder={fr ? 'Description (optionnel) — ex: Maîtrise des outils de reporting et visualisation de données' : 'Description (optional) — e.g., Proficiency in reporting tools and data visualization'}
                        value={newSkill.description}
                        onChange={e => setNewSkill(p => ({ ...p, description: e.target.value }))}
                        className="text-sm min-h-[60px]"
                      />
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAddSkill(null)}>
                          {fr ? 'Annuler' : 'Cancel'}
                        </Button>
                        <Button size="sm" className="h-8" onClick={() => handleAddSkill(cat.id)} disabled={addSkill.isPending}>
                          {addSkill.isPending && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                          {fr ? 'Ajouter' : 'Add Skill'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setNewSkill({ name_fr: '', name_en: '', description: '' }); setShowAddSkill(cat.id); }}>
                        <Plus className="h-3 w-3 mr-1" /> {fr ? 'Ajouter une compétence' : 'Add a skill'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
                        <Trash2 className="h-3 w-3 mr-1" /> {fr ? 'Supprimer' : 'Delete'}
                      </Button>
                    </div>
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
      })}
    </div>
  );
};
