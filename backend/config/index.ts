// backend/config/index.ts
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables in order of priority:
// 1. .env.local - sensitive secrets (not committed)
// 2. .env - shared variables (safe to commit)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  database: {
    url: process.env.DATABASE_URL || '',
  },
  server: {
    port: parseInt(process.env.BACKEND_PORT || '3001', 10),
    host: process.env.BACKEND_HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-secret-key',
    expiration: process.env.JWT_EXPIRATION || '7d',
  },
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
};

export const isDev = config.server.env === 'development';
export const isProd = config.server.env === 'production';
