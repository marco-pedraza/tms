import type { Department } from '@/users/departments/departments.types';
import { departmentFactory } from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

interface DepartmentData {
  name: string;
  code: string;
  description: string;
}

interface ClientDepartmentsData {
  metadata: {
    generated_at: string;
    total_departments: number;
    description: string;
  };
  departments: DepartmentData[];
}

/**
 * Predefined departments for seeding
 */
const PREDEFINED_DEPARTMENTS = [
  {
    name: 'Human Resources',
    code: 'hr',
    description: 'Manages employee relations, recruitment, and benefits',
  },
  {
    name: 'Information Technology',
    code: 'it',
    description: 'Handles technology infrastructure and support',
  },
  {
    name: 'Operations',
    code: 'ops',
    description: 'Manages daily business operations and logistics',
  },
  {
    name: 'Finance',
    code: 'fin',
    description: 'Handles financial planning, accounting, and budgeting',
  },
  {
    name: 'Marketing',
    code: 'mkt',
    description: 'Manages brand promotion and customer acquisition',
  },
  {
    name: 'Customer Service',
    code: 'cs',
    description: 'Provides customer support and satisfaction',
  },
  {
    name: 'Fleet Management',
    code: 'fleet',
    description: 'Manages vehicle fleet operations and maintenance',
  },
  {
    name: 'Safety & Compliance',
    code: 'safety',
    description: 'Ensures safety standards and regulatory compliance',
  },
];

/**
 * Creates departments from client data
 * @param departmentsData - Array of department data from client JSON
 * @param factoryDb - Factory database instance
 * @returns Array of created departments
 */
async function createDepartmentsFromClientData(
  departmentsData: DepartmentData[],
  factoryDb: FactoryDb,
): Promise<Department[]> {
  const departments: Department[] = [];

  for (const deptData of departmentsData) {
    try {
      const department = await departmentFactory(factoryDb).create({
        name: deptData.name,
        code: deptData.code,
        description: deptData.description,
        deletedAt: null,
      });

      departments.push(department as unknown as Department);
    } catch (error) {
      console.error(
        `    ❌ Failed to create department ${deptData.code}:`,
        error,
      );
      throw error;
    }
  }

  return departments;
}

/**
 * Seeds predefined departments
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created departments
 */
export async function seedDepartments(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Department[]> {
  // Try to use client data if available
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.DEPARTMENTS)) {
    try {
      const departmentsData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.DEPARTMENTS,
      )) as ClientDepartmentsData;

      if (departmentsData.departments?.length > 0) {
        const departments = await createDepartmentsFromClientData(
          departmentsData.departments,
          factoryDb,
        );
        return departments;
      }
    } catch (error) {
      console.error(
        `   ❌ Error loading client departments data: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  // Default behavior - use predefined departments
  const departments = await createDepartmentsFromClientData(
    PREDEFINED_DEPARTMENTS,
    factoryDb,
  );
  return departments;
}
