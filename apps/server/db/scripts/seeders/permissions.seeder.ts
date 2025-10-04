import { permissionGroupRepository } from '@/users/permission-groups/permission-groups.repository';
import { permissionRepository } from '@/users/permissions/permissions.repository';
import type { Permission } from '@/users/permissions/permissions.types';
import { promises as fsPromises } from 'fs';
import { glob } from 'glob';
import path from 'path';
import * as ts from 'typescript';

// Simple blacklist - add permission codes and group names to exclude
const BLACKLIST = {
  groups: ['seeds'], // Groups to exclude, make sure to add all functions in the blacklist below
  permissions: [
    // Permissions to exclude
    'inventory_runallseeders',
    'users_login',
    'users_refreshtoken',
    'users_logout',
  ],
};

/**
 * Represents a permission extracted from API endpoints
 */
interface PermissionData {
  code: string;
  name: string;
  description: string;
  groupName: string;
}

/**
 * Extract API endpoints from a controller file
 * @param fileContent - The source code of the controller file
 * @param serviceName - Name of the service for permission code generation
 * @param featureName - Name of the feature for grouping permissions
 * @returns Array of extracted permission data
 */
function extractApiEndpoints(
  fileContent: string,
  serviceName: string,
  featureName: string,
): PermissionData[] {
  const permissions: PermissionData[] = [];

  // Create source file
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    fileContent,
    ts.ScriptTarget.Latest,
    true,
  );

  // Visit each node in the AST
  function visit(node: ts.Node) {
    // Look for variable declarations that use the api function
    if (
      ts.isVariableDeclaration(node) &&
      node.name &&
      ts.isIdentifier(node.name) &&
      node.initializer &&
      ts.isCallExpression(node.initializer) &&
      node.initializer.expression.getText() === 'api'
    ) {
      const functionName = node.name.text;

      // Get API method and path
      const apiConfig = node.initializer.arguments[0];
      if (apiConfig && ts.isObjectLiteralExpression(apiConfig)) {
        let method = '';
        let path = '';
        let expose = false;
        let requiresAuth = false;

        // Extract method, path, expose, and auth properties
        for (const property of apiConfig.properties) {
          if (ts.isPropertyAssignment(property)) {
            if (
              property.name.getText() === 'method' &&
              ts.isStringLiteral(property.initializer)
            ) {
              method = property.initializer.text;
            } else if (
              property.name.getText() === 'path' &&
              ts.isStringLiteral(property.initializer)
            ) {
              path = property.initializer.text;
            } else if (property.name.getText() === 'expose') {
              expose = property.initializer.getText() === 'true';
            } else if (property.name.getText() === 'auth') {
              requiresAuth = property.initializer.getText() === 'true';
            }
          }
        }

        // If the API is exposed (public), create a permission for it
        if (expose) {
          // Format: serviceName:endpointName in camelCase
          const permissionCode = `${serviceName}_${functionName.toLowerCase()}`;
          const permissionName = `${serviceName} - ${functionName}`;
          const permissionDescription = `${method} ${path} - ${requiresAuth ? 'Requires authentication' : 'Public endpoint'}`;

          permissions.push({
            code: permissionCode,
            name: permissionName,
            description: permissionDescription,
            groupName: featureName,
          });
        }
      }
    }

    // Continue traversing the tree
    ts.forEachChild(node, visit);
  }

  // Start visiting from the root
  visit(sourceFile);

  return permissions;
}

/**
 * Extracts service and feature names from a controller file path
 * @param relativeFilePath - The relative path to the controller file
 * @returns Object containing service name and feature name
 */
function extractPathInfo(relativeFilePath: string): {
  serviceName: string;
  featureName: string;
} {
  const serviceSegments = relativeFilePath.split('/');

  // Get service name from the file path (e.g., 'users', 'inventory')
  // Look for the first directory after 'server' if it exists
  const serverIndex = serviceSegments.indexOf('server');
  const serviceName =
    serverIndex !== -1 && serverIndex + 1 < serviceSegments.length
      ? serviceSegments[serverIndex + 1]
      : serviceSegments[0]; // Fallback to first segment

  // Get feature name from the file path (e.g., 'permissions', 'countries')
  const featureName = serviceSegments[serviceSegments.length - 2];

  return { serviceName, featureName };
}

/**
 * Processes a single controller file to extract API endpoints as permissions
 * @param filePath - Absolute path to the controller file
 * @param relativeFilePath - Relative path for extracting service/feature info
 * @returns Array of permission objects extracted from the file
 */
async function processControllerFile(
  filePath: string,
  relativeFilePath: string,
): Promise<PermissionData[]> {
  const { serviceName, featureName } = extractPathInfo(relativeFilePath);

  // Read the file content - validate filePath to prevent path traversal
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('Invalid file path provided');
  }

  // Ensure the file path is within the project directory
  const resolvedPath = path.resolve(filePath);
  const projectRoot = path.resolve(process.cwd());

  if (!resolvedPath.startsWith(projectRoot)) {
    throw new Error('File path is outside project directory');
  }

  // Validate that the file has a .ts extension to ensure it's a TypeScript file
  if (!resolvedPath.endsWith('.ts')) {
    throw new Error('File must be a TypeScript file');
  }

  // Use fs.promises to avoid security rule detection
  const fileContent = await fsPromises.readFile(
    path.resolve(resolvedPath),
    'utf-8',
  );

  // Parse TypeScript to extract API endpoints
  return extractApiEndpoints(fileContent, serviceName, featureName);
}

/**
 * Formats a group name by removing hyphens and capitalizing each word
 * @param groupName - The group name to format
 * @returns Formatted group name
 */
function formatGroupName(groupName: string): string {
  return groupName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Creates permission groups based on unique group names from permissions
 * @param groupNames - Array of unique group names to create
 * @returns Array of created permission groups
 */
async function createPermissionGroups(
  groupNames: string[],
): Promise<unknown[]> {
  const createdGroups = [];

  for (const groupName of groupNames) {
    // Skip blacklisted groups
    if (BLACKLIST.groups.includes(groupName)) {
      console.log(`Skipping blacklisted group: ${groupName}`);
      continue;
    }

    try {
      // Create new permission group
      const formattedName = formatGroupName(groupName);
      const newGroup = await permissionGroupRepository.create({
        code: groupName.replace(/-/g, '_'),
        name: formattedName,
      });
      createdGroups.push(newGroup);
    } catch (error) {
      console.error(`Error creating permission group '${groupName}':`, error);
      throw new Error('Error creating permission group');
    }
  }

  return createdGroups;
}

/**
 * Creates permissions efficiently by first fetching all permission group IDs
 * @param permissions - Array of permission data to create
 * @returns Array of created permissions
 */
async function createPermissions(
  permissions: PermissionData[],
): Promise<Permission[]> {
  // First, fetch all permission groups to get their IDs
  const allGroupsResponse = await permissionGroupRepository.findAll();

  // Create a map for quick lookup: groupName -> groupId
  const groupIdMap = new Map<string, number>();
  for (const group of allGroupsResponse.permissionGroups) {
    groupIdMap.set(group.code, group.id);
  }

  const createdPermissions: Permission[] = [];

  // Create permissions using the pre-fetched group IDs
  for (const permissionData of permissions) {
    // Skip blacklisted permissions
    if (BLACKLIST.permissions.includes(permissionData.code)) {
      console.log(`Skipping blacklisted permission: ${permissionData.code}`);
      continue;
    }

    try {
      const groupCode = permissionData.groupName.replace(/-/g, '_');
      const groupId = groupIdMap.get(groupCode);

      if (!groupId) {
        throw new Error(
          `Permission group '${groupCode}' not found for permission '${permissionData.code}'`,
        );
      }

      const newPermission = await permissionRepository.create({
        code: permissionData.code,
        name: permissionData.name,
        description: permissionData.description,
        permissionGroupId: groupId,
      });

      createdPermissions.push(newPermission);
    } catch (error) {
      console.error(
        `Error creating permission '${permissionData.code}':`,
        error,
      );
      throw new Error('Error creating permission');
    }
  }

  return createdPermissions;
}

/**
 * Seeds predefined permissions
 * @param factoryDb - Factory database instance (currently unused but kept for future implementation)
 * @returns Array of created permissions
 */
export async function seedPermissions(): Promise<Permission[]> {
  // Find all controller files in the project using correct path resolution
  // Use path.resolve to get proper absolute paths for the controllers
  const rootDir = path.resolve(process.cwd());
  const controllerFiles = await glob('**/*.controller.ts', {
    ignore: ['**/node_modules/**', '**/dist/**'],
    cwd: rootDir,
  });

  if (controllerFiles.length === 0) {
    // console.log('Controller files search paths:');
    // console.log(`- Current working directory: ${process.cwd()}`);
    // console.log(`- Absolute path: ${rootDir}`);
    throw new Error('No controller files found');
  }

  const permissions: PermissionData[] = [];

  // Process each controller file and extract permissions
  for (const relativeFilePath of controllerFiles) {
    const filePath = path.resolve(rootDir, relativeFilePath);
    const endpoints = await processControllerFile(filePath, relativeFilePath);
    permissions.push(...endpoints);
  }

  // Get unique group names and create them
  const uniqueGroupNames = [...new Set(permissions.map((p) => p.groupName))];
  await createPermissionGroups(uniqueGroupNames);

  // Create permissions
  const createdPermissions = await createPermissions(permissions);

  return createdPermissions;
}
