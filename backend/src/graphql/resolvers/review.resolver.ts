import { GraphQLContext } from '../../types';
import { reviewService } from '../../modules/review/review.service';
import { requireAuth } from '../../middleware/auth.middleware';
import { pubsub, EVENTS } from '../subscriptions';

export const reviewResolvers = {
  Query: {
    reviews: async (_: unknown, { filter, sort, pagination }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return reviewService.getReviews(ctx.user!, filter, sort, pagination);
    },

    review: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return reviewService.getReviewById(id);
    },

    reviewStatistics: async (_: unknown, { outletId, startDate, endDate }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return reviewService.getReviewStatistics(outletId, startDate, endDate);
    },
  },

  Mutation: {
    createReview: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const review = await reviewService.createReview(ctx.user!, input);
      pubsub.publish(EVENTS.NEW_REVIEW, { newReview: review });
      return review;
    },

    respondToReview: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const review = await reviewService.respondToReview(ctx.user!, input.reviewId, input.response);
      pubsub.publish(EVENTS.REVIEW_RESPONSE_ADDED, { reviewResponseAdded: review });
      return review;
    },

    deleteReview: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return reviewService.deleteReview(ctx.user!, id);
    },

    importReviews: async (_: unknown, { outletId, source }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return reviewService.importReviews(ctx.user!, outletId, source);
    },
  },

  Subscription: {
    newReview: {
      subscribe: (_: unknown, { outletId }: any) => pubsub.asyncIterator([EVENTS.NEW_REVIEW]),
      resolve: (payload: any) => payload.newReview,
    },
    reviewResponseAdded: {
      subscribe: (_: unknown, { outletId }: any) => pubsub.asyncIterator([EVENTS.REVIEW_RESPONSE_ADDED]),
      resolve: (payload: any) => payload.reviewResponseAdded,
    },
  },
};
