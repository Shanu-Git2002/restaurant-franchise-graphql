import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database';
import { getCache, setCache, CACHE_TTL } from '../../config/redis';
import { AuthUser } from '../../types';

export class DashboardService {
  async getDashboardStats(user: AuthUser, franchiseId?: string) {
    const cacheKey = `dashboard:stats:${franchiseId ?? user.id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const outletWhere: Prisma.OutletWhereInput = franchiseId ? { franchiseId } : {};

    const [
      totalOutlets,
      activeOutlets,
      totalEmployees,
      reviewAgg,
      currentRevenue,
      previousRevenue,
      latestReputation,
    ] = await Promise.all([
      prisma.outlet.count({ where: outletWhere }),
      prisma.outlet.count({ where: { ...outletWhere, status: 'ACTIVE' } }),
      prisma.employee.count({ where: { outlet: outletWhere } }),
      prisma.review.aggregate({ where: { outlet: outletWhere }, _avg: { rating: true }, _count: true }),
      this.getRevenueSum(outletWhere, this.getDateRange('current')),
      this.getRevenueSum(outletWhere, this.getDateRange('previous')),
      prisma.reputationScore.aggregate({
        where: { outlet: outletWhere },
        _avg: { score: true },
      }),
    ]);

    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : 0;

    const currentMonthReviews = await prisma.review.count({
      where: { outlet: outletWhere, reviewDate: { gte: this.getDateRange('current').start } },
    });
    const prevMonthReviews = await prisma.review.count({
      where: {
        outlet: outletWhere,
        reviewDate: { gte: this.getDateRange('previous').start, lt: this.getDateRange('current').start },
      },
    });

    const stats = {
      totalOutlets,
      activeOutlets,
      totalEmployees,
      totalReviews: reviewAgg._count,
      averageRating: reviewAgg._avg.rating ?? 0,
      totalRevenue: currentRevenue,
      revenueGrowth,
      reviewGrowth: prevMonthReviews > 0 ? ((currentMonthReviews - prevMonthReviews) / prevMonthReviews) * 100 : 0,
      reputationScore: latestReputation._avg.score ?? 0,
    };

    await setCache(cacheKey, stats, CACHE_TTL.SHORT);
    return stats;
  }

  async getOutletPerformance(user: AuthUser, franchiseId?: string, limit = 10) {
    const outlets = await prisma.outlet.findMany({
      where: franchiseId ? { franchiseId } : {},
      include: {
        _count: { select: { reviews: true, employees: true } },
        reviews: { select: { rating: true } },
        revenues: { select: { amount: true } },
        reputationScores: { orderBy: { date: 'desc' }, take: 1 },
      },
      take: limit,
    });

    return outlets
      .map((outlet, index) => {
        const revenue = outlet.revenues.reduce((sum, r) => sum + r.amount, 0);
        const avgRating = outlet.reviews.length > 0
          ? outlet.reviews.reduce((sum, r) => sum + r.rating, 0) / outlet.reviews.length
          : 0;
        const reputationScore = outlet.reputationScores[0]?.score ?? 0;

        return {
          outlet: { ...outlet, employeeCount: outlet._count.employees },
          revenue,
          reviewCount: outlet._count.reviews,
          averageRating: avgRating,
          reputationScore,
          employeeCount: outlet._count.employees,
          rank: index + 1,
        };
      })
      .sort((a, b) => b.revenue - a.revenue)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }

  async getRevenueAnalytics(user: AuthUser, franchiseId?: string, startDate?: Date, endDate?: Date, granularity = 'day') {
    const start = startDate ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ?? new Date();
    const outletWhere: Prisma.OutletWhereInput = franchiseId ? { franchiseId } : {};

    const [currentRevenues, outlets] = await Promise.all([
      prisma.revenue.findMany({
        where: { outlet: outletWhere, date: { gte: start, lte: end } },
        include: { outlet: { select: { name: true } } },
        orderBy: { date: 'asc' },
      }),
      prisma.outlet.findMany({ where: outletWhere, select: { id: true, name: true } }),
    ]);

    const previousStart = new Date(start.getTime() - (end.getTime() - start.getTime()));
    const previousRevenue = await this.getRevenueSum(outletWhere, { start: previousStart, end: start });
    const totalRevenue = currentRevenues.reduce((sum, r) => sum + r.amount, 0);

    const dailyMap = new Map<string, { amount: number }>();
    currentRevenues.forEach((r) => {
      const date = r.date.toISOString().split('T')[0];
      const existing = dailyMap.get(date) ?? { amount: 0 };
      dailyMap.set(date, { amount: existing.amount + r.amount });
    });

    const outletRevenues = outlets.map((outlet) => {
      const revenue = currentRevenues
        .filter((r) => r.outletId === outlet.id)
        .reduce((sum, r) => sum + r.amount, 0);
      return { outlet, revenue, percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0 };
    });

    return {
      totalRevenue,
      previousRevenue,
      growthPercentage: previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0,
      dailyData: Array.from(dailyMap.entries()).map(([date, { amount }]) => ({ date, amount })),
      byOutlet: outletRevenues,
    };
  }

  async getReputationOverview(user: AuthUser, franchiseId?: string) {
    const outlets = await prisma.outlet.findMany({
      where: franchiseId ? { franchiseId } : {},
      include: {
        reputationScores: { orderBy: { date: 'desc' }, take: 2 },
        _count: { select: { reviews: true } },
        reviews: { select: { rating: true } },
      },
    });

    return outlets.map((outlet) => {
      const current = outlet.reputationScores[0]?.score ?? 0;
      const previous = outlet.reputationScores[1]?.score ?? current;
      const avgRating = outlet.reviews.length > 0
        ? outlet.reviews.reduce((sum, r) => sum + r.rating, 0) / outlet.reviews.length
        : 0;

      return {
        outletId: outlet.id,
        outletName: outlet.name,
        score: current,
        trend: current - previous,
        totalReviews: outlet._count.reviews,
        averageRating: avgRating,
      };
    });
  }

  private async getRevenueSum(outletWhere: Prisma.OutletWhereInput, range: { start: Date; end: Date }) {
    const result = await prisma.revenue.aggregate({
      where: { outlet: outletWhere, date: { gte: range.start, lte: range.end } },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  private getDateRange(period: 'current' | 'previous') {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (period === 'previous') {
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    }
    return { start, end };
  }
}

export const dashboardService = new DashboardService();
