import { GraphQLContext } from '../../types';
import { outletService } from '../../modules/outlet/outlet.service';
import { outletRepository } from '../../modules/outlet/outlet.repository';
import { requireAuth } from '../../middleware/auth.middleware';
import { pubsub, EVENTS } from '../subscriptions';

export const outletResolvers = {
  Query: {
    outlets: async (_: unknown, { filter, sort, pagination }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.getOutlets(ctx.user!, filter, sort, pagination);
    },

    outlet: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.getOutletById(id);
    },

    franchise: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.getFranchise(ctx.user!);
    },
  },

  Mutation: {
    createOutlet: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const outlet = await outletService.createOutlet(ctx.user!, input);
      pubsub.publish(EVENTS.OUTLET_STATUS_CHANGED, { outletStatusChanged: outlet });
      return outlet;
    },

    updateOutlet: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      const outlet = await outletService.updateOutlet(ctx.user!, id, input);
      pubsub.publish(EVENTS.OUTLET_STATUS_CHANGED, { outletStatusChanged: outlet });
      return outlet;
    },

    deleteOutlet: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.deleteOutlet(ctx.user!, id);
    },

    assignManager: async (_: unknown, { outletId, managerId }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.assignManager(ctx.user!, outletId, managerId);
    },

    createFranchise: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return outletService.createFranchise(ctx.user!, input);
    },
  },

  Subscription: {
    outletStatusChanged: {
      subscribe: (_: unknown, { franchiseId }: any) =>
        pubsub.asyncIterator([EVENTS.OUTLET_STATUS_CHANGED]),
      resolve: (payload: any) => payload.outletStatusChanged,
    },
  },

  Outlet: {
    employeeCount: (parent: any) => parent._count?.employees ?? parent.employees?.length ?? 0,
    totalReviews: (parent: any) => parent._count?.reviews ?? parent.reviews?.length ?? 0,
    averageRating: async (parent: any) => {
      if (parent.reviews?.length) {
        const avg = parent.reviews.reduce((s: number, r: any) => s + r.rating, 0) / parent.reviews.length;
        return Math.round(avg * 10) / 10;
      }
      return outletRepository.getAverageRating(parent.id);
    },
    reputationScore: async (parent: any) => outletRepository.getReputationScore(parent.id),
    totalRevenue: async (parent: any) => outletRepository.getTotalRevenue(parent.id),
    employees: (parent: any) => parent.employees ?? [],
    reviews: (parent: any) => parent.reviews ?? [],
  },

  Franchise: {
    outletCount: (parent: any) => parent._count?.outlets ?? parent.outlets?.length ?? 0,
    outlets: (parent: any) => parent.outlets ?? [],
  },
};
