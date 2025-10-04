import { db } from '@/users/db-service';
import { getFactoryDb } from '@/tests/factories/factory-utils';
import { seedDepartments } from './seeders/departments.seeder';
import { seedPermissions } from './seeders/permissions.seeder';
import { seedRoles } from './seeders/roles.seeder';
import { seedRandomUsers, seedUsers } from './seeders/users.seeder';

const factoryDb = getFactoryDb(db);

/**
 * Main users seeding function - orchestrates all user-related seeders
 * @param clientCode - Optional client code for client-specific data (e.g., 'gfa')
 */
export async function seedUsersData(clientCode?: string): Promise<void> {
  try {
    // === PERMISSIONS SEEDING ===
    console.log('🔑 Seeding permissions...');
    const permissions = await seedPermissions();
    console.log('✅ Permissions seeding completed\n');

    // === ROLES SEEDING ===
    console.log('🔑 Seeding roles...');
    const roles = await seedRoles(factoryDb, clientCode);
    console.log('✅ Roles seeding completed\n');

    // === DEPARTMENTS SEEDING ===
    console.log('📋 Seeding departments...');
    const departments = await seedDepartments(factoryDb, clientCode);
    console.log('✅ Departments seeding completed\n');

    // === USERS SEEDING ===
    console.log('👥 Seeding users...');
    const predefinedUsers = await seedUsers(factoryDb, departments, clientCode);
    console.log('✅ Predefined users seeding completed\n');

    // === RANDOM USERS SEEDING (ONLY IF NO CLIENT CODE) ===
    if (!clientCode) {
      console.log('🎲 Seeding random users...');
      await seedRandomUsers(factoryDb, departments, 10);
      console.log('✅ Random users seeding completed\n');
    }

    console.log(`📊 Summary:`);
    console.log(`   - Permissions: ${permissions.length}`);
    console.log(`   - Roles: ${roles.length}`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Predefined users: ${predefinedUsers.length}`);
    if (!clientCode) {
      console.log(`   - Random users: 10`);
    }
  } catch (error) {
    // Provide cleaner error output
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('❌ Error during users seeding:', errorMessage);

    // Only show full stack trace in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', error);
    }

    throw error;
  }
}

// Allow running this script directly
const shouldRunSeeder = process.argv.includes('--seed');
if (shouldRunSeeder) {
  // Extract client code from command line arguments
  const clientCodeIndex = process.argv.findIndex((arg) => arg === '--client');
  const clientCode =
    clientCodeIndex !== -1 && process.argv[clientCodeIndex + 1]
      ? process.argv[clientCodeIndex + 1]
      : undefined;

  if (clientCode) {
    console.log(
      `🎯 Running seeder with client code: ${clientCode.toUpperCase()} \n`,
    );
  } else {
    console.log('🌱 Running seeder with default data \n');
  }

  seedUsersData(clientCode)
    .then(() => {
      console.log('✨ Users seeding script completed');
      process.exit(0);
    })
    .catch((error: unknown) => {
      console.error('💥 Unhandled error in seedUsers script:', error);
      process.exit(1);
    });
}
