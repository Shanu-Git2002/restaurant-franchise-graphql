import { Prisma, ReviewSource, Sentiment } from '@prisma/client';
import { prisma } from '../../config/database';

const reviewInclude = {
  outlet: { include: { franchise: true } },
} satisfies Prisma.ReviewInclude;

export class ReviewRepository {
  async findAll(params: {
    where?: Prisma.ReviewWhereInput;
    orderBy?: Prisma.ReviewOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const [data, total] = await Promise.all([
      prisma.review.findMany({ ...params, include: reviewInclude }),
      prisma.review.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.review.findUnique({ where: { id }, include: reviewInclude });
  }

  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data, include: reviewInclude });
  }

  async update(id: string, data: Prisma.ReviewUpdateInput) {
    return prisma.review.update({ where: { id }, data, include: reviewInclude });
  }

  async delete(id: string) {
    await prisma.review.delete({ where: { id } });
  }

  async getStatistics(outletId?: string, startDate?: Date, endDate?: Date) {
    const where: Prisma.ReviewWhereInput = {};
    if (outletId) where.outletId = outletId;
    if (startDate || endDate) {
      where.reviewDate = {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      };
    }

    const [
      totalReviews,
      avgRating,
      positiveCount,
      neutralCount,
      negativeCount,
      respondedCount,
      ratingGroups,
      sourceGroups,
      trendData,
    ] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.aggregate({ where, _avg: { rating: true } }),
      prisma.review.count({ where: { ...where, sentiment: Sentiment.POSITIVE } }),
      prisma.review.count({ where: { ...where, sentiment: Sentiment.NEUTRAL } }),
      prisma.review.count({ where: { ...where, sentiment: Sentiment.NEGATIVE } }),
      prisma.review.count({ where: { ...where, isResponded: true } }),
      prisma.review.groupBy({ by: ['rating'], where, _count: true, orderBy: { rating: 'asc' } }),
      prisma.review.groupBy({ by: ['source'], where, _count: true, _avg: { rating: true } }),
      this.getReviewTrend(where),
    ]);

    const total = totalReviews || 1;
    return {
      totalReviews,
      averageRating: avgRating._avg.rating ?? 0,
      positiveCount,
      neutralCount,
      negativeCount,
      responseRate: (respondedCount / total) * 100,
      ratingDistribution: ratingGroups.map((g) => ({
        rating: Math.round(g.rating),
        count: g._count,
        percentage: (g._count / total) * 100,
      })),
      sourceDistribution: sourceGroups.map((g) => ({
        source: g.source,
        count: g._count,
        percentage: (g._count / total) * 100,
        averageRating: g._avg.rating ?? 0,
      })),
      trendData,
    };
  }

  private async getReviewTrend(where: Prisma.ReviewWhereInput) {
    const reviews = await prisma.review.findMany({
      where,
      select: { reviewDate: true, rating: true },
      orderBy: { reviewDate: 'asc' },
    });

    const byDate = new Map<string, { count: number; totalRating: number }>();
    reviews.forEach((r) => {
      const date = r.reviewDate.toISOString().split('T')[0];
      const existing = byDate.get(date) ?? { count: 0, totalRating: 0 };
      byDate.set(date, { count: existing.count + 1, totalRating: existing.totalRating + r.rating });
    });

    return Array.from(byDate.entries()).map(([date, { count, totalRating }]) => ({
      date,
      count,
      averageRating: totalRating / count,
    }));
  }
}

export const reviewRepository = new ReviewRepository();
