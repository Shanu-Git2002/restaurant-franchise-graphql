import { Prisma, OutletStatus } from '@prisma/client';
import { GraphQLError } from 'graphql';
import { outletRepository, franchiseRepository } from './outlet.repository';
import { AuthUser, PaginationArgs, FilterArgs, SortArgs } from '../../types';
import { deleteCache, invalidatePattern, getCache, setCache, CACHE_TTL } from '../../config/redis';
import slugify from 'slugify';

export class OutletService {
  async getOutlets(
    user: AuthUser,
    filter?: {
      search?: string;
      status?: OutletStatus;
      city?: string;
      franchiseId?: string;
      managerId?: string;
    },
    sort?: { field: string; direction: 'asc' | 'desc' },
    pagination?: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, pagination?.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Prisma.OutletWhereInput = {};

    if (filter?.search) {
      where.OR = [
        { name: { contains: filter.search, mode: 'insensitive' } },
        { city: { contains: filter.search, mode: 'insensitive' } },
        { address: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter?.status) where.status = filter.status;
    if (filter?.city) where.city = { contains: filter.city, mode: 'insensitive' };
    if (filter?.franchiseId) where.franchiseId = filter.franchiseId;
    if (filter?.managerId) where.managerId = filter.managerId;

    const orderBy: Prisma.OutletOrderByWithRelationInput = sort?.field
      ? { [sort.field]: sort.direction ?? 'asc' }
      : { createdAt: 'desc' };

    const { data, total } = await outletRepository.findAll({ where, orderBy, skip, take: limit });

    return {
      data,
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
      hasPreviousPage: page > 1,
    };
  }

  async getOutletById(id: string) {
    const cacheKey = `outlet:${id}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const outlet = await outletRepository.findById(id);
    if (!outlet) {
      throw new GraphQLError('Outlet not found', { extensions: { code: 'NOT_FOUND' } });
    }
    await setCache(cacheKey, outlet, CACHE_TTL.SHORT);
    return outlet;
  }

  async createOutlet(user: AuthUser, input: {
    name: string;
    address: string;
    city: string;
    state: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    openingHours?: Record<string, unknown>;
    franchiseId: string;
    managerId?: string;
  }) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);

    const outlet = await outletRepository.create({
      name: input.name,
      address: input.address,
      city: input.city,
      state: input.state,
      country: input.country ?? 'India',
      postalCode: input.postalCode,
      latitude: input.latitude,
      longitude: input.longitude,
      phone: input.phone,
      email: input.email,
      openingHours: input.openingHours as unknown as Prisma.InputJsonValue,
      franchise: { connect: { id: input.franchiseId } },
      manager: input.managerId ? { connect: { id: input.managerId } } : undefined,
    });

    await invalidatePattern('outlets:*');
    return outlet;
  }

  async updateOutlet(user: AuthUser, id: string, input: Partial<{
    name: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    phone: string;
    email: string;
    status: OutletStatus;
    managerId: string;
    openingHours: Record<string, unknown>;
  }>) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const outlet = await outletRepository.findById(id);
    if (!outlet) throw new GraphQLError('Outlet not found', { extensions: { code: 'NOT_FOUND' } });

    if (user.role === 'MANAGER' && outlet.managerId !== user.id) {
      throw new GraphQLError('Access denied', { extensions: { code: 'FORBIDDEN' } });
    }

    const { managerId, openingHours, ...rest } = input;
    const updated = await outletRepository.update(id, {
      ...rest,
      openingHours: openingHours as unknown as Prisma.InputJsonValue,
      manager: managerId ? { connect: { id: managerId } } : undefined,
    });

    await deleteCache(`outlet:${id}`);
    await invalidatePattern('outlets:*');
    return updated;
  }

  async deleteOutlet(user: AuthUser, id: string) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);

    const outlet = await outletRepository.findById(id);
    if (!outlet) throw new GraphQLError('Outlet not found', { extensions: { code: 'NOT_FOUND' } });

    await outletRepository.delete(id);
    await deleteCache(`outlet:${id}`);
    await invalidatePattern('outlets:*');
    return { success: true, message: 'Outlet deleted successfully' };
  }

  async assignManager(user: AuthUser, outletId: string, managerId: string) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);
    return this.updateOutlet(user, outletId, { managerId });
  }

  async getFranchise(user: AuthUser) {
    const franchise = await franchiseRepository.findByOwnerId(user.id);
    return franchise;
  }

  async createFranchise(user: AuthUser, input: {
    name: string;
    description?: string;
    logoUrl?: string;
    website?: string;
    phone?: string;
    email?: string;
    address?: string;
  }) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);

    const existing = await franchiseRepository.findByOwnerId(user.id);
    if (existing) {
      throw new GraphQLError('Franchise already exists for this user', {
        extensions: { code: 'ALREADY_EXISTS' },
      });
    }

    const slug = slugify(input.name, { lower: true, strict: true }) + '-' + Date.now();
    return franchiseRepository.create({
      name: input.name,
      slug,
      description: input.description,
      logoUrl: input.logoUrl,
      website: input.website,
      phone: input.phone,
      email: input.email,
      address: input.address,
      owner: { connect: { id: user.id } },
    });
  }

  private requireRole(user: AuthUser, roles: string[]) {
    if (!roles.includes(user.role)) {
      throw new GraphQLError('Insufficient permissions', {
        extensions: { code: 'FORBIDDEN' },
      });
    }
  }
}

export const outletService = new OutletService();
