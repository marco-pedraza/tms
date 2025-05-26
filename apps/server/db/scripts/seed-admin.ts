import { departmentRepository } from '../../users/departments/departments.repository';
import { tenantRepository } from '../../users/tenants/tenants.repository';
import { userRepository } from '../../users/users/users.repository';

// Define the secret at global scope as required by Encore
const DEFAULT_PASSWORD = 'admin123';

/**
 * Main function to seed admin user with required tenant and department
 */
export async function seedAdmin(): Promise<void> {
  try {
    console.log('Starting admin user seeding...');

    // Create default tenant
    console.log('Creating default tenant...');
    const tenant = await tenantRepository.create({
      name: 'Default Tenant',
      code: 'default',
      description: 'Default tenant for system administration',
    });
    console.log('Created default tenant:', tenant);

    // Create default department
    console.log('Creating default department...');
    const department = await departmentRepository.create({
      name: 'Administration',
      code: 'admin',
      description: 'System administration department',
      tenantId: tenant.id,
    });
    console.log('Created default department:', department);

    // Create admin user
    console.log('Creating admin user...');
    const adminUsername = 'admin';
    const adminEmail = 'admin@example.com';
    const adminPassword = DEFAULT_PASSWORD;

    await userRepository.create({
      username: adminUsername,
      email: adminEmail,
      password: adminPassword,
      firstName: 'System',
      lastName: 'Administrator',
      tenantId: tenant.id,
      departmentId: department.id,
      isSystemAdmin: true,
      position: 'System Administrator',
    });
    console.log('Created admin user with username:', adminUsername);

    console.log('Admin user seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding admin user:', error);
    throw error; // Let the caller handle the error instead of exiting
  }
}

// Check if script should run directly based on flag
const shouldRunSeeder = process.argv.includes('--seed');
if (shouldRunSeeder) {
  seedAdmin()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Unhandled error in seedAdmin script:', error);
      process.exit(1);
    });
}
