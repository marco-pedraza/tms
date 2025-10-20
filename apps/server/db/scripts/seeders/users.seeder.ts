import type { Department } from '@/users/departments/departments.types';
import { roleRepository } from '@/users/roles/roles.repository';
import { roles } from '@/users/roles/roles.schema';
import { userPermissionsRepository } from '@/users/user-permissions/user-permissions.repository';
import type { SafeUser } from '@/users/users/users.types';
import { faker } from '@faker-js/faker';
import { userFactory } from '@/tests/factories/user.factory';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

/**
 * Creates a user using the factory with specific data
 * This approach uses the factory for consistent test data generation with custom values
 */
async function createUserWithFactory(
  userData: {
    departmentId: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
    position?: string;
    employeeId?: string;
    active: boolean;
    isSystemAdmin: boolean;
  },
  factoryDb: FactoryDb,
): Promise<SafeUser> {
  // Create user using factory with specific data
  const user = await userFactory(factoryDb).create({
    departmentId: userData.departmentId,
    username: userData.username,
    email: userData.email,
    firstName: userData.firstName,
    lastName: userData.lastName,
    phone: userData.phone,
    position: userData.position ?? null,
    employeeId: userData.employeeId ?? null,
    active: userData.active,
    isSystemAdmin: userData.isSystemAdmin,
    deletedAt: null,
  });

  return user as unknown as SafeUser;
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
    username: 'superadmin',
    email: 'superadmin@company.com',
    firstName: 'Super',
    lastName: 'Administrator',
    position: 'Super Administrator',
    employeeId: null,
    isSystemAdmin: true,
    departmentCode: 'it',
    roles: [],
  },
  {
    username: 'admin',
    email: 'admin@company.com',
    firstName: 'System',
    lastName: 'Administrator',
    position: 'System Administrator',
    employeeId: null,
    isSystemAdmin: false,
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
    roles: ['Fleet Manager'],
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
    roles: ['Operations Manager'],
  },
];

/**
 * Creates users from client data and assigns roles
 * @param usersData - Array of user data from client JSON
 * @param departments - Array of departments to assign users to
 * @param factoryDb - Factory database instance
 * @returns Array of created users
 */
async function createUsersFromClientData(
  usersData: UserData[],
  departments: Department[],
  factoryDb: FactoryDb,
): Promise<SafeUser[]> {
  const users: SafeUser[] = [];

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

      // Get role IDs if roles are specified
      let roleIds: number[] | undefined = undefined;
      if (userData.roles && userData.roles.length > 0) {
        roleIds = [];
        for (const roleCode of userData.roles) {
          const role = await roleRepository.findBy(roles.name, roleCode);
          if (!role) {
            throw new Error(
              `Role '${roleCode}' not found for user ${userData.username}`,
            );
          }
          roleIds.push(role.id);
        }
      }

      // Create user using factory
      const user = await createUserWithFactory(
        {
          departmentId: department.id,
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: generateE164Phone('52', 10), // Mexico phone numbers
          position: userData.position ?? undefined,
          employeeId: userData.employeeId ?? undefined,
          active: true,
          isSystemAdmin: userData.isSystemAdmin,
        },
        factoryDb,
      );

      // Assign roles if specified
      if (roleIds && roleIds.length > 0) {
        await userPermissionsRepository.assignRoles(user.id, { roleIds });
      }

      users.push(user);
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
 * @param departments - Array of departments to assign users to
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created users
 */
export async function seedUsers(
  departments: Department[],
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<SafeUser[]> {
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
          departments,
          factoryDb,
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
    departments,
    factoryDb,
  );
  return users;
}

/**
 * Seeds additional random users for testing
 * @param departments - Array of departments to assign users to
 * @param factoryDb - Factory database instance
 * @param count - Number of random users to create
 * @returns Array of created users
 */
export async function seedRandomUsers(
  departments: Department[],
  factoryDb: FactoryDb,
  count = 10,
): Promise<SafeUser[]> {
  const users: SafeUser[] = [];

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

      // Create random user using factory
      const user = await createUserWithFactory(
        {
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
            : undefined,
          // Make employeeId optional (60% chance of having an employee ID)
          employeeId: faker.datatype.boolean({ probability: 0.6 })
            ? `EMP${String(i + 100).padStart(3, '0')}`
            : undefined,
          active: true,
          isSystemAdmin: false,
        },
        factoryDb,
      );

      users.push(user);
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
