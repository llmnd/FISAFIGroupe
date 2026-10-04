import 'dotenv/config';
import { prisma } from './lib/db';
import { hashPassword } from './utils/auth';

function requireLocalDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is not configured.');
  }

  let url: URL;
  try {
    url = new URL(databaseUrl);
  } catch {
    throw new Error('DATABASE_URL is not a valid PostgreSQL URL.');
  }

  const databaseName = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    databaseName !== 'fisafi_local'
  ) {
    throw new Error(
      'Admin creation is restricted to the local fisafi_local database. Check DATABASE_URL.',
    );
  }
}

async function createLocalAdmin(): Promise<void> {
  requireLocalDatabase();

  const email = process.env.LOCAL_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.LOCAL_ADMIN_PASSWORD;
  const firstName = process.env.LOCAL_ADMIN_FIRST_NAME?.trim() || 'Admin';
  const lastName = process.env.LOCAL_ADMIN_LAST_NAME?.trim() || 'FiSAFi';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Set LOCAL_ADMIN_EMAIL to a valid email address.');
  }
  if (!password || password.length < 14) {
    throw new Error('Set LOCAL_ADMIN_PASSWORD to a password with at least 14 characters.');
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { email: true, role: true, active: true },
  });
  if (existingUser) {
    if (existingUser.role !== 'admin') {
      throw new Error(
        `The email ${email} already belongs to a non-admin account; no role was changed.`,
      );
    }
    console.log(
      `An admin account already exists for ${email} (active: ${existingUser.active}). No changes made.`,
    );
    return;
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      password: passwordHash,
      firstName,
      lastName,
      role: 'admin',
      active: true,
      emailVerifiedAt: new Date(),
    },
    select: { email: true },
  });
  console.log(`Local admin created for ${email}. Password was not printed or stored in source code.`);
}

createLocalAdmin()
  .catch((error: unknown) => {
    console.error(
      'Could not create local admin:',
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
