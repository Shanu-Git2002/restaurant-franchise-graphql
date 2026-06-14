import { useQuery } from '@apollo/client';
import { Store, Users, Star, DollarSign, TrendingUp, Award } from 'lucide-react';
import { StatCard } from '@/components/common/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatNumber, getRatingColor, cn } from '@/lib/utils';
import { DASHBOARD_STATS_QUERY, OUTLET_PERFORMANCE_QUERY, REVENUE_ANALYTICS_QUERY } from '../api/dashboard.graphql';
import { useAuthStore } from '@/store/auth.store';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444'];

export function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, loading: statsLoading } = useQuery(DASHBOARD_STATS_QUERY);
  const { data: perfData, loading: perfLoading } = useQuery(OUTLET_PERFORMANCE_QUERY, {
    variables: { limit: 5 },
  });
  const { data: revenueData, loading: revenueLoading } = useQuery(REVENUE_ANALYTICS_QUERY);

  const stats = statsData?.dashboardStats;
  const performances = perfData?.outletPerformance ?? [];
  const revenue = revenueData?.revenueAnalytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.firstName}! Here's your franchise overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Outlets"
          value={stats ? `${stats.activeOutlets}/${stats.totalOutlets}` : '-'}
          icon={Store}
          color="blue"
          loading={statsLoading}
        />
        <StatCard
          title="Total Employees"
          value={stats ? formatNumber(stats.totalEmployees) : '-'}
          icon={Users}
          color="purple"
          loading={statsLoading}
        />
        <StatCard
          title="Monthly Revenue"
          value={stats ? formatCurrency(stats.totalRevenue) : '-'}
          icon={DollarSign}
          trend={stats?.revenueGrowth}
          color="green"
          loading={statsLoading}
        />
        <StatCard
          title="Avg. Rating"
          value={stats ? stats.averageRating.toFixed(1) + ' / 5' : '-'}
          icon={Star}
          trend={stats?.reviewGrowth}
          trendLabel="review growth"
          color="orange"
          loading={statsLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Revenue Trend (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-[250px] animate-pulse bg-muted rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={revenue?.dailyData ?? []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} labelFormatter={l => `Date: ${l}`} />
                  <Line type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue by Outlet Pie */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-[250px] animate-pulse bg-muted rounded" />
            ) : (
              <div className="space-y-3">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={revenue?.byOutlet ?? []} dataKey="revenue" nameKey="outlet.name" cx="50%" cy="50%" outerRadius={70}>
                      {(revenue?.byOutlet ?? []).map((_: unknown, idx: number) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1">
                  {(revenue?.byOutlet ?? []).slice(0, 4).map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="truncate max-w-[100px]">{item.outlet.name}</span>
                      </div>
                      <span className="font-medium">{item.percentage.toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Outlet Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-orange-500" />
            Outlet Performance Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {perfLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 animate-pulse bg-muted rounded" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {performances.map((perf: any) => (
                <div key={perf.outlet.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      perf.rank === 1 ? 'bg-yellow-100 text-yellow-700' :
                      perf.rank === 2 ? 'bg-gray-100 text-gray-700' :
                      perf.rank === 3 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    )}>
                      #{perf.rank}
                    </div>
                    <div>
                      <p className="font-medium text-sm">{perf.outlet.name}</p>
                      <p className="text-xs text-muted-foreground">{perf.outlet.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-right hidden sm:block">
                      <p className="font-medium">{formatCurrency(perf.revenue)}</p>
                      <p className="text-xs text-muted-foreground">Revenue</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('font-medium', getRatingColor(perf.averageRating))}>
                        ⭐ {perf.averageRating.toFixed(1)}
                      </p>
                      <p className="text-xs text-muted-foreground">{perf.reviewCount} reviews</p>
                    </div>
                    <Badge variant={perf.outlet.status === 'ACTIVE' ? 'success' : 'destructive'} className="hidden md:flex">
                      {perf.outlet.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
