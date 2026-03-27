'use client';

import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ResponseData = {
  success?: boolean;
  message?: string;
  id?: number;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { name, email, phone, subject, message } = req.body;

  // Validation
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'Champs obligatoires manquants' });
  }

  try {
    // Vérifie si email existe déjà
    const existing = await prisma.inscription.findUnique({
      where: { email },
    });

    if (existing) {
      return res.status(400).json({ error: 'Cet email est déjà inscrit' });
    }

    // Crée l'inscription
    const inscription = await prisma.inscription.create({
      data: {
        name,
        email,
        phone: phone || null,
        subject,
        message,
        status: 'pending',
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Inscription reçue avec succès!',
      id: inscription.id,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({
      error: 'Erreur lors de l\'inscription. Veuillez réessayer.',
    });
  } finally {
    await prisma.$disconnect();
  }
}
