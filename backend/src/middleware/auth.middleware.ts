import { GraphQLError } from 'graphql';
import { Request, Response, NextFunction } from 'express';
import { authService } from '../modules/auth/auth.service';
import { GraphQLContext, AuthUser } from '../types';

export function requireAuth(ctx: GraphQLContext): asserts ctx is GraphQLContext & { user: AuthUser } {
  if (!ctx.user) {
    throw new GraphQLError('Authentication required', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
}

export function requireRole(ctx: GraphQLContext, roles: string[]) {
  requireAuth(ctx);
  if (!roles.includes(ctx.user.role)) {
    throw new GraphQLError('Insufficient permissions', {
      extensions: { code: 'FORBIDDEN' },
    });
  }
}

export async function buildContext(req: Request): Promise<GraphQLContext> {
  const authHeader = req.headers.authorization;
  const token = authService.extractTokenFromHeader(authHeader);

  let user: AuthUser | null = null;
  if (token) {
    user = await authService.getUserFromToken(token);
  }

  return { user, req };
}
