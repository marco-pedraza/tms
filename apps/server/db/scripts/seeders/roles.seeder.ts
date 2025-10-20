import { permissionRepository } from '@/users/permissions/permissions.repository';
import { roleRepository } from '@/users/roles/roles.repository';
import type { Role } from '@/users/roles/roles.types';
import { roleFactory } from '@/factories';
import {
  CLIENT_DATA_FILES,
  hasClientData,
  loadClientData,
} from './client-data.utils';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FactoryDb = any;

interface RoleData {
  name: string;
  description: string;
  permissions?: string[];
}

interface ClientRolesData {
  metadata: {
    generated_at: string;
    total_roles: number;
    description: string;
  };
  roles: RoleData[];
}

/**
 * Predefined roles for seeding
 */
const PREDEFINED_ROLES = [
  {
    name: 'Administrator',
    description: 'Acceso completo al sistema con todos los permisos',
    permissions: [
      // Inventory - Localities
      'inventory_countries',
      'inventory_states',
      'inventory_cities',
      'inventory_populations',
      'inventory_nodes',
      'inventory_installation_types',
      'inventory_events',
      'inventory_labels',
      // Inventory - Operators
      'inventory_transporters',
      'inventory_service_types',
      'inventory_bus_lines',
      // Inventory - Fleet
      'inventory_buses',
      'inventory_bus_models',
      'inventory_seat_diagrams',
      'inventory_drivers',
      'inventory_technologies',
      'inventory_chromatics',
      // Inventory - Routing
      'inventory_pathways',
      'inventory_routes',
      // Inventory - General Config
      'inventory_amenities',
      // Users - Organization
      'users_departments',
      'users_permissions',
      'users_roles',
      'users_users',
    ],
  },
  {
    name: 'Operations Manager',
    description:
      'Gestor de operaciones con acceso a localidades, operadores y configuración',
    permissions: [
      // Inventory - Localities
      'inventory_countries',
      'inventory_states',
      'inventory_cities',
      'inventory_populations',
      'inventory_nodes',
      'inventory_installation_types',
      'inventory_events',
      'inventory_labels',
      // Inventory - Operators
      'inventory_transporters',
      'inventory_service_types',
      'inventory_bus_lines',
      // Inventory - Routing
      'inventory_pathways',
      'inventory_routes',
      // Inventory - General Config
      'inventory_amenities',
    ],
  },
  {
    name: 'Fleet Manager',
    description:
      'Gestor de flota con acceso a vehículos, conductores y tecnologías',
    permissions: [
      // Inventory - Fleet
      'inventory_buses',
      'inventory_bus_models',
      'inventory_seat_diagrams',
      'inventory_drivers',
      'inventory_technologies',
      'inventory_chromatics',
      // Inventory - General Config (for amenities that might affect fleet)
      'inventory_amenities',
    ],
  },
];

/**
 * Creates roles from client data and assigns permissions
 * @param rolesData - Array of role data from client JSON
 * @param factoryDb - Factory database instance
 * @returns Array of created roles
 */
async function createRolesFromClientData(
  rolesData: RoleData[],
  factoryDb: FactoryDb,
): Promise<Role[]> {
  const roles: Role[] = [];

  for (const roleData of rolesData) {
    try {
      // Create the role using the factory
      const role = await roleFactory(factoryDb).create({
        name: roleData.name,
        description: roleData.description,
        deletedAt: null,
      });

      // If permissions are specified, assign them to the role
      if (roleData.permissions && roleData.permissions.length > 0) {
        try {
          // Get permission IDs by their codes
          const permissionIds: number[] = [];

          for (const permissionCode of roleData.permissions) {
            try {
              const permission =
                await permissionRepository.findByCode(permissionCode);
              permissionIds.push(permission.id);
            } catch (error) {
              console.error(
                `    ❌ Permission '${permissionCode}' ${error instanceof Error ? error.message : error}`,
              );
              throw new Error('Permission not found');
            }
          }

          // Assign permissions to the role if any were found
          if (permissionIds.length > 0) {
            await roleRepository.assignPermissions(role.id, { permissionIds });
          }
        } catch (error) {
          console.error(
            `    ❌ Failed to assign permissions to role ${roleData.name}:`,
            error,
          );
          throw new Error('Failed to assign permissions to role');
        }
      }

      roles.push(role as unknown as Role);
    } catch (error) {
      console.error(`    ❌ Failed to create role ${roleData.name}:`, error);
      throw new Error('Failed to create role');
    }
  }

  return roles;
}

/**
 * Seeds predefined roles
 * @param factoryDb - Factory database instance
 * @param clientCode - Optional client code for client-specific data
 * @returns Array of created roles
 */
export async function seedRoles(
  factoryDb: FactoryDb,
  clientCode?: string,
): Promise<Role[]> {
  // Try to use client data if available
  if (clientCode && hasClientData(clientCode, CLIENT_DATA_FILES.ROLES)) {
    try {
      const rolesData = (await loadClientData(
        clientCode,
        CLIENT_DATA_FILES.ROLES,
      )) as ClientRolesData;

      if (rolesData.roles?.length > 0) {
        const roles = await createRolesFromClientData(
          rolesData.roles,
          factoryDb,
        );
        return roles;
      }
    } catch (error) {
      console.error(
        `   ❌ Error loading client roles data: ${error instanceof Error ? error.message : error}`,
      );
      throw error;
    }
  }

  // Default behavior - use predefined roles
  const roles = await createRolesFromClientData(PREDEFINED_ROLES, factoryDb);
  return roles;
}
