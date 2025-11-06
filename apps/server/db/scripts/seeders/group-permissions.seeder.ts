import { permissionGroupRepository } from '@/users/permission-groups/permission-groups.repository';
import type { PermissionGroup } from '@/users/permission-groups/permission-groups.types';
import { permissionRepository } from '@/users/permissions/permissions.repository';
import type { Permission } from '@/users/permissions/permissions.types';

/**
 * Interface for defining individual permissions
 */
interface PermissionDefinition {
  /** Unique code for the permission */
  code: string;
  /** Human-readable name for the permission */
  name: string;
  /** Description for the permission */
  description: string;
}

/**
 * Interface for defining permission groups with their permissions
 */
interface GroupPermissionDefinition {
  /** Unique code for the permission group */
  groupCode: string;
  /** Human-readable name for the permission group */
  groupName: string;
  /** Optional description for the permission group */
  groupDescription?: string;
  /** Array of permission definitions that belong to this group */
  permissions: PermissionDefinition[];
}

/**
 * Predefined permission groups with their associated permissions
 * Each group represents a logical collection of related permissions based on frontend menu structure
 */
const PREDEFINED_PERMISSION_GROUPS: GroupPermissionDefinition[] = [
  {
    groupCode: 'inventory_localities',
    groupName: 'Localidades',
    groupDescription:
      'Permisos para gestionar localidades geográficas y entidades relacionadas',
    permissions: [
      {
        code: 'inventory_countries',
        name: 'Países',
        description:
          'Administra información de países para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_states',
        name: 'Estados',
        description:
          'Administra información de estados para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_cities',
        name: 'Ciudades',
        description:
          'Administra información de ciudades para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_populations',
        name: 'Poblaciones',
        description:
          'Administra información de poblaciones para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_nodes',
        name: 'Nodos',
        description:
          'Administra información de nodos para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_installation_types',
        name: 'Tipos de Instalación',
        description:
          'Administra información de tipos de instalación para el Sistema de Inventario',
      },
      {
        code: 'inventory_events',
        name: 'Eventos',
        description:
          'Administra información de tipos de eventos para el Sistema de Inventario',
      },
      {
        code: 'inventory_labels',
        name: 'Etiquetas',
        description:
          'Administra etiquetas para clasificar y organizar nodos en el sistema',
      },
    ],
  },
  {
    groupCode: 'inventory_operators',
    groupName: 'Operadores',
    groupDescription:
      'Permisos para gestionar operadores de transporte y tipos de servicio',
    permissions: [
      {
        code: 'inventory_transporters',
        name: 'Grupos de Transporte',
        description:
          'Administra información de transportistas para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_service_types',
        name: 'Tipos de Servicio',
        description:
          'Administra información de tipos de servicio para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_bus_lines',
        name: 'Líneas de Autobús',
        description:
          'Administra información de líneas de autobús para el Sistema de Inventario de Autobuses',
      },
    ],
  },
  {
    groupCode: 'inventory_fleet',
    groupName: 'Flota',
    groupDescription:
      'Permisos para gestionar vehículos de flota, conductores y configuraciones relacionadas',
    permissions: [
      {
        code: 'inventory_buses',
        name: 'Autobuses',
        description:
          'Administra la flota de autobuses para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_bus_models',
        name: 'Modelos de Autobús',
        description:
          'Administra información de modelos de autobuses para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_seat_diagrams',
        name: 'Diagramas de Asientos',
        description:
          'Administra plantillas de diagramas de asientos para autobuses',
      },
      {
        code: 'inventory_drivers',
        name: 'Conductores',
        description:
          'Administra información de conductores para el Sistema de Inventario de Autobuses',
      },
      {
        code: 'inventory_technologies',
        name: 'Tecnologías',
        description: 'Gestiona las tecnologías disponibles para los autobuses',
      },
      {
        code: 'inventory_chromatics',
        name: 'Esquemas Cromáticos',
        description: 'Gestiona los esquemas de colores para los autobuses',
      },
    ],
  },
  {
    groupCode: 'inventory_routing',
    groupName: 'Recorridos',
    groupDescription: 'Permisos para gestionar rutas y trayectos',
    permissions: [
      {
        code: 'inventory_pathways',
        name: 'Trayectos',
        description:
          'Gestiona los trayectos entre nodos para las rutas de autobuses',
      },
      {
        code: 'inventory_routes',
        name: 'Rutas',
        description: 'Gestiona las rutas de autobuses',
      },
    ],
  },
  {
    groupCode: 'inventory_general_config',
    groupName: 'Configuración',
    groupDescription:
      'Permisos para gestionar la configuración general del sistema',
    permissions: [
      {
        code: 'inventory_amenities',
        name: 'Amenidades',
        description:
          'Gestiona las amenidades disponibles para los tipos de instalación',
      },
    ],
  },
  {
    groupCode: 'planning',
    groupName: 'Roles',
    groupDescription:
      'Permisos para gestionar planificación y programación de roles',
    permissions: [
      {
        code: 'planning_rolling_plans',
        name: 'Planificación de Roles',
        description:
          'Gestiona la planificación de roles que define la programación periódica de servicios de autobuses.',
      },
    ],
  },
  {
    groupCode: 'users',
    groupName: 'Organización',
    groupDescription: 'Permisos para gestionar usuarios y roles',
    permissions: [
      {
        code: 'users_departments',
        name: 'Departamentos',
        description: 'Administra departamentos del sistema',
      },
      {
        code: 'users_permissions',
        name: 'Permisos',
        description: 'Administra permisos del sistema',
      },
      {
        code: 'users_roles',
        name: 'Roles',
        description: 'Administra roles y permisos del sistema',
      },
      {
        code: 'users_users',
        name: 'Usuarios',
        description: 'Administra información de usuarios del sistema',
      },
    ],
  },
];

/**
 * Creates a permission group and its associated permissions
 * @param groupDefinition - The group definition containing group info and permission codes
 * @returns Object containing the created group and permissions
 */
async function createGroupWithPermissions(
  groupDefinition: GroupPermissionDefinition,
): Promise<{ group: PermissionGroup; permissions: Permission[] }> {
  try {
    // Create the permission group
    const group = await permissionGroupRepository.create({
      code: groupDefinition.groupCode,
      name: groupDefinition.groupName,
      description: groupDefinition.groupDescription ?? null,
    });

    const createdPermissions: Permission[] = [];

    // Create permissions for this group
    for (const permissionDefinition of groupDefinition.permissions) {
      try {
        const permission = await permissionRepository.create({
          code: permissionDefinition.code,
          name: permissionDefinition.name,
          description: permissionDefinition.description,
          permissionGroupId: group.id,
        });

        createdPermissions.push(permission);
      } catch (error) {
        console.error(
          `    ❌ Failed to create permission '${permissionDefinition.name}':`,
          error,
        );
        throw new Error(
          `Failed to create permission: ${permissionDefinition.name}`,
        );
      }
    }

    return { group, permissions: createdPermissions };
  } catch (error) {
    console.error(
      `❌ Failed to create group '${groupDefinition.groupName}':`,
      error,
    );
    throw new Error(`Failed to create group: ${groupDefinition.groupName}`);
  }
}

/**
 * Seeds permission groups with their associated permissions from predefined data
 * @param groupsData - Array of group definitions
 * @returns Object containing created groups and permissions summary
 */
async function createGroupsFromData(
  groupsData: GroupPermissionDefinition[],
): Promise<{
  groups: PermissionGroup[];
  permissions: Permission[];
  summary: {
    totalGroups: number;
    totalPermissions: number;
    groupsByCategory: Record<string, number>;
  };
}> {
  const allGroups: PermissionGroup[] = [];
  const allPermissions: Permission[] = [];
  const groupsByCategory: Record<string, number> = {};

  for (const groupDefinition of groupsData) {
    const { group, permissions } =
      await createGroupWithPermissions(groupDefinition);

    allGroups.push(group);
    allPermissions.push(...permissions);

    // Track permissions by category
    const category = groupDefinition.groupName;
    groupsByCategory[category] = permissions.length;
  }

  return {
    groups: allGroups,
    permissions: allPermissions,
    summary: {
      totalGroups: allGroups.length,
      totalPermissions: allPermissions.length,
      groupsByCategory,
    },
  };
}

/**
 * Seeds predefined permission groups with their associated permissions
 * @returns Object containing created groups and permissions summary
 */
export async function seedGroupPermissions(): Promise<{
  groups: PermissionGroup[];
  permissions: Permission[];
  summary: {
    totalGroups: number;
    totalPermissions: number;
    groupsByCategory: Record<string, number>;
  };
}> {
  return await createGroupsFromData(PREDEFINED_PERMISSION_GROUPS);
}
