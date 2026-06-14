import { GraphQLContext } from '../../types';
import { dashboardService } from '../../modules/dashboard/dashboard.service';
import { requireAuth } from '../../middleware/auth.middleware';
import { pubsub, EVENTS } from '../subscriptions';

export const dashboardResolvers = {
  Query: {
    dashboardStats: async (_: unknown, { franchiseId }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return dashboardService.getDashboardStats(ctx.user!, franchiseId);
    },

    outletPerformance: async (_: unknown, { franchiseId, limit }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return dashboardService.getOutletPerformance(ctx.user!, franchiseId, limit);
    },

    revenueAnalytics: async (_: unknown, { franchiseId, startDate, endDate, granularity }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return dashboardService.getRevenueAnalytics(ctx.user!, franchiseId, startDate, endDate, granularity);
    },

    reputationOverview: async (_: unknown, { franchiseId }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return dashboardService.getReputationOverview(ctx.user!, franchiseId);
    },
  },

  Subscription: {
    dashboardUpdated: {
      subscribe: () => pubsub.asyncIterator([EVENTS.DASHBOARD_UPDATED]),
      resolve: (payload: any) => payload.dashboardUpdated,
    },
  },
};
