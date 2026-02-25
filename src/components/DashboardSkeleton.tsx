import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export const StatCardSkeleton = () => (
  <Card>
    <CardContent className="flex items-center gap-4 p-6">
      <Skeleton className="w-12 h-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </CardContent>
  </Card>
);

export const ChartSkeleton = ({ className }: { className?: string }) => (
  <Card className={className}>
    <CardHeader><Skeleton className="h-5 w-40" /></CardHeader>
    <CardContent><Skeleton className="h-72 w-full rounded-lg" /></CardContent>
  </Card>
);

export const TableSkeleton = ({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) => (
  <div className="space-y-3">
    <div className="flex gap-4">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-4 flex-1" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex gap-4">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} className="h-10 flex-1" />
        ))}
      </div>
    ))}
  </div>
);

export const ActivitySkeleton = () => (
  <Card>
    <CardHeader><Skeleton className="h-5 w-32" /></CardHeader>
    <CardContent className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3">
          <Skeleton className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      <ChartSkeleton className="lg:col-span-2" />
      <ChartSkeleton />
    </div>
    <ChartSkeleton className="mb-6" />
    <ActivitySkeleton />
  </div>
);

export default DashboardSkeleton;
