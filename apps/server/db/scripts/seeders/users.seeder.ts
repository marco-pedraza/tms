import { db } from '@/users/db-service';
import type { Department } from '@/users/departments/departments.types';
import { roleRepository } from '@/users/roles/roles.repository';
import { roles } from '@/users/roles/roles.schema';
import { userPermissionsRepository } from '@/users/user-permissions/user-permissions.repository';
import type { User } from '@/users/users/users.types';
import { faker } from '@faker-js/faker';
import { userFactory } from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Creates a user using the factory and returns it with the correct database-generated ID
 * This wrapper solves the issue where factories generate random IDs that don't match the database
 */
async function createUserWithFactory(
  factoryDb: FactoryDb,
  userData: Partial<User>,
): Promise<User> {
  // Use factory to generate data, but we'll get the real ID from the query
  await userFactory(factoryDb).create(userData);

  // Query the inserted user by username (which is unique)
  const insertedUser = await db.query.users.findFirst({
    where: (users, { eq }) => eq(users.username, userData.username as string),
  });

  if (!insertedUser) {
    throw new Error(`Failed to retrieve created user: ${userData.username}`);
  }

  return insertedUser as User;
}

interface UserData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  position: string | null;
  employeeId: string | null;
  isSystemAdmin: boolean;
  departmentCode: string;
  roles?: string[];
}

interface ClientUsersData {
  metadata: {
    generated_at: string;
    total_users: number;
    description: string;
  };
  users: UserData[];
}

/**
 * Predefined users for seeding
 */
const PREDEFINED_USERS: UserData[] = [
  {
    username: 'admin',
    email: 'admin@company.com',
    firstName: 'System',
    lastName: 'Administrator',
    position: 'System Administrator',
    employeeId: null,
    isSystemAdmin: true,
    departmentCode: 'it',
    roles: ['Administrator'],
  },
  {
    username: 'fleet.manager',
    email: 'fleet.manager@company.com',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    position: 'Fleet Manager',
    employeeId: 'EMP003',
    isSystemAdmin: false,
    departmentCode: 'fleet',
    roles: ['Read Only', 'Editor'],
  },
  {
    username: 'operations.manager',
    email: 'operations.manager@company.com',
    firstName: 'Ana',
    lastName: 'Lopez',
    position: 'Operations Manager',
    employeeId: 'EMP004',
    isSystemAdmin: false,
    departmentCode: 'ops',
    roles: ['Read Only', 'Editor'],
  },
  {
    username: 'read_only',
    email: 'readonly.user@company.com',
    firstName: 'María',
    lastName: 'García',
    position: 'Data Analyst',
    employeeId: 'EMP005',
    isSystemAdmin: false,
    departmentCode: 'it',
    roles: ['Read Only'],
  },
];

/**
 * Creates users from client data and assigns roles
 * @param usersData - Array of user data from client JSON
 * @param factoryDb - Factory database instance
 * @param departments - Array of departments to assign users to
 * @returns Array of created users
 */
async function createUsersFromClientData(
  usersData: UserData[],
  factoryDb: FactoryDb,
  departments: Department[],
): Promise<User[]> {
  const users: User[] = [];

  for (const userData of usersData) {
    try {
      // Find the department for this user
      const department = departments.find(
        (dept) => dept.code === userData.departmentCode,
      );
      if (!department) {
        throw new Error(
          `Department ${userData.departmentCode} not found for user ${userData.username}`,
        );
      }

      // Create user using factory and retrieve with correct database ID
      const user = await createUserWithFactory(factoryDb, {
        departmentId: department.id,
        username: userData.username,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: generateE164Phone('52', 10), // Mexico phone numbers
        position: userData.position,
        employeeId: userData.employeeId,
        active: true,
        isSystemAdmin: userData.isSystemAdmin,
      });

      // Assign roles if specified
      if (userData.roles && userData.roles.length > 0) {
        try {
          // Get role IDs by their codes
          const roleIds: number[] = [];

          for (const roleCode of userData.roles) {
            try {
              const role = await roleRepository.findBy(roles.name, roleCode);
              if (!role) {
                throw new Error(`Role '${roleCode}' not found`);
              }
              roleIds.push(role.id);
            } catch (error) {
              console.error(
                `    ❌ Role '${roleCode}' not found for user ${userData.username}: ${error instanceof Error ? error.message : error}`,
              );
              throw new Error('Role not found');
            }
          }

          // Assign roles to the user if any were found
          if (roleIds.length > 0) {
            await userPermissionsRepository.assignRoles(user.id, { roleIds });
          }
        } catch (error) {
          console.error(
            `    ❌ Failed to assign roles to user ${userData.username}:`,
            error,
          );
          throw error;
        }
      }

      users.push(user as unknown as User);
    } catch (error) {
      console.error(
        `    ❌ Failed to create user ${userData.username}:`,
        error,
      );
      throw error;
    }
  }

  return users;
}

/**
 * Seeds predefined users
 * @param factoryDb - Factory database instance
 * @param departments - Array of departments to assign users to
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created users
 */
export async function seedUsers(
  factoryDb: FactoryDb,
  departments: Department[],
  clientCode?: string,
): Promise<User[]> {
  // Try to use client data if available
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.USERS)) {
    try {
      const usersData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.USERS,
      )) as ClientUsersData;

      if (usersData.users?.length > 0) {
        const users = await createUsersFromClientData(
          usersData.users,
          factoryDb,
          departments,
        );
        return users;
      }
    } catch (error) {
      console.error(
        `   ❌ Error loading client users data: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  // Default behavior - use predefined users
  const users = await createUsersFromClientData(
    PREDEFINED_USERS,
    factoryDb,
    departments,
  );
  return users;
}

/**
 * Seeds additional random users for testing
 * @param factoryDb - Factory database instance
 * @param departments - Array of departments to assign users to
 * @param count - Number of random users to create
 * @returns Array of created users
 */
export async function seedRandomUsers(
  factoryDb: FactoryDb,
  departments: Department[],
  count = 10,
): Promise<User[]> {
  const users: User[] = [];

  for (let i = 0; i < count; i++) {
    try {
      // Randomly select a department
      const randomDepartment = faker.helpers.arrayElement(departments);

      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();

      const username = faker.internet
        .username({
          firstName,
          lastName,
        })
        .toLowerCase();

      // Create random user using factory and retrieve with correct database ID
      const user = await createUserWithFactory(factoryDb, {
        departmentId: randomDepartment.id,
        username,
        email: faker.internet
          .email({
            firstName,
            lastName,
          })
          .toLowerCase(),
        firstName,
        lastName,
        phone: generateE164Phone('52', 10),
        // Make position optional (70% chance of having a position)
        position: faker.datatype.boolean({ probability: 0.7 })
          ? faker.person.jobTitle()
          : null,
        // Make employeeId optional (60% chance of having an employee ID)
        employeeId: faker.datatype.boolean({ probability: 0.6 })
          ? `EMP${String(i + 100).padStart(3, '0')}`
          : null,
      });

      users.push(user as unknown as User);
    } catch (error) {
      console.error(`    ❌ Failed to create random user ${i + 1}:`, error);
      throw error;
    }
  }

  return users;
}

/**
 * Helper function to generate E.164 phone numbers
 */
function generateE164Phone(
  countryCode: string,
  nationalNumberLength = 10,
): string {
  const first = faker.number.int({ min: 1, max: 9 }).toString();
  const rest = Array.from(
    { length: Math.max(nationalNumberLength - 1, 0) },
    () => faker.number.int({ min: 0, max: 9 }).toString(),
  ).join('');
  const digits = `${first}${rest}`;
  return `+${countryCode}${digits}`;
}
