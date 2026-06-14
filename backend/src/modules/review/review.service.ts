import { GraphQLError } from 'graphql';
import { ReviewSource, Sentiment } from '@prisma/client';
import { reviewRepository } from './review.repository';
import { AuthUser } from '../../types';
import { getCache, setCache, deleteCache, CACHE_TTL } from '../../config/redis';

const analyzeSentiment = (rating: number, content?: string): Sentiment => {
  if (rating >= 4) return Sentiment.POSITIVE;
  if (rating <= 2) return Sentiment.NEGATIVE;
  return Sentiment.NEUTRAL;
};

export class ReviewService {
  async getReviews(
    user: AuthUser,
    filter?: {
      outletId?: string;
      source?: ReviewSource;
      sentiment?: Sentiment;
      isResponded?: boolean;
      minRating?: number;
      maxRating?: number;
      startDate?: Date;
      endDate?: Date;
      search?: string;
    },
    sort?: { field: string; direction: 'asc' | 'desc' },
    pagination?: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, pagination?.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter?.outletId) where.outletId = filter.outletId;
    if (filter?.source) where.source = filter.source;
    if (filter?.sentiment) where.sentiment = filter.sentiment;
    if (filter?.isResponded !== undefined) where.isResponded = filter.isResponded;
    if (filter?.minRating !== undefined || filter?.maxRating !== undefined) {
      where.rating = {
        ...(filter.minRating !== undefined && { gte: filter.minRating }),
        ...(filter.maxRating !== undefined && { lte: filter.maxRating }),
      };
    }
    if (filter?.startDate || filter?.endDate) {
      where.reviewDate = {
        ...(filter.startDate && { gte: filter.startDate }),
        ...(filter.endDate && { lte: filter.endDate }),
      };
    }
    if (filter?.search) {
      where.OR = [
        { content: { contains: filter.search, mode: 'insensitive' } },
        { authorName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const orderBy = sort?.field
      ? { [sort.field]: sort.direction ?? 'desc' }
      : { reviewDate: 'desc' as const };

    const { data, total } = await reviewRepository.findAll({
      where: where as any,
      orderBy: orderBy as any,
      skip,
      take: limit,
    });

    return { data, total, page, limit, hasNextPage: skip + limit < total, hasPreviousPage: page > 1 };
  }

  async getReviewById(id: string) {
    const review = await reviewRepository.findById(id);
    if (!review) throw new GraphQLError('Review not found', { extensions: { code: 'NOT_FOUND' } });
    return review;
  }

  async getReviewStatistics(outletId?: string, startDate?: Date, endDate?: Date) {
    const cacheKey = `review-stats:${outletId ?? 'all'}:${startDate?.toISOString() ?? ''}:${endDate?.toISOString() ?? ''}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const stats = await reviewRepository.getStatistics(outletId, startDate, endDate);
    await setCache(cacheKey, stats, CACHE_TTL.MEDIUM);
    return stats;
  }

  async createReview(user: AuthUser, input: {
    outletId: string;
    source: ReviewSource;
    rating: number;
    content?: string;
    authorName: string;
    authorEmail?: string;
    authorPhone?: string;
    reviewDate: Date;
    externalId?: string;
    tags?: string[];
  }) {
    const sentiment = analyzeSentiment(input.rating, input.content);

    const review = await reviewRepository.create({
      outlet: { connect: { id: input.outletId } },
      source: input.source,
      rating: input.rating,
      content: input.content,
      authorName: input.authorName,
      authorEmail: input.authorEmail,
      authorPhone: input.authorPhone,
      sentiment,
      reviewDate: input.reviewDate,
      externalId: input.externalId,
      tags: input.tags ?? [],
    });

    await deleteCache(`review-stats:${input.outletId}:*`);
    return review;
  }

  async respondToReview(user: AuthUser, reviewId: string, response: string) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new GraphQLError('Review not found', { extensions: { code: 'NOT_FOUND' } });

    const updated = await reviewRepository.update(reviewId, {
      response,
      isResponded: true,
      respondedAt: new Date(),
    });

    await deleteCache(`review-stats:${review.outletId}:*`);
    return updated;
  }

  async deleteReview(user: AuthUser, id: string) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);

    const review = await reviewRepository.findById(id);
    if (!review) throw new GraphQLError('Review not found', { extensions: { code: 'NOT_FOUND' } });

    await reviewRepository.delete(id);
    await deleteCache(`review-stats:${review.outletId}:*`);
    return { success: true, message: 'Review deleted successfully' };
  }

  async importReviews(user: AuthUser, outletId: string, source: ReviewSource) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    // Stub: In production, integrate with Google My Business API or WhatsApp Business API
    return { success: true, message: `Import from ${source} initiated. Reviews will be synced shortly.` };
  }

  private requireRole(user: AuthUser, roles: string[]) {
    if (!roles.includes(user.role)) {
      throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });
    }
  }
}

export const reviewService = new ReviewService();
