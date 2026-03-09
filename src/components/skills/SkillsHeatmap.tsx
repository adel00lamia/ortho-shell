import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSkillCategories, useSkills, useEmployeeSkills } from '@/hooks/useSkillsTaxonomy';
import { Loader2, Users, AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';

const levelColors = [
  'bg-gray-100 text-gray-400',     // 0 - Not assessed
  'bg-red-100 text-red-700',        // 1 - Beginner
  'bg-orange-100 text-orange-700',  // 2 - Basic
  'bg-yellow-100 text-yellow-700',  // 3 - Intermediate
  'bg-blue-100 text-blue-700',      // 4 - Advanced
  'bg-green-100 text-green-700',    // 5 - Expert
];

const levelLabels = {
  fr: ['N/A', 'Debutant', 'Base', 'Intermediaire', 'Avance', 'Expert'],
  en: ['N/A', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'],
};

export const SkillsHeatmap = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';
  const labels = fr ? levelLabels.fr : levelLabels.en;

  const { data: categories = [], isLoading: catLoading } = useSkillCategories();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { data: employeeSkills = [], isLoading: empLoading } = useEmployeeSkills();

  if (catLoading || skillsLoading || empLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Get unique employees
  const employees = [...new Set(employeeSkills.map(es => es.employee_name))].sort();

  if (skills.length === 0 || employees.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="font-semibold mb-1">{fr ? 'Pas encore de donnees' : 'No data yet'}</h3>
        <p className="text-sm text-muted-foreground">
          {fr
            ? 'Ajoutez des competences dans la taxonomie puis evaluez vos employes'
            : 'Add skills to the taxonomy then assess your employees'}
        </p>
      </Card>
    );
  }

  // Build lookup: employeeName -> skillId -> { current, target }
  const lookup = new Map<string, Map<string, { current: number; target: number }>>();
  employeeSkills.forEach(es => {
    if (!lookup.has(es.employee_name)) lookup.set(es.employee_name, new Map());
    lookup.get(es.employee_name)!.set(es.skill_id, { current: es.current_level, target: es.target_level });
  });

  // Calculate gap stats
  let totalGaps = 0;
  let criticalGaps = 0;
  let onTarget = 0;
  let totalAssessed = 0;

  employeeSkills.forEach(es => {
    totalAssessed++;
    const gap = es.target_level - es.current_level;
    if (gap > 0) totalGaps++;
    if (gap >= 2) criticalGaps++;
    if (gap <= 0) onTarget++;
  });

  return (
    <div className="space-y-4">
      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">{fr ? 'Employes evalues' : 'Employees Assessed'}</span>
          </div>
          <div className="text-2xl font-bold">{employees.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-sm text-muted-foreground">{fr ? 'Gaps critiques' : 'Critical Gaps'}</span>
          </div>
          <div className="text-2xl font-bold text-red-600">{criticalGaps}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-amber-500" />
            <span className="text-sm text-muted-foreground">{fr ? 'A developper' : 'Need Development'}</span>
          </div>
          <div className="text-2xl font-bold text-amber-600">{totalGaps}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-sm text-muted-foreground">{fr ? 'Au niveau cible' : 'On Target'}</span>
          </div>
          <div className="text-2xl font-bold text-green-600">{onTarget}</div>
        </Card>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">{fr ? 'Legende :' : 'Legend:'}</span>
        {labels.map((label, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className={`w-4 h-4 rounded text-[9px] flex items-center justify-center font-bold ${levelColors[i]}`}>
              {i}
            </div>
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Heatmap by category */}
      {categories.map(cat => {
        const catSkills = skills.filter(s => s.category_id === cat.id);
        if (catSkills.length === 0) return null;

        return (
          <Card key={cat.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{fr ? cat.name_fr : cat.name_en}</CardTitle>
              <CardDescription>{catSkills.length} {fr ? 'competences' : 'skills'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left p-2 font-medium text-muted-foreground sticky left-0 bg-background min-w-[140px]">
                        {fr ? 'Employe' : 'Employee'}
                      </th>
                      {catSkills.map(skill => (
                        <th key={skill.id} className="p-2 font-medium text-muted-foreground text-center min-w-[80px]">
                          <span className="text-xs">{fr ? skill.name_fr : skill.name_en}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map(emp => (
                      <tr key={emp} className="border-t">
                        <td className="p-2 font-medium sticky left-0 bg-background text-xs">{emp}</td>
                        {catSkills.map(skill => {
                          const data = lookup.get(emp)?.get(skill.id);
                          const current = data?.current ?? 0;
                          const target = data?.target ?? 0;
                          const gap = target - current;

                          return (
                            <td key={skill.id} className="p-1 text-center">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className={`w-10 h-10 rounded-md flex items-center justify-center font-bold text-sm mx-auto cursor-default ${levelColors[current]} ${gap >= 2 ? 'ring-2 ring-red-400' : ''}`}>
                                    {current}
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="text-xs">
                                    <p className="font-semibold">{emp}</p>
                                    <p>{fr ? skill.name_fr : skill.name_en}</p>
                                    <p>{fr ? 'Actuel' : 'Current'}: {current} ({labels[current]})</p>
                                    <p>{fr ? 'Cible' : 'Target'}: {target} ({labels[target]})</p>
                                    {gap > 0 && <p className="text-red-500">Gap: -{gap}</p>}
                                    {gap <= 0 && <p className="text-green-500">{fr ? 'Au niveau' : 'On target'}</p>}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
