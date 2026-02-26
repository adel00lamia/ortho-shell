import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

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
  created_at: string;
}

interface ReimbursementDashboardProps {
  dossiers: Dossier[];
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'hsl(var(--muted-foreground))',
  submitted: 'hsl(220, 80%, 55%)',
  under_review: 'hsl(45, 90%, 50%)',
  approved: 'hsl(142, 70%, 45%)',
  rejected: 'hsl(0, 70%, 50%)',
  reimbursed: 'hsl(160, 70%, 40%)',
};

export default function ReimbursementDashboard({ dossiers }: ReimbursementDashboardProps) {
  const { t } = useLanguage();
  const r = t.reimbursement;

  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    dossiers.forEach(d => { counts[d.status] = (counts[d.status] || 0) + 1; });
    return Object.entries(counts).map(([status, count]) => ({
      name: (r.statuses as any)?.[status] || status,
      value: count,
      status,
    }));
  }, [dossiers, r]);

  const yearData = useMemo(() => {
    const byYear: Record<number, { totalAmount: number; reimbursed: number; count: number }> = {};
    dossiers.forEach(d => {
      if (!byYear[d.exercise_year]) byYear[d.exercise_year] = { totalAmount: 0, reimbursed: 0, count: 0 };
      byYear[d.exercise_year].totalAmount += d.total_amount || 0;
      byYear[d.exercise_year].reimbursed += d.status === 'reimbursed' ? (d.reimbursement_amount || 0) : 0;
      byYear[d.exercise_year].count += 1;
    });
    return Object.entries(byYear)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([year, data]) => ({
        year,
        [r.totalAmount]: data.totalAmount,
        [r.reimbursementAmount]: data.reimbursed,
        count: data.count,
      }));
  }, [dossiers, r]);

  const yearStatusData = useMemo(() => {
    const byYear: Record<number, Record<string, number>> = {};
    dossiers.forEach(d => {
      if (!byYear[d.exercise_year]) byYear[d.exercise_year] = {};
      byYear[d.exercise_year][d.status] = (byYear[d.exercise_year][d.status] || 0) + 1;
    });
    const allStatuses = [...new Set(dossiers.map(d => d.status))];
    return {
      data: Object.entries(byYear)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([year, statuses]) => ({
          year,
          ...Object.fromEntries(allStatuses.map(s => [(r.statuses as any)?.[s] || s, statuses[s] || 0])),
        })),
      statuses: allStatuses,
    };
  }, [dossiers, r]);

  const kpis = useMemo(() => {
    const totalAmount = dossiers.reduce((s, d) => s + (d.total_amount || 0), 0);
    const totalReimbursed = dossiers.filter(d => d.status === 'reimbursed').reduce((s, d) => s + (d.reimbursement_amount || 0), 0);
    const pendingAmount = dossiers.filter(d => ['submitted', 'under_review'].includes(d.status)).reduce((s, d) => s + (d.reimbursement_amount || 0), 0);
    const approvalRate = dossiers.length > 0
      ? Math.round((dossiers.filter(d => ['approved', 'reimbursed'].includes(d.status)).length / dossiers.length) * 100)
      : 0;
    const avgProcessingDays = (() => {
      const processed = dossiers.filter(d => d.status === 'reimbursed' || d.status === 'approved');
      return processed.length > 0 ? Math.round(processed.length * 15.5) : 0; // placeholder
    })();
    const totalHours = dossiers.reduce((s, d) => s + (d.total_hours || 0), 0);
    const totalParticipants = dossiers.reduce((s, d) => s + (d.total_participants || 0), 0);

    return { totalAmount, totalReimbursed, pendingAmount, approvalRate, totalHours, totalParticipants };
  }, [dossiers]);

  if (dossiers.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground py-12">{r.noDossiers}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        {[
          { label: r.totalAmount, value: `${kpis.totalAmount.toLocaleString()} MAD`, trend: 'up' as const },
          { label: r.totalReimbursed, value: `${kpis.totalReimbursed.toLocaleString()} MAD`, trend: 'up' as const },
          { label: (r as any).pendingAmount || 'Pending Amount', value: `${kpis.pendingAmount.toLocaleString()} MAD`, trend: 'neutral' as const },
          { label: (r as any).approvalRate || 'Approval Rate', value: `${kpis.approvalRate}%`, trend: kpis.approvalRate > 50 ? 'up' as const : 'down' as const },
          { label: r.totalHours, value: kpis.totalHours.toLocaleString(), trend: 'neutral' as const },
          { label: r.participants, value: kpis.totalParticipants.toLocaleString(), trend: 'neutral' as const },
        ].map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-4 pb-4 px-4">
              <p className="text-xs text-muted-foreground truncate">{kpi.label}</p>
              <p className="text-lg font-bold mt-1">{kpi.value}</p>
              <div className="mt-1">
                {kpi.trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-green-500" />}
                {kpi.trend === 'down' && <TrendingDown className="h-3.5 w-3.5 text-destructive" />}
                {kpi.trend === 'neutral' && <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{(r as any).statusDistribution || 'Status Distribution'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'hsl(var(--muted))'} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Amounts by Year Bar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{(r as any).amountsByYear || 'Amounts by Year'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey={r.totalAmount} fill="hsl(220, 80%, 55%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey={r.reimbursementAmount} fill="hsl(160, 70%, 40%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Dossiers by Year & Status Stacked Bar */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{(r as any).dossiersByYearStatus || 'Dossiers by Year & Status'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearStatusData.data}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis allowDecimals={false} className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {yearStatusData.statuses.map(status => (
                    <Bar
                      key={status}
                      dataKey={(r.statuses as any)?.[status] || status}
                      stackId="a"
                      fill={STATUS_COLORS[status] || 'hsl(var(--muted))'}
                      radius={[2, 2, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Dossiers Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{(r as any).recentDossiers || 'Recent Dossiers'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dossiers.slice(0, 5).map(d => (
              <div key={d.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">{d.exercise_year}</Badge>
                  <span className="text-sm font-medium">{d.title}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{(d.reimbursement_amount || 0).toLocaleString()} MAD</span>
                  <Badge variant="secondary" className="text-xs">
                    {(r.statuses as any)?.[d.status] || d.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
