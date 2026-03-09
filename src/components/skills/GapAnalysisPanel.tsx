import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSkills, useEmployeeSkills, useSkillCategories } from '@/hooks/useSkillsTaxonomy';
import { Loader2, User, TrendingUp, AlertTriangle } from 'lucide-react';

export const GapAnalysisPanel = () => {
  const { language } = useLanguage();
  const fr = language === 'fr';

  const { data: categories = [] } = useSkillCategories();
  const { data: skills = [], isLoading: skillsLoading } = useSkills();
  const { data: employeeSkills = [], isLoading: empLoading } = useEmployeeSkills();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');

  if (skillsLoading || empLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const employees = [...new Set(employeeSkills.map(es => es.employee_name))].sort();
  const empData = employeeSkills.filter(es => es.employee_name === selectedEmployee);

  // Build skill map for quick lookup
  const skillMap = new Map(skills.map(s => [s.id, s]));
  const catMap = new Map(categories.map(c => [c.id, c]));

  // Calculate per-skill gaps for selected employee
  const gaps = empData.map(es => {
    const skill = skillMap.get(es.skill_id);
    const category = skill ? catMap.get(skill.category_id) : null;
    return {
      skillId: es.skill_id,
      skillName: skill ? (fr ? skill.name_fr : skill.name_en) : 'Unknown',
      categoryName: category ? (fr ? category.name_fr : category.name_en) : '',
      current: es.current_level,
      target: es.target_level,
      gap: es.target_level - es.current_level,
      percent: es.target_level > 0 ? Math.round((es.current_level / es.target_level) * 100) : 100,
    };
  }).sort((a, b) => b.gap - a.gap);

  const criticalCount = gaps.filter(g => g.gap >= 2).length;
  const onTargetCount = gaps.filter(g => g.gap <= 0).length;
  const avgPercent = gaps.length > 0 ? Math.round(gaps.reduce((s, g) => s + g.percent, 0) / gaps.length) : 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <User className="h-5 w-5 text-primary" />
        <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder={fr ? 'Selectionner un employe' : 'Select an employee'} />
          </SelectTrigger>
          <SelectContent>
            {employees.map(emp => (
              <SelectItem key={emp} value={emp}>{emp}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedEmployee ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            {fr ? 'Selectionnez un employe pour voir son analyse de gaps' : 'Select an employee to see their gap analysis'}
          </p>
        </Card>
      ) : gaps.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {fr ? 'Aucune competence evaluee pour cet employe' : 'No skills assessed for this employee'}
          </p>
        </Card>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">{fr ? 'Niveau global' : 'Overall Level'}</div>
              <div className="text-2xl font-bold">{avgPercent}%</div>
              <Progress value={avgPercent} className="mt-2" />
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">{fr ? 'Gaps critiques' : 'Critical Gaps'}</div>
              <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            </Card>
            <Card className="p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">{fr ? 'Au niveau' : 'On Target'}</div>
              <div className="text-2xl font-bold text-green-600">{onTargetCount}</div>
            </Card>
          </div>

          {/* Skill detail list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{fr ? 'Detail des competences' : 'Skills Detail'} - {selectedEmployee}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {gaps.map(g => (
                <div key={g.skillId} className="flex items-center gap-3">
                  <div className="w-40">
                    <p className="text-sm font-medium truncate">{g.skillName}</p>
                    <p className="text-xs text-muted-foreground truncate">{g.categoryName}</p>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            g.gap >= 2 ? 'bg-red-500' : g.gap > 0 ? 'bg-amber-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${Math.min(100, g.percent)}%` }}
                        />
                      </div>
                      <span className="text-xs w-20 text-right text-muted-foreground">
                        {g.current}/{g.target}
                      </span>
                    </div>
                  </div>
                  {g.gap >= 2 && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="h-3 w-3 mr-1" />-{g.gap}
                    </Badge>
                  )}
                  {g.gap === 1 && (
                    <Badge variant="outline" className="text-xs text-amber-600">
                      <TrendingUp className="h-3 w-3 mr-1" />-1
                    </Badge>
                  )}
                  {g.gap <= 0 && (
                    <Badge variant="outline" className="text-xs text-green-600">OK</Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};
