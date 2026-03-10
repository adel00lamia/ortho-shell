import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Star, Package, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';

const fadeIn = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: 'easeOut' as const },
  }),
};

interface ListingRow {
  id: string;
  title: string;
  price: number;
  status: string;
  rating: number | null;
}

interface PurchaseRow {
  id: string;
  listing_id: string;
  amount: number;
  created_at: string;
  marketplace_listings: {
    id: string;
    title: string;
    rating: number | null;
  };
}

interface ListingBreakdown {
  id: string;
  title: string;
  salesCount: number;
  revenue: number;
  avgRating: number | null;
}

interface MonthlyRevenue {
  label: string;
  total: number;
}

export const SellerAnalytics = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const fr = language === 'fr';

  // Fetch seller's listings
  const { data: listings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['seller-listings', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // marketplace_listings table not yet created - return empty
      return [] as ListingRow[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Fetch purchases for the seller's listings
  const { data: purchases = [], isLoading: purchasesLoading } = useQuery({
    queryKey: ['seller-purchases', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      // marketplace_purchases table not yet created - return empty
      return [] as PurchaseRow[];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Derived analytics
  const { totalRevenue, totalSales, avgRating, activeListings, breakdowns, monthlyData } =
    useMemo(() => {
      const activeListings = listings.filter((l) => l.status === 'active').length;

      // Revenue breakdown by listing
      const map = new Map<string, ListingBreakdown>();
      for (const listing of listings) {
        map.set(listing.id, {
          id: listing.id,
          title: listing.title,
          salesCount: 0,
          revenue: 0,
          avgRating: listing.rating,
        });
      }

      let totalRevenue = 0;
      const monthlyMap = new Map<string, number>();

      for (const p of purchases) {
        const amount = p.amount ?? 0;
        totalRevenue += amount;

        const entry = map.get(p.listing_id);
        if (entry) {
          entry.salesCount += 1;
          entry.revenue += amount;
        }

        // Monthly bucket
        const date = new Date(p.created_at);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyMap.set(key, (monthlyMap.get(key) ?? 0) + amount);
      }

      const totalSales = purchases.length;

      // Average rating across listings that have a rating
      const rated = listings.filter((l) => l.rating != null);
      const avgRating =
        rated.length > 0
          ? rated.reduce((sum, l) => sum + (l.rating ?? 0), 0) / rated.length
          : null;

      const breakdowns = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);

      // Last 6 months for trend
      const now = new Date();
      const monthlyData: MonthlyRevenue[] = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString(fr ? 'fr-FR' : 'en-US', {
          month: 'short',
          year: '2-digit',
        });
        monthlyData.push({ label, total: monthlyMap.get(key) ?? 0 });
      }

      return { totalRevenue, totalSales, avgRating, activeListings, breakdowns, monthlyData };
    }, [listings, purchases, fr]);

  const formatMAD = (cents: number) => {
    const value = (cents / 100).toLocaleString(fr ? 'fr-FR' : 'en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${value} MAD`;
  };

  const isLoading = listingsLoading || purchasesLoading;

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 w-24 rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="h-8 w-32 rounded bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const summaryCards = [
    {
      title: fr ? 'Revenu total' : 'Total Revenue',
      value: formatMAD(totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      title: fr ? 'Ventes totales' : 'Total Sales',
      value: String(totalSales),
      icon: TrendingUp,
      color: 'text-blue-600',
      bg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      title: fr ? 'Note moyenne' : 'Average Rating',
      value: avgRating != null ? avgRating.toFixed(1) : '--',
      icon: Star,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30',
    },
    {
      title: fr ? 'Annonces actives' : 'Active Listings',
      value: String(activeListings),
      icon: Package,
      color: 'text-violet-600',
      bg: 'bg-violet-50 dark:bg-violet-950/30',
    },
  ];

  const maxMonthly = Math.max(...monthlyData.map((m) => m.total), 1);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card, i) => (
          <motion.div
            key={card.title}
            variants={fadeIn}
            initial="hidden"
            animate="visible"
            custom={i}
          >
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle
                  className="text-sm font-medium text-muted-foreground"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {card.title}
                </CardTitle>
                <div className={`rounded-md p-2 ${card.bg}`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p
                  className="text-2xl font-bold tracking-tight"
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                >
                  {card.value}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Monthly revenue trend */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={4}>
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            <CardTitle
              className="text-base"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {fr ? 'Tendance des revenus mensuels' : 'Monthly Revenue Trend'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.every((m) => m.total === 0) ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {fr ? 'Aucune vente enregistrée' : 'No sales recorded yet'}
              </p>
            ) : (
              <div className="flex items-end gap-3" style={{ height: 180 }}>
                {monthlyData.map((month) => {
                  const heightPct = maxMonthly > 0 ? (month.total / maxMonthly) * 100 : 0;
                  return (
                    <div key={month.label} className="flex flex-1 flex-col items-center gap-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {month.total > 0 ? formatMAD(month.total) : ''}
                      </span>
                      <div className="relative w-full flex justify-center" style={{ height: 140 }}>
                        <motion.div
                          className="w-full max-w-[48px] rounded-t-md bg-primary/80 hover:bg-primary transition-colors"
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(heightPct, 2)}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          style={{ alignSelf: 'flex-end' }}
                          title={formatMAD(month.total)}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">{month.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue breakdown by listing */}
      <motion.div variants={fadeIn} initial="hidden" animate="visible" custom={5}>
        <Card>
          <CardHeader>
            <CardTitle
              className="text-base"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              {fr ? 'Revenus par annonce' : 'Revenue by Listing'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {breakdowns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {fr ? 'Aucune annonce trouvée' : 'No listings found'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 font-medium">{fr ? 'Annonce' : 'Listing'}</th>
                      <th className="pb-2 font-medium text-center">
                        {fr ? 'Ventes' : 'Sales'}
                      </th>
                      <th className="pb-2 font-medium text-right">
                        {fr ? 'Revenu' : 'Revenue'}
                      </th>
                      <th className="pb-2 font-medium text-center">
                        {fr ? 'Note' : 'Rating'}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {breakdowns.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                      >
                        <td className="py-3 pr-4 font-medium max-w-[240px] truncate">
                          {row.title}
                        </td>
                        <td className="py-3 text-center">
                          <Badge variant="secondary">{row.salesCount}</Badge>
                        </td>
                        <td className="py-3 text-right font-mono text-sm">
                          {formatMAD(row.revenue)}
                        </td>
                        <td className="py-3 text-center">
                          {row.avgRating != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                              {row.avgRating.toFixed(1)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">--</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};
