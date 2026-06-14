import { Request, Response, NextFunction } from 'express';
import { GraphQLFormattedError } from 'graphql';
import { config } from '../config';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.isDev ? err.message : 'Internal server error',
  });
}

export function formatGraphQLError(formattedError: GraphQLFormattedError, error: unknown): GraphQLFormattedError {
  if (config.isDev) {
    return formattedError;
  }

  const safeError: GraphQLFormattedError = {
    message: formattedError.message,
    locations: formattedError.locations,
    path: formattedError.path,
    extensions: {
      code: (formattedError.extensions as any)?.code ?? 'INTERNAL_SERVER_ERROR',
    },
  };

  if (['UNAUTHENTICATED', 'FORBIDDEN', 'NOT_FOUND', 'VALIDATION_ERROR'].includes(
    (safeError.extensions?.code as string) ?? ''
  )) {
    return safeError;
  }

  if ((safeError.extensions?.code as string)?.includes('INTERNAL')) {
    return { ...safeError, message: 'An unexpected error occurred.' };
  }

  return safeError;
}
