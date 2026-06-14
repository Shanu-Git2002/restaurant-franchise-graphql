import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { schema } from './graphql';
import { buildContext } from './middleware/auth.middleware';
import { errorHandler } from './middleware/error.middleware';
import { formatGraphQLError } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { connectDatabase, disconnectDatabase } from './config/database';
import { redis } from './config/redis';
import { config } from './config';

async function bootstrap() {
  const app = express();
  const httpServer = http.createServer(app);

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({ server: httpServer, path: '/graphql' });
  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        const token = ctx.connectionParams?.authorization as string | undefined;
        if (!token) return { user: null };
        const { authService } = await import('./modules/auth/auth.service');
        const cleanToken = token.startsWith('Bearer ') ? token.slice(7) : token;
        const user = await authService.getUserFromToken(cleanToken);
        return { user };
      },
    },
    wsServer
  );

  const apolloServer = new ApolloServer({
    schema,
    formatError: formatGraphQLError,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await serverCleanup.dispose();
            },
          };
        },
      },
    ],
    introspection: config.isDev,
  });

  await apolloServer.start();

  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      contentSecurityPolicy: config.isDev ? false : undefined,
    })
  );

  app.use(cors({ origin: config.cors.origins, credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(morgan(config.isDev ? 'dev' : 'combined'));
  app.use('/graphql', apiLimiter);

  app.use(
    '/graphql',
    expressMiddleware(apolloServer, {
      context: async ({ req }) => buildContext(req),
    })
  );

  app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
  });

  app.use(errorHandler);

  // Connect to databases
  await connectDatabase();
  await redis.connect();

  httpServer.listen(config.port, () => {
    console.log(`\n🚀 Server ready at http://localhost:${config.port}/graphql`);
    console.log(`📡 Subscriptions ready at ws://localhost:${config.port}/graphql`);
    console.log(`🌍 Environment: ${config.env}\n`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    await apolloServer.stop();
    await disconnectDatabase();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
