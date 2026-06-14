import { Prisma, Permission } from '@prisma/client';
import { prisma } from '../../config/database';

const employeeInclude = {
  user: true,
  outlet: { include: { franchise: true } },
} satisfies Prisma.EmployeeInclude;

export class EmployeeRepository {
  async findAll(params: {
    where?: Prisma.EmployeeWhereInput;
    orderBy?: Prisma.EmployeeOrderByWithRelationInput;
    skip?: number;
    take?: number;
  }) {
    const [data, total] = await Promise.all([
      prisma.employee.findMany({ ...params, include: employeeInclude }),
      prisma.employee.count({ where: params.where }),
    ]);
    return { data, total };
  }

  async findById(id: string) {
    return prisma.employee.findUnique({ where: { id }, include: employeeInclude });
  }

  async findByUserId(userId: string) {
    return prisma.employee.findUnique({ where: { userId }, include: employeeInclude });
  }

  async create(data: {
    user: Prisma.UserCreateInput;
    outletId: string;
    position: string;
    permissions: Permission[];
    salary?: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data: data.user });
      const employee = await tx.employee.create({
        data: {
          user: { connect: { id: user.id } },
          outlet: { connect: { id: data.outletId } },
          position: data.position,
          permissions: data.permissions,
          salary: data.salary,
        },
        include: employeeInclude,
      });
      return employee;
    });
  }

  async update(id: string, data: Prisma.EmployeeUpdateInput) {
    return prisma.employee.update({ where: { id }, data, include: employeeInclude });
  }

  async delete(id: string) {
    const employee = await prisma.employee.findUnique({ where: { id } });
    if (employee) {
      await prisma.employee.delete({ where: { id } });
      await prisma.user.delete({ where: { id: employee.userId } });
    }
  }

  async updatePermissions(id: string, permissions: Permission[]) {
    return prisma.employee.update({
      where: { id },
      data: { permissions },
      include: employeeInclude,
    });
  }
}

export const employeeRepository = new EmployeeRepository();
