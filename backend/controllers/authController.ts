// backend/controllers/authController.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../lib/db';
import { hashPassword, verifyPassword } from '../utils/auth';
import { emailService } from '../services/emailService';
import { CreateUserRequest, LoginRequest, AuthResponse } from '../types';

export async function register(
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply
) {
  try {
    const { email, password, firstName, lastName, profiles } = request.body;
    const allowedProfiles = new Set(["MARKET_CUSTOMER", "TRAINING_PARTICIPANT"]);
    if (
      !Array.isArray(profiles) ||
      profiles.length === 0 ||
      profiles.some((profile) => typeof profile !== "string" || !allowedProfiles.has(profile)) ||
      new Set(profiles).size !== profiles.length
    ) {
      return reply.status(400).send({
        success: false,
        error: "Choisissez au moins un profil valide.",
      });
    }

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
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        profiles,
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.fisafigroupe.com').replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;

    // Send email verification link without blocking account creation.
    const fullName = `${firstName || ''} ${lastName || ''}`.trim() || email;
    void emailService
      .sendRegistrationConfirmation(email, fullName, verificationUrl)
      .then((emailSent) => {
        if (!emailSent) {
          console.error(`Registration verification email could not be sent to ${email}`);
        }
      })
      .catch((error) => {
        console.error('Failed to send registration verification email:', error);
      });

    // Generate token
    const token = request.server.jwt.sign(
      { id: user.id, email: user.email, sessionVersion: user.sessionVersion },
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
        employeeRole: user.employeeRole,
        profiles: user.profiles,
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

export async function verifyEmail(
  request: FastifyRequest<{ Querystring: { token?: string } }>,
  reply: FastifyReply
) {
  const token = request.query.token;
  if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
    return reply.status(400).send({ success: false, error: 'Lien de vérification invalide.' });
  }
  const tokenHash = createHash('sha256').update(token).digest('hex');
  try {
    const user = await prisma.user.findUnique({
      where: { emailVerificationTokenHash: tokenHash },
      select: { id: true, emailVerificationExpiresAt: true, emailVerifiedAt: true },
    });
    if (!user || user.emailVerifiedAt) {
      return reply.status(400).send({ success: false, error: 'Ce lien de vérification est invalide ou déjà utilisé.' });
    }
    if (!user.emailVerificationExpiresAt || user.emailVerificationExpiresAt <= new Date()) {
      return reply.status(410).send({ success: false, error: 'Ce lien a expiré. Connectez-vous pour demander un nouveau lien.' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });
    return reply.send({ success: true, message: 'Votre adresse email est vérifiée.' });
  } catch (error) {
    console.error('Email verification error:', error);
    return reply.status(500).send({ success: false, error: 'Impossible de vérifier cette adresse email.' });
  }
}

export async function resendEmailVerification(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const userId = (request.user as { id?: string } | undefined)?.id;
  if (!userId) {
    return reply.status(401).send({ success: false, error: 'Connexion requise.' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return reply.status(404).send({ success: false, error: 'Compte introuvable.' });
    }
    if (user.emailVerifiedAt) {
      return reply.send({ success: true, message: 'Votre adresse email est déjà vérifiée.' });
    }

    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenHash = createHash('sha256').update(verificationToken).digest('hex');
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: verificationTokenHash,
        emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    const frontendUrl = (process.env.FRONTEND_URL || 'https://www.fisafigroupe.com').replace(/\/$/, '');
    const verificationUrl = `${frontendUrl}/verify-email?token=${verificationToken}`;
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const sent = await emailService.sendRegistrationConfirmation(user.email, fullName, verificationUrl);
    if (!sent) {
      return reply.status(502).send({
        success: false,
        error: 'Le message n’a pas pu être envoyé. Réessayez plus tard ou contactez FiSAFi.',
      });
    }
    return reply.send({ success: true, message: 'Un nouveau lien de vérification vient d’être envoyé.' });
  } catch (error) {
    console.error('Resend email verification error:', error);
    return reply.status(500).send({ success: false, error: 'Impossible de renvoyer le lien de vérification.' });
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

    if (!user.active) {
      return reply.status(401).send({
        success: false,
        error: 'Ce compte est désactivé. Contactez FiSAFi.',
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
      { id: user.id, email: user.email, sessionVersion: user.sessionVersion },
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
        employeeRole: user.employeeRole,
        profiles: user.profiles,
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

export async function requestPasswordReset(
    request: FastifyRequest<{ Body: { email?: string } }>,
    reply: FastifyReply
  ) {
    const email = typeof request.body?.email === 'string'
      ? request.body.email.trim().toLowerCase()
      : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return reply.status(400).send({ success: false, error: 'Saisissez une adresse email valide.' });
    }

    const genericMessage = 'Si un compte correspond à cette adresse, un lien de réinitialisation va être envoyé.';
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, email: true, firstName: true, lastName: true, active: true },
      });
      if (!user || !user.active) {
        return reply.send({ success: true, message: genericMessage });
      }

      const resetToken = randomBytes(32).toString('hex');
      const resetTokenHash = createHash('sha256').update(resetToken).digest('hex');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: resetTokenHash,
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
        },
      });

      const frontendUrl = (process.env.FRONTEND_URL || 'https://www.fisafigroupe.com').replace(/\/$/, '');
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
      const sent = await emailService.sendPasswordReset(user.email, fullName, resetUrl);
      if (!sent) {
        console.error(`[Auth] Password reset email could not be sent to ${user.email}.`);
      }
      return reply.send({ success: true, message: genericMessage });
    } catch (error) {
      console.error('Password reset request error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Impossible de traiter votre demande pour le moment.',
      });
    }
  }

export async function resetPassword(
    request: FastifyRequest<{ Body: { token?: string; password?: string } }>,
    reply: FastifyReply
  ) {
    const { token, password } = request.body ?? {};
    if (
      typeof token !== 'string' ||
      !/^[a-f0-9]{64}$/.test(token) ||
      typeof password !== 'string' ||
      password.length < 8 ||
      password.length > 128
    ) {
      return reply.status(400).send({
        success: false,
        error: 'Le lien ou le mot de passe est invalide. Le mot de passe doit contenir au moins 8 caractères.',
      });
    }

    try {
      const tokenHash = createHash('sha256').update(token).digest('hex');
      const user = await prisma.user.findUnique({
        where: { passwordResetTokenHash: tokenHash },
        select: { id: true, passwordResetExpiresAt: true, active: true },
      });
      if (
        !user ||
        !user.active ||
        !user.passwordResetExpiresAt ||
        user.passwordResetExpiresAt <= new Date()
      ) {
        return reply.status(400).send({
          success: false,
          error: 'Ce lien est invalide ou expiré. Demandez un nouveau lien.',
        });
      }

      const updated = await prisma.user.updateMany({
        where: {
          id: user.id,
          active: true,
          passwordResetTokenHash: tokenHash,
          passwordResetExpiresAt: { gt: new Date() },
        },
        data: {
          password: await hashPassword(password),
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          sessionVersion: { increment: 1 },
        },
      });
      if (updated.count !== 1) {
        return reply.status(400).send({
          success: false,
          error: 'Ce lien est invalide ou expiré. Demandez un nouveau lien.',
        });
      }
      return reply.send({ success: true, message: 'Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.' });
    } catch (error) {
      console.error('Password reset error:', error);
      return reply.status(500).send({
        success: false,
        error: 'Impossible de réinitialiser votre mot de passe pour le moment.',
      });
    }
  }

export async function changePassword(
    request: FastifyRequest<{ Body: { currentPassword?: string; newPassword?: string } }>,
    reply: FastifyReply
  ) {
    const { currentPassword, newPassword } = request.body ?? {};
    if (
      typeof currentPassword !== 'string' ||
      typeof newPassword !== 'string' ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return reply.status(400).send({
        success: false,
        error: 'Le nouveau mot de passe doit contenir entre 8 et 128 caractères.',
      });
    }

    const userId = (request.user as { id?: string } | undefined)?.id;
    if (!userId) {
      return reply.status(401).send({ success: false, error: 'Votre session a expiré. Reconnectez-vous.' });
    }

    try {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.active) {
        return reply.status(401).send({ success: false, error: 'Votre session a expiré. Reconnectez-vous.' });
      }
      if (!(await verifyPassword(currentPassword, user.password))) {
        return reply.status(400).send({ success: false, error: 'Votre mot de passe actuel est incorrect.' });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: await hashPassword(newPassword),
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
          sessionVersion: { increment: 1 },
        },
      });
      return reply.send({ success: true, message: 'Mot de passe modifié. Reconnectez-vous avec votre nouveau mot de passe.' });
    } catch (error) {
      console.error('Password change error:', error);
      return reply.status(500).send({ success: false, error: 'Impossible de modifier votre mot de passe.' });
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
        employeeRole: true,
        profiles: true,
        active: true,
        createdAt: true,
        emailVerifiedAt: true,
      },
    });

    if (!user || !user.active) {
      return reply.status(404).send({
        success: false,
        error: 'User not found',
      });
    }

    const { active: _active, ...publicUser } = user;
    return reply.send({
      success: true,
      data: publicUser,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return reply.status(500).send({
      success: false,
      error: 'Failed to get user',
    });
  }
}
