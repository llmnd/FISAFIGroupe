import { prisma } from './lib/db';
import { hashPassword } from './utils/auth';
import * as readline from 'readline';

// Type for Admin User
type AdminUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  role: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Get command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Create readline interface for confirmations
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function askConfirmation(question: string): Promise<boolean> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

async function listAdmins() {
  try {
    console.log('👥 Listing all admin users...\n');
    const admins = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (admins.length === 0) {
      console.log('ℹ️  No admin users found.');
      return;
    }

    console.log(`Found ${admins.length} admin user(s):\n`);
    admins.forEach((admin: AdminUser, index: number) => {
      console.log(`${index + 1}. ${admin.firstName} ${admin.lastName}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   👤 Role: ${admin.role}`);
      console.log(`   ✓ Active: ${admin.active ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${admin.createdAt.toLocaleDateString()}`);
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error listing admins:', error);
  }
}

async function deleteAdmin(email: string) {
  try {
    console.log(`🗑️  Deleting admin user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    if (user.role !== 'admin') {
      console.log(`⚠️  User is not an admin: ${email}`);
      return;
    }

    // Ask for confirmation
    const confirmed = await askConfirmation(
      `⚠️  Are you sure you want to DELETE ${email}? (yes/no): `
    );
    
    if (!confirmed) {
      console.log('❌ Deletion cancelled.');
      rl.close();
      await prisma.$disconnect();
      return;
    }

    await prisma.user.delete({
      where: { email },
    });

    console.log(`✅ Admin user deleted successfully!`);
    console.log(`📧 Email: ${email}`);
    rl.close();
  } catch (error) {
    console.error('❌ Error deleting admin:', error);
    rl.close();
  } finally {
    await prisma.$disconnect();
  }
}

async function resetAdminPassword(email: string, newPassword: string) {
  try {
    console.log(`🔑 Resetting password for: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    if (user.role !== 'admin') {
      console.log(`⚠️  User is not an admin: ${email}`);
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    console.log(`✅ Admin password reset successfully!`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 New Password: ${newPassword}`);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function createAdmin(email: string, firstName: string, lastName: string, password: string) {
  try {
    console.log('🔐 Creating admin user...');

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log(`⏭️  User already exists: ${email}`);
      return;
    }

    const hashedPassword = await hashPassword(password);

    const adminUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        role: 'admin',
        active: true,
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`👤 Name: ${adminUser.firstName} ${adminUser.lastName}`);
    console.log(`🔑 Password: ${password}`);
    console.log(`👤 Role: ${adminUser.role}`);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function deactivateAdmin(email: string) {
  try {
    console.log(`⏸️  Deactivating admin user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    if (user.role !== 'admin') {
      console.log(`⚠️  User is not an admin: ${email}`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { active: false },
    });

    console.log(`✅ Admin user deactivated successfully!`);
    console.log(`📧 Email: ${email}`);
  } catch (error) {
    console.error('❌ Error deactivating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function activateAdmin(email: string) {
  try {
    console.log(`▶️  Activating admin user: ${email}\n`);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return;
    }

    if (user.role !== 'admin') {
      console.log(`⚠️  User is not an admin: ${email}`);
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { active: true },
    });

    console.log(`✅ Admin user activated successfully!`);
    console.log(`📧 Email: ${email}`);
  } catch (error) {
    console.error('❌ Error activating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function printHelp() {
  console.log(`
📋 Admin Management Script

Usage: npm run admin <command> [options]

Commands:
  list                    List all admin users
  create <email> <firstName> <lastName> <password>
                          Create a new admin user
  delete <email>          Delete an admin user
  reset <email> <password>
                          Reset admin password
  deactivate <email>      Deactivate an admin user
  activate <email>        Activate an admin user

Examples:
  npm run admin list
  npm run admin create admin2@fisafi.com John Doe mypassword123
  npm run admin delete admin2@fisafi.com
  npm run admin reset admin@fisafi.com newpassword
  npm run admin deactivate admin@fisafi.com
  npm run admin activate admin@fisafi.com
  `);
}

async function main() {
  if (!command || command === 'help' || command === '--help' || command === '-h') {
    printHelp();
    rl.close();
    return;
  }

  try {
    switch (command) {
      case 'list':
        await listAdmins();
        rl.close();
        break;

      case 'create':
        if (args.length < 5) {
          console.error('❌ Missing arguments for create command');
          console.error('Usage: npm run admin create <email> <firstName> <lastName> <password>');
          rl.close();
          process.exit(1);
        }
        await createAdmin(args[1], args[2], args[3], args[4]);
        rl.close();
        break;

      case 'delete':
        if (args.length < 2) {
          console.error('❌ Missing email argument');
          console.error('Usage: npm run admin delete <email>');
          rl.close();
          process.exit(1);
        }
        await deleteAdmin(args[1]);
        break;

      case 'reset':
        if (args.length < 3) {
          console.error('❌ Missing arguments');
          console.error('Usage: npm run admin reset <email> <newPassword>');
          rl.close();
          process.exit(1);
        }
        await resetAdminPassword(args[1], args[2]);
        rl.close();
        break;

      case 'deactivate':
        if (args.length < 2) {
          console.error('❌ Missing email argument');
          console.error('Usage: npm run admin deactivate <email>');
          rl.close();
          process.exit(1);
        }
        await deactivateAdmin(args[1]);
        rl.close();
        break;

      case 'activate':
        if (args.length < 2) {
          console.error('❌ Missing email argument');
          console.error('Usage: npm run admin activate <email>');
          rl.close();
          process.exit(1);
        }
        await activateAdmin(args[1]);
        rl.close();
        break;

      default:
        console.error(`❌ Unknown command: ${command}`);
        printHelp();
        rl.close();
        process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    rl.close();
    process.exit(1);
  }
}

main();
