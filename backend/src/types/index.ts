import { Request } from 'express';
import { Role } from '@prisma/client';

export interface JwtPayload {
  userId: string;
  email: string;
  role: Role;
  type: 'access' | 'refresh';
}

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

export interface GraphQLContext {
  user: AuthUser | null;
  req: Request;
}

export interface PaginationArgs {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface FilterArgs {
  search?: string;
  status?: string;
  source?: string;
  startDate?: string;
  endDate?: string;
}

export interface SortArgs {
  field: string;
  direction: 'asc' | 'desc';
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
