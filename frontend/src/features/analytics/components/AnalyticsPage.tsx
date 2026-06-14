import { useState } from 'react';
import { useQuery } from '@apollo/client';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { REVENUE_ANALYTICS_QUERY, REPUTATION_OVERVIEW_QUERY, OUTLET_PERFORMANCE_QUERY } from '@/features/dashboard/api/dashboard.graphql';
import { REVIEW_STATISTICS_QUERY } from '@/features/reviews/api/review.graphql';
import { formatCurrency, getRatingColor, cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Award, ThumbsUp, ThumbsDown, Minus } from 'lucide-react';

const COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ef4444', '#14b8a6'];

type Range = '7d' | '30d' | '90d';

const rangeLabel: Record<Range, string> = { '7d': '7 Days', '30d': '30 Days', '90d': '90 Days' };

function getDateRange(range: Range): { startDate: Date; endDate: Date } {
  const end = new Date();
  const start = new Date();
  if (range === '7d') start.setDate(end.getDate() - 7);
  else if (range === '30d') start.setDate(end.getDate() - 30);
  else start.setDate(end.getDate() - 90);
  return { startDate: start, endDate: end };
}

export function AnalyticsPage() {
  const [range, setRange] = useState<Range>('30d');
  const { startDate, endDate } = getDateRange(range);

  const { data: revenueData, loading: revenueLoading } = useQuery(REVENUE_ANALYTICS_QUERY, {
    variables: { startDate, endDate },
  });

  const { data: reputationData, loading: reputationLoading } = useQuery(REPUTATION_OVERVIEW_QUERY);
  const { data: performanceData, loading: perfLoading } = useQuery(OUTLET_PERFORMANCE_QUERY, { variables: { limit: 10 } });
  const { data: reviewStatsData } = useQuery(REVIEW_STATISTICS_QUERY);

  const revenue = revenueData?.revenueAnalytics;
  const reputation = reputationData?.reputationOverview ?? [];
  const performances = performanceData?.outletPerformance ?? [];
  const reviewStats = reviewStatsData?.reviewStatistics;

  const sentimentData = reviewStats ? [
    { name: 'Positive', value: reviewStats.positiveCount, color: '#22c55e' },
    { name: 'Neutral', value: reviewStats.neutralCount, color: '#f59e0b' },
    { name: 'Negative', value: reviewStats.negativeCount, color: '#ef4444' },
  ] : [];

  const radarData = performances.slice(0, 6).map((p: any) => ({
    outlet: p.outlet.name.split(' - ')[1] ?? p.outlet.name,
    rating: p.averageRating * 20,
    reputation: p.reputationScore,
    reviews: Math.min(100, (p.reviewCount / 10) * 100),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">Deep dive into your franchise performance</p>
        </div>

        {/* Date Range Selector */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {(['7d', '30d', '90d'] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                range === r ? 'bg-white shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {rangeLabel[r]}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue Overview Cards */}
      {revenue && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(revenue.totalRevenue)}</p>
              <div className={cn('flex items-center gap-1 mt-1 text-sm', revenue.growthPercentage >= 0 ? 'text-green-600' : 'text-red-600')}>
                {revenue.growthPercentage >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {Math.abs(revenue.growthPercentage).toFixed(1)}% vs previous period
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Previous Period</p>
              <p className="text-2xl font-bold mt-1">{formatCurrency(revenue.previousRevenue)}</p>
              <p className="text-xs text-muted-foreground mt-1">Comparison baseline</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Avg Daily Revenue</p>
              <p className="text-2xl font-bold mt-1">
                {formatCurrency(revenue.dailyData.length > 0
                  ? revenue.totalRevenue / revenue.dailyData.length
                  : 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Over {rangeLabel[range].toLowerCase()}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Revenue Area Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          {revenueLoading ? (
            <div className="h-[280px] animate-pulse bg-muted rounded" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenue?.dailyData ?? []}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                <Area type="monotone" dataKey="amount" stroke="#f97316" strokeWidth={2} fill="url(#revenueGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Outlet Revenue Bar + Reputation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Outlet */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Outlet</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueLoading ? (
              <div className="h-[240px] animate-pulse bg-muted rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={revenue?.byOutlet ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="outlet.name" tick={{ fontSize: 11 }} width={100}
                    tickFormatter={(v: string) => v.split(' - ')[1] ?? v.slice(0, 12)} />
                  <Tooltip formatter={(v: number) => [formatCurrency(v), 'Revenue']} />
                  <Bar dataKey="revenue" fill="#f97316" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Reputation Scores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Reputation Scores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reputationLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-muted rounded" />)}
              </div>
            ) : (
              <div className="space-y-3">
                {reputation.map((item: any) => (
                  <div key={item.outletId} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium truncate max-w-[160px]">{item.outletName}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-bold">{item.score.toFixed(1)}</span>
                        <span className={cn('text-xs flex items-center gap-0.5', item.trend >= 0 ? 'text-green-600' : 'text-red-600')}>
                          {item.trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {Math.abs(item.trend).toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={cn('h-2 rounded-full transition-all', item.score >= 80 ? 'bg-green-500' : item.score >= 60 ? 'bg-yellow-500' : 'bg-red-500')}
                        style={{ width: `${Math.min(100, item.score)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">⭐ {item.averageRating.toFixed(1)} · {item.totalReviews} reviews</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Review Sentiment + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Review Sentiment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reviewStats ? (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Total Reviews</span>
                  <span className="font-bold">{reviewStats.totalReviews}</span>
                </div>
                {sentimentData.map(({ name, value, color }) => {
                  const pct = reviewStats.totalReviews > 0 ? (value / reviewStats.totalReviews) * 100 : 0;
                  const Icon = name === 'Positive' ? ThumbsUp : name === 'Negative' ? ThumbsDown : Minus;
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="flex items-center gap-1.5"><Icon className="h-4 w-4" style={{ color }} />{name}</span>
                        <span className="font-medium">{value} ({pct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div className="h-2.5 rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
                      </div>
                    </div>
                  );
                })}

                <div className="pt-3 border-t space-y-2">
                  <p className="text-sm font-medium">Response Rate</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-2.5">
                      <div className="h-2.5 rounded-full bg-blue-500" style={{ width: `${reviewStats.responseRate}%` }} />
                    </div>
                    <span className="text-sm font-bold text-blue-600">{reviewStats.responseRate.toFixed(0)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-1 pt-2 border-t">
                  {reviewStats.ratingDistribution.map(({ rating, count, percentage }: { rating: number; count: number; percentage: number }) => (
                    <div key={rating} className="text-center">
                      <div className="text-xs text-muted-foreground">{rating}★</div>
                      <div className="w-full bg-muted rounded mt-1 flex flex-col-reverse" style={{ height: '60px' }}>
                        <div className="bg-yellow-400 rounded" style={{ height: `${percentage}%` }} />
                      </div>
                      <div className="text-xs font-medium mt-1">{count}</div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-40 animate-pulse bg-muted rounded" />
            )}
          </CardContent>
        </Card>

        {/* Outlet Radar */}
        <Card>
          <CardHeader>
            <CardTitle>Outlet Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {perfLoading ? (
              <div className="h-[280px] animate-pulse bg-muted rounded" />
            ) : radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="outlet" tick={{ fontSize: 11 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="Rating" dataKey="rating" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />
                  <Radar name="Reputation" dataKey="reputation" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />
                  <Legend />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-muted-foreground text-sm">No outlet data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Source Distribution Table */}
      {reviewStats && reviewStats.sourceDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reviews by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {reviewStats.sourceDistribution.map(({ source, count, percentage, averageRating }: { source: string; count: number; percentage: number; averageRating: number }, idx: number) => (
                <div key={source} className="text-center p-3 rounded-lg border hover:bg-muted/30 transition-colors">
                  <div className="text-2xl mb-1">
                    {source === 'GOOGLE' ? '🔍' : source === 'WHATSAPP' ? '📱' : source === 'FACEBOOK' ? '📘' : source === 'ZOMATO' ? '🍕' : source === 'SWIGGY' ? '🛵' : '🏠'}
                  </div>
                  <p className="text-xs font-medium">{source}</p>
                  <p className="text-lg font-bold mt-1" style={{ color: COLORS[idx % COLORS.length] }}>{count}</p>
                  <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</p>
                  <p className={cn('text-xs font-medium mt-1', getRatingColor(averageRating))}>⭐ {averageRating.toFixed(1)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
