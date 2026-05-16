import dotenv from 'dotenv';

dotenv.config();

/**
 * Centralised, typed access to environment variables.
 * Fails fast if a required variable is missing.
 */
function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  mongoUri: required('MONGODB_URI', 'mongodb://127.0.0.1:27017/yva-app'),
  clientOrigin: process.env.CLIENT_ORIGIN ?? 'http://localhost:4200',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
} as const;
