import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

/** 4-stat cards row + 2 content panels — matches the Dashboard layout */
export const DashboardSkeleton = () => (
  <div className="p-6 space-y-6 animate-in fade-in duration-300">
    {/* Stats row */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>

    {/* Two-column content area */}
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-3 w-60" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="h-3 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>
    </div>
  </div>
);

/** Generic table skeleton for list pages */
export const TableSkeleton = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="flex items-center gap-4 px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center gap-4 px-4 py-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 flex-1" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
    ))}
  </div>
);

/** Card grid skeleton for marketplace / module listing pages */
export const CardGridSkeleton = ({ count = 6 }: { count?: number }) => (
  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <Card key={i}>
        <Skeleton className="h-40 w-full rounded-t-lg" />
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    ))}
  </div>
);
