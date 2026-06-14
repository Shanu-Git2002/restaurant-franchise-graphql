import { GraphQLContext } from '../../types';
import { employeeService } from '../../modules/employee/employee.service';
import { requireAuth } from '../../middleware/auth.middleware';

export const employeeResolvers = {
  Query: {
    employees: async (_: unknown, { filter, sort, pagination }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.getEmployees(ctx.user!, filter, sort, pagination);
    },

    employee: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.getEmployeeById(id);
    },
  },

  Mutation: {
    createEmployee: async (_: unknown, { input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.createEmployee(ctx.user!, input);
    },

    updateEmployee: async (_: unknown, { id, input }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.updateEmployee(ctx.user!, id, input);
    },

    deleteEmployee: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.deleteEmployee(ctx.user!, id);
    },

    updatePermissions: async (_: unknown, { employeeId, permissions }: any, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return employeeService.updatePermissions(ctx.user!, employeeId, permissions);
    },
  },
};
