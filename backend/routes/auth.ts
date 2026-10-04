// backend/routes/auth.ts
import { FastifyInstance } from 'fastify';
import {
  register,
  login,
  getMe,
  verifyEmail,
  resendEmailVerification,
  requestPasswordReset,
  resetPassword,
  changePassword,
} from '../controllers/authController';
import { CreateUserRequest, LoginRequest } from '../types';

export async function authRoutes(app: FastifyInstance) {
  // Public routes
  app.post('/auth/register', async (request, reply) => {
    return register(request as any, reply);
  });

  app.post('/auth/login', async (request, reply) => {
    return login(request as any, reply);
  });

  app.post('/auth/forgot-password', async (request, reply) => {
    return requestPasswordReset(request as any, reply);
  });

  app.post('/auth/reset-password', async (request, reply) => {
    return resetPassword(request as any, reply);
  });

  app.get('/auth/verify-email', async (request, reply) => {
    return verifyEmail(request as any, reply);
  });

  // Protected routes
  app.get('/auth/me', async (request, reply) => {
    await request.jwtVerify();
    return getMe(request, reply);
  });

  app.post('/auth/resend-verification', async (request, reply) => {
    await request.jwtVerify();
    return resendEmailVerification(request as any, reply);
  });

  app.post('/auth/change-password', async (request, reply) => {
    await request.jwtVerify();
    return changePassword(request as any, reply);
  });
}
