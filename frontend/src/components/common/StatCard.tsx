import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: number;
  trendLabel?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red';
  loading?: boolean;
}

const colorMap = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
};

export function StatCard({ title, value, icon: Icon, trend, trendLabel, color = 'blue', loading }: StatCardProps) {
  const isPositiveTrend = (trend ?? 0) >= 0;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-1/2" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold mt-1">{value}</h3>
            {trend !== undefined && (
              <div className={cn('flex items-center gap-1 mt-1 text-sm', isPositiveTrend ? 'text-green-600' : 'text-red-600')}>
                {isPositiveTrend ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                <span>{Math.abs(trend).toFixed(1)}% {trendLabel ?? 'vs last month'}</span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', colorMap[color])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
