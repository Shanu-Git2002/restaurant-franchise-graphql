import { Prisma, OutletStatus } from '@prisma/client';
import { prisma } from '../../config/database';

const outletInclude = {
  franchise: { include: { owner: true } },
  manager: true,
  employees: { include: { user: true } },
  _count: { select: { reviews: true, employees: true } },
} satisfies Prisma.OutletInclude;

export class OutletRepository {
  async findAll(params: {
    where?: Prisma.OutletWhereInput;
    orderBy?: Prisma.OutletOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const [data, total] = await Promise.all([
      prisma.outlet.findMany({ ...params, include: outletInclude }),
      prisma.outlet.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.outlet.findUnique({ where: { id }, include: outletInclude });
  }

  async findByFranchise(franchiseId: string) {
    return prisma.outlet.findMany({ where: { franchiseId }, include: outletInclude });
  }

  async create(data: Prisma.OutletCreateInput) {
    return prisma.outlet.create({ data, include: outletInclude });
  }

  async update(id: string, data: Prisma.OutletUpdateInput) {
    return prisma.outlet.update({ where: { id }, data, include: outletInclude });
  }

  async delete(id: string) {
    await prisma.outlet.delete({ where: { id } });
  }

  async getAverageRating(outletId: string): Promise<number> {
    const result = await prisma.review.aggregate({
      where: { outletId },
      _avg: { rating: true },
    });
    return result._avg.rating ?? 0;
  }

  async getTotalRevenue(outletId: string): Promise<number> {
    const result = await prisma.revenue.aggregate({
      where: { outletId },
      _sum: { amount: true },
    });
    return result._sum.amount ?? 0;
  }

  async getReputationScore(outletId: string): Promise<number | null> {
    const latest = await prisma.reputationScore.findFirst({
      where: { outletId },
      orderBy: { date: 'desc' },
    });
    return latest?.score ?? null;
  }
}

export const outletRepository = new OutletRepository();

export class FranchiseRepository {
  async findByOwnerId(ownerId: string) {
    return prisma.franchise.findUnique({
      where: { ownerId },
      include: { owner: true, outlets: true, _count: { select: { outlets: true } } },
    });
  }

  async create(data: Prisma.FranchiseCreateInput) {
    return prisma.franchise.create({
      data,
      include: { owner: true, outlets: true, _count: { select: { outlets: true } } },
    });
  }

  async update(id: string, data: Prisma.FranchiseUpdateInput) {
    return prisma.franchise.update({
      where: { id },
      data,
      include: { owner: true, outlets: true, _count: { select: { outlets: true } } },
    });
  }
}

export const franchiseRepository = new FranchiseRepository();
