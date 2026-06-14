import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('4000'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_ACCESS_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().default('noreply@franchise.com'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  BCRYPT_ROUNDS: z.string().default('12'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  port: parseInt(parsed.data.PORT, 10),
  db: { url: parsed.data.DATABASE_URL },
  redis: { url: parsed.data.REDIS_URL },
  jwt: {
    accessSecret: parsed.data.JWT_ACCESS_SECRET,
    refreshSecret: parsed.data.JWT_REFRESH_SECRET,
    accessExpiry: parsed.data.JWT_ACCESS_EXPIRY,
    refreshExpiry: parsed.data.JWT_REFRESH_EXPIRY,
  },
  cors: { origins: parsed.data.CORS_ORIGINS.split(',').map(o => o.trim()) },
  smtp: {
    host: parsed.data.SMTP_HOST,
    port: parsed.data.SMTP_PORT ? parseInt(parsed.data.SMTP_PORT, 10) : undefined,
    user: parsed.data.SMTP_USER,
    pass: parsed.data.SMTP_PASS,
    fromEmail: parsed.data.FROM_EMAIL,
  },
  frontend: { url: parsed.data.FRONTEND_URL },
  bcryptRounds: parseInt(parsed.data.BCRYPT_ROUNDS, 10),
  isDev: parsed.data.NODE_ENV === 'development',
  isProd: parsed.data.NODE_ENV === 'production',
} as const;
