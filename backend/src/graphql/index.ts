import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import { DateTimeResolver, JSONResolver } from 'graphql-scalars';
import { readFileSync } from 'fs';
import path from 'path';
import { authResolvers } from './resolvers/auth.resolver';
import { outletResolvers } from './resolvers/outlet.resolver';
import { employeeResolvers } from './resolvers/employee.resolver';
import { reviewResolvers } from './resolvers/review.resolver';
import { dashboardResolvers } from './resolvers/dashboard.resolver';

const schemaDir = path.join(__dirname, 'schema');
const schemaFiles = ['root', 'scalars', 'auth', 'outlet', 'employee', 'review', 'dashboard'];

const typeDefs = mergeTypeDefs(
  schemaFiles.map((f) => readFileSync(path.join(schemaDir, `${f}.graphql`), 'utf-8'))
);

const scalarResolvers = {
  DateTime: DateTimeResolver,
  JSON: JSONResolver,
};

const resolvers = mergeResolvers([
  scalarResolvers,
  authResolvers,
  outletResolvers,
  employeeResolvers,
  reviewResolvers,
  dashboardResolvers,
] as any[]);

export const schema = makeExecutableSchema({ typeDefs, resolvers });
