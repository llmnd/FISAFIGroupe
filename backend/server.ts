// backend/server.ts
import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import { config } from './config';
import { authRoutes } from './routes/auth';
import { articleRoutes } from './routes/articles';
import { formationRoutes } from './routes/formations';
import { sessionRoutes } from './routes/sessions';
import { usersRoutes } from './routes/users';
import { brochureRoutes } from './routes/brochures';
import { inscriptionsRoutes } from './routes/inscriptions';
import { seedRoutes } from './routes/seed';

const app = Fastify({
  logger: {
    level: config.server.env === 'production' ? 'warn' : 'info',
  },
});

// Register CORS first, before other plugins
app.register(fastifyCors, {
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://fisafi.vercel.app",
    "https://www.fisafigroupe.com",
    "https://fisafigroupe.com",
    "https://fisafigroupe.onrender.com"
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Register other plugins
app.register(fastifyHelmet);

app.register(fastifyJwt, {
  secret: config.jwt.secret,
});

// Health check
app.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// API version
app.get('/api/v1', async (request, reply) => {
  return {
    version: '1.0.0',
    name: 'FiSAFi API',
    timestamp: new Date().toISOString(),
  };
});

// Routes
app.register(async (fastify) => {
  await authRoutes(fastify);
  await articleRoutes(fastify);
  await formationRoutes(fastify);
}, { prefix: '/api/v1' });

// Auth & Users & Articles routes (no v1 prefix for frontend compatibility)
app.register(async (fastify) => {
  await authRoutes(fastify);
  await usersRoutes(fastify);
  await articleRoutes(fastify);
  await formationRoutes(fastify);
  await brochureRoutes(fastify);
  await sessionRoutes(fastify);
  await inscriptionsRoutes(fastify);
  await seedRoutes(fastify);
}, { prefix: '/api' });

// Error handler
app.setErrorHandler((error: unknown, request, reply) => {
  console.error('API Error:', error);

  const err = error as { statusCode?: number; message?: string };

  if (err.statusCode === 401) {
    return reply.status(401).send({
      success: false,
      error: 'Unauthorized',
    });
  }

  if (err.statusCode === 403) {
    return reply.status(403).send({
      success: false,
      error: 'Forbidden',
    });
  }

  return reply.status(err.statusCode || 500).send({
    success: false,
    error: err.message || 'Internal server error',
  });
});

// Start server
const start = async () => {
  try {
    await app.listen({
      port: config.server.port,
      host: config.server.host,
    });
    console.log(`🚀 Server running at http://${config.server.host}:${config.server.port}`);
    console.log(`📚 API Docs at http://${config.server.host}:${config.server.port}/api/v1`);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

start();

export default app;
