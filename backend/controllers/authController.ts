// backend/controllers/authController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword } from '../utils/auth';
import { emailService } from '../services/emailService';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../types';

export async function register(
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply
) {
  try {
    const { email, password, firstName, lastName } = request.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return reply.status(409).send({
        success: false,
        error: 'User already exists',
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
      },
    });

    // Send registration confirmation email (non-blocking)
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;
    emailService.sendRegistrationConfirmation(email, fullName).catch(err => {
      console.error('Failed to send registration email:', err);
    });

    // Generate token
    const token = request.server.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: '7d' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: (user as any).role || 'user',
      },
    };

    return reply.status(201).send({
      success: true,
      data: response,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Registration failed',
    });
  }
}

export async function login(
  request: FastifyRequest<{ Body: LoginRequest }>,
  reply: FastifyReply
) {
  try {
    const { email, password } = request.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const passwordMatch = await verifyPassword(password, user.password);

    if (!passwordMatch) {
      return reply.status(401).send({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate token
    const token = request.server.jwt.sign(
      { id: user.id, email: user.email },
      { expiresIn: '7d' }
    );

    const response: AuthResponse = {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        role: (user as any).role || 'user',
      },
    };

    return reply.send({
      success: true,
      data: response,
      message: 'Login successful',
    });
  } catch (error) {
    console.error('Login error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Login failed',
    });
  }
}

export async function getMe(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const userId = (request.user as any)?.id;
    
    if (!userId) {
      return reply.status(401).send({
        success: false,
        error: 'No user ID in token',
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    return reply.send({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get user',
    });
  }
}
