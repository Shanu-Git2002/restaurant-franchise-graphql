import { GraphQLContext } from '../../types';
import { authService } from '../../modules/auth/auth.service';
import { requireAuth } from '../../middleware/auth.middleware';

export const authResolvers = {
  Query: {
    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return authService.getMe(ctx.user!.id);
    },
  },

  Mutation: {
    register: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      return authService.register(input);
    },

    login: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      return authService.login(input);
    },

    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return authService.logout(ctx.user!.id);
    },

    refreshToken: async (_: unknown, { token }: { token: string }, ctx: GraphQLContext) => {
      return authService.refreshTokens(token);
    },

    forgotPassword: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      return authService.forgotPassword(input.email);
    },

    resetPassword: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      return authService.resetPassword(input.token, input.password);
    },

    changePassword: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return authService.changePassword(ctx.user!.id, input.currentPassword, input.newPassword);
    },

    updateProfile: async (_: unknown, { input }: { input: any }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return authService.updateProfile(ctx.user!.id, input);
    },
  },

  User: {
    fullName: (parent: any) => `${parent.firstName} ${parent.lastName}`,
    employee: async (parent: any) => parent.employee ?? null,
    managedOutlets: async (parent: any) => parent.managedOutlets ?? [],
  },
};
