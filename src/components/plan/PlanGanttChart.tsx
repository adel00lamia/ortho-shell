import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar, Clock, ChevronRight } from 'lucide-react';

interface Module {
  title: string;
  duration: string;
  type?: string;
  skills_covered?: string[];
  certification_level?: string;
}

interface PlanGanttChartProps {
  modules: Module[];
  totalDuration: number; // in months
}

export const PlanGanttChart = ({ modules, totalDuration }: PlanGanttChartProps) => {
  // Parse duration string to weeks
  const parseDuration = (duration: string): number => {
    const lower = duration.toLowerCase();
    if (lower.includes('week')) {
      const weeks = parseInt(lower) || 1;
      return weeks;
    }
    if (lower.includes('month')) {
      const months = parseInt(lower) || 1;
      return months * 4;
    }
    if (lower.includes('day')) {
      const days = parseInt(lower) || 1;
      return Math.ceil(days / 7);
    }
    if (lower.includes('hour')) {
      return 1; // Minimum 1 week for hourly trainings
    }
    return 2; // Default 2 weeks
  };

  // Calculate module positions
  const totalWeeks = totalDuration * 4;
  let currentWeek = 0;
  
  const modulePositions = modules.map((module, idx) => {
    const duration = parseDuration(module.duration);
    const startWeek = currentWeek;
    currentWeek += duration;
    
    return {
      ...module,
      startWeek,
      durationWeeks: duration,
      startPercent: (startWeek / totalWeeks) * 100,
      widthPercent: Math.max((duration / totalWeeks) * 100, 5), // Minimum 5% width for visibility
      color: getModuleColor(idx),
    };
  });

  // Generate month markers
  const months = Array.from({ length: totalDuration }, (_, i) => i + 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Training Timeline (Gantt Chart)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Timeline Header */}
        <div className="relative">
          <div className="flex border-b pb-2 mb-4">
            <div className="w-48 flex-shrink-0 font-medium text-sm text-muted-foreground">
              Module
            </div>
            <div className="flex-1 flex relative">
              {months.map((month) => (
                <div
                  key={month}
                  className="flex-1 text-center text-xs text-muted-foreground border-l border-dashed"
                >
                  Month {month}
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="space-y-3">
            {modulePositions.map((module, idx) => (
              <div key={idx} className="flex items-center group">
                <div className="w-48 flex-shrink-0 pr-4">
                  <div className="font-medium text-sm truncate" title={module.title}>
                    {module.title}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {module.duration}
                  </div>
                </div>
                <div className="flex-1 relative h-10 bg-muted/30 rounded">
                  {/* Grid lines */}
                  {months.map((_, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/20"
                      style={{ left: `${((i + 1) / totalDuration) * 100}%` }}
                    />
                  ))}
                  
                  {/* Module bar */}
                  <div
                    className={`absolute top-1 bottom-1 rounded-md ${module.color} transition-all group-hover:shadow-lg cursor-pointer flex items-center justify-center`}
                    style={{
                      left: `${module.startPercent}%`,
                      width: `${module.widthPercent}%`,
                    }}
                  >
                    <span className="text-xs text-white font-medium truncate px-2">
                      {module.durationWeeks}w
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          {modulePositions.slice(0, 6).map((module, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded ${module.color}`} />
              <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                {module.title}
              </span>
            </div>
          ))}
          {modulePositions.length > 6 && (
            <span className="text-xs text-muted-foreground">
              +{modulePositions.length - 6} more
            </span>
          )}
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Modules</p>
            <p className="text-lg font-bold">{modules.length}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Total Duration</p>
            <p className="text-lg font-bold">{totalDuration} months</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Est. Training Weeks</p>
            <p className="text-lg font-bold">{currentWeek}</p>
          </div>
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">Avg per Module</p>
            <p className="text-lg font-bold">{Math.round(currentWeek / modules.length)} weeks</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function getModuleColor(index: number): string {
  const colors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-orange-500',
    'bg-pink-500',
    'bg-cyan-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
    'bg-teal-500',
  ];
  return colors[index % colors.length];
}
