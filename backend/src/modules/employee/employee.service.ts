import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';
import { Permission, Role } from '@prisma/client';
import { employeeRepository } from './employee.repository';
import { AuthUser } from '../../types';
import { config } from '../../config';

export class EmployeeService {
  async getEmployees(
    user: AuthUser,
    filter?: { search?: string; outletId?: string; role?: Role; position?: string },
    sort?: { field: string; direction: 'asc' | 'desc' },
    pagination?: { page?: number; limit?: number }
  ) {
    const page = Math.max(1, pagination?.page ?? 1);
    const limit = Math.min(100, pagination?.limit ?? 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter?.outletId) where.outletId = filter.outletId;
    if (filter?.role) where.user = { role: filter.role };
    if (filter?.search) {
      where.OR = [
        { user: { firstName: { contains: filter.search, mode: 'insensitive' } } },
        { user: { lastName: { contains: filter.search, mode: 'insensitive' } } },
        { user: { email: { contains: filter.search, mode: 'insensitive' } } },
        { position: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter?.position) where.position = { contains: filter.position, mode: 'insensitive' };

    const orderBy = sort?.field
      ? { [sort.field]: sort.direction ?? 'asc' }
      : { createdAt: 'desc' as const };

    const { data, total } = await employeeRepository.findAll({
      where: where as any,
      orderBy: orderBy as any,
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      hasNextPage: skip + limit < total,
      hasPreviousPage: page > 1,
    };
  }

  async getEmployeeById(id: string) {
    const employee = await employeeRepository.findById(id);
    if (!employee) {
      throw new GraphQLError('Employee not found', { extensions: { code: 'NOT_FOUND' } });
    }
    return employee;
  }

  async createEmployee(user: AuthUser, input: {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: Role;
    outletId: string;
    position: string;
    permissions?: Permission[];
    salary?: number;
  }) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, config.bcryptRounds);

    const employee = await employeeRepository.create({
      user: {
        email: input.email.toLowerCase(),
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role,
      },
      outletId: input.outletId,
      position: input.position,
      permissions: input.permissions ?? this.getDefaultPermissions(input.role),
      salary: input.salary,
    });

    // In production: send welcome email with temp password
    console.log(`Temporary password for ${input.email}: ${tempPassword}`);

    return employee;
  }

  async updateEmployee(user: AuthUser, id: string, input: {
    position?: string;
    role?: Role;
    permissions?: Permission[];
    salary?: number;
    outletId?: string;
  }) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);

    const employee = await employeeRepository.findById(id);
    if (!employee) throw new GraphQLError('Employee not found', { extensions: { code: 'NOT_FOUND' } });

    const { role, outletId, permissions, ...employeeData } = input;

    const updateData: Record<string, unknown> = { ...employeeData };
    if (outletId) updateData.outlet = { connect: { id: outletId } };
    if (permissions) updateData.permissions = permissions;
    if (role) {
      await employeeRepository.update(id, { user: { update: { role } } });
    }

    return employeeRepository.update(id, updateData as any);
  }

  async deleteEmployee(user: AuthUser, id: string) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN']);

    const employee = await employeeRepository.findById(id);
    if (!employee) throw new GraphQLError('Employee not found', { extensions: { code: 'NOT_FOUND' } });

    await employeeRepository.delete(id);
    return { success: true, message: 'Employee removed successfully' };
  }

  async updatePermissions(user: AuthUser, employeeId: string, permissions: Permission[]) {
    this.requireRole(user, ['SUPER_ADMIN', 'ADMIN', 'MANAGER']);
    const employee = await employeeRepository.findById(employeeId);
    if (!employee) throw new GraphQLError('Employee not found', { extensions: { code: 'NOT_FOUND' } });
    return employeeRepository.updatePermissions(employeeId, permissions);
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
    return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  }

  private getDefaultPermissions(role: Role): Permission[] {
    const permMap: Record<Role, Permission[]> = {
      SUPER_ADMIN: Object.values(Permission),
      ADMIN: [Permission.VIEW_DASHBOARD, Permission.MANAGE_OUTLETS, Permission.MANAGE_EMPLOYEES, Permission.MANAGE_REVIEWS, Permission.VIEW_ANALYTICS, Permission.EXPORT_REPORTS],
      MANAGER: [Permission.VIEW_DASHBOARD, Permission.MANAGE_EMPLOYEES, Permission.MANAGE_REVIEWS, Permission.VIEW_ANALYTICS],
      EMPLOYEE: [Permission.VIEW_DASHBOARD, Permission.MANAGE_REVIEWS],
    };
    return permMap[role] ?? [Permission.VIEW_DASHBOARD];
  }

  private requireRole(user: AuthUser, roles: string[]) {
    if (!roles.includes(user.role)) {
      throw new GraphQLError('Insufficient permissions', { extensions: { code: 'FORBIDDEN' } });
    }
  }
}

export const employeeService = new EmployeeService();
