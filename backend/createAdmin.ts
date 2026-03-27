import { prisma } from './lib/db';
import { hashPassword } from './utils/auth';

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@fisafi.com' },
    });

    if (existingAdmin) {
      console.log('⏭️  Admin user already exists:', existingAdmin.email);
      return;
    }

    // Hash password
    const hashedPassword = await hashPassword('passer');

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@fisafi.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'FiSAFi',
        role: 'admin',
        active: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminUser.email);
    console.log('🔑 Password: passer');
    console.log('👤 Role:', adminUser.role);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();
