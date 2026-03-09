import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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
import { Plus, ChevronDown, Trash2, Layers, GraduationCap, Loader2 } from 'lucide-react';

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

  const [newCat, setNewCat] = useState({ name_fr: '', name_en: '', ofppt_sector_code: '' });
  const [newSkill, setNewSkill] = useState({ name_fr: '', name_en: '', description: '' });

  const toggleCategory = (id: string) => {
    setOpenCategories(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddCategory = async () => {
    if (!newCat.name_fr || !newCat.name_en) return;
    try {
      await addCategory.mutateAsync(newCat);
      setNewCat({ name_fr: '', name_en: '', ofppt_sector_code: '' });
      setShowAddCategory(false);
      toast.success(fr ? 'Categorie ajoutee' : 'Category added');
    } catch {
      toast.error(fr ? 'Erreur lors de l\'ajout' : 'Error adding category');
    }
  };

  const handleAddSkill = async (categoryId: string) => {
    if (!newSkill.name_fr || !newSkill.name_en) return;
    try {
      await addSkill.mutateAsync({ category_id: categoryId, ...newSkill });
      setNewSkill({ name_fr: '', name_en: '', description: '' });
      setShowAddSkill(null);
      toast.success(fr ? 'Competence ajoutee' : 'Skill added');
    } catch {
      toast.error(fr ? 'Erreur lors de l\'ajout' : 'Error adding skill');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(fr ? 'Categorie supprimee' : 'Category deleted');
    } catch {
      toast.error(fr ? 'Erreur lors de la suppression' : 'Error deleting category');
    }
  };

  const handleDeleteSkill = async (id: string) => {
    try {
      await deleteSkill.mutateAsync(id);
      toast.success(fr ? 'Competence supprimee' : 'Skill deleted');
    } catch {
      toast.error(fr ? 'Erreur lors de la suppression' : 'Error deleting skill');
    }
  };

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
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            {fr ? 'Taxonomie des competences' : 'Skills Taxonomy'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {fr ? 'Definissez le referentiel de competences de votre organisation' : 'Define your organization\'s skills framework'}
          </p>
        </div>
        <Dialog open={showAddCategory} onOpenChange={setShowAddCategory}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" /> {fr ? 'Categorie' : 'Category'}</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{fr ? 'Nouvelle categorie' : 'New Category'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>{fr ? 'Nom (francais)' : 'Name (French)'}</Label>
                <Input value={newCat.name_fr} onChange={e => setNewCat(p => ({ ...p, name_fr: e.target.value }))} placeholder="Ex: Competences numeriques" />
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

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{fr ? 'Categories' : 'Categories'}</div>
          <div className="text-2xl font-bold">{categories.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{fr ? 'Competences' : 'Skills'}</div>
          <div className="text-2xl font-bold">{allSkills.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">{fr ? 'Moy. par categorie' : 'Avg per category'}</div>
          <div className="text-2xl font-bold">{categories.length ? Math.round(allSkills.length / categories.length) : 0}</div>
        </Card>
      </div>

      {/* Empty state */}
      {categories.length === 0 && (
        <Card className="p-8 text-center">
          <GraduationCap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="font-semibold mb-1">{fr ? 'Aucune categorie' : 'No categories yet'}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {fr ? 'Commencez par creer des categories de competences alignees avec les secteurs OFPPT' : 'Start by creating skill categories aligned with OFPPT sectors'}
          </p>
          <Button onClick={() => setShowAddCategory(true)}>
            <Plus className="h-4 w-4 mr-1" /> {fr ? 'Creer la premiere categorie' : 'Create first category'}
          </Button>
        </Card>
      )}

      {/* Category list with skills */}
      {categories.map(cat => {
        const catSkills = allSkills.filter(s => s.category_id === cat.id);
        const isOpen = openCategories.includes(cat.id);

        return (
          <Card key={cat.id}>
            <Collapsible open={isOpen} onOpenChange={() => toggleCategory(cat.id)}>
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors rounded-t-lg">
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <div className="text-left">
                      <p className="font-medium">{fr ? cat.name_fr : cat.name_en}</p>
                      <p className="text-xs text-muted-foreground">{fr ? cat.name_en : cat.name_fr}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {cat.ofppt_sector_code && <Badge variant="outline" className="text-xs">OFPPT: {cat.ofppt_sector_code}</Badge>}
                    <Badge variant="secondary">{catSkills.length} {fr ? 'comp.' : 'skills'}</Badge>
                  </div>
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-2">
                  {catSkills.map(skill => (
                    <div key={skill.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{fr ? skill.name_fr : skill.name_en}</p>
                        {skill.description && <p className="text-xs text-muted-foreground">{skill.description}</p>}
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">1-{skill.max_level}</Badge>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); handleDeleteSkill(skill.id); }}>
                          <Trash2 className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Add skill inline */}
                  {showAddSkill === cat.id ? (
                    <div className="flex gap-2 p-2 bg-muted/20 rounded-lg">
                      <Input placeholder={fr ? 'Nom FR' : 'Name FR'} value={newSkill.name_fr} onChange={e => setNewSkill(p => ({ ...p, name_fr: e.target.value }))} className="h-8 text-sm" />
                      <Input placeholder={fr ? 'Nom EN' : 'Name EN'} value={newSkill.name_en} onChange={e => setNewSkill(p => ({ ...p, name_en: e.target.value }))} className="h-8 text-sm" />
                      <Button size="sm" className="h-8" onClick={() => handleAddSkill(cat.id)} disabled={addSkill.isPending}>
                        {fr ? 'Ajouter' : 'Add'}
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8" onClick={() => setShowAddSkill(null)}>
                        &times;
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setNewSkill({ name_fr: '', name_en: '', description: '' }); setShowAddSkill(cat.id); }}>
                        <Plus className="h-3 w-3 mr-1" /> {fr ? 'Ajouter une competence' : 'Add a skill'}
                      </Button>
                      <Button variant="ghost" size="sm" className="text-xs text-destructive" onClick={() => handleDeleteCategory(cat.id)}>
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
