import fs from 'fs';
import { glob } from 'glob';
import path from 'path';
import * as ts from 'typescript';
import { permissionRepository } from '../../users/permissions/permissions.repository';
import { userPermissionsRepository } from '../../users/user-permissions/user-permissions.repository';
import { userRepository } from '../../users/users/users.repository';

/**
 * Main function to seed permissions and assign them to system admins
 */
async function seedPermissions() {
  try {
    console.log('Starting permissions seeding...');

    // Find all controller files in the project using correct path resolution
    // Use path.resolve to get proper absolute paths for the controllers
    const rootDir = path.resolve(process.cwd());
    console.log('Root directory:', rootDir);

    // Use more specific glob pattern with both relative and absolute path options
    const controllerFiles = await glob('**/*.controller.ts', {
      ignore: ['**/node_modules/**', '**/dist/**'],
      cwd: rootDir,
    });

    console.log(`Found ${controllerFiles.length} controller files`);

    if (controllerFiles.length === 0) {
      console.log('Controller files search paths:');
      console.log(`- Current working directory: ${process.cwd()}`);
      console.log(`- Absolute path: ${rootDir}`);
      console.log(
        'Please check that the script is running from the correct directory',
      );
    }

    // Store all extracted permissions
    const permissions: { code: string; name: string; description: string }[] =
      [];

    // Process each controller file
    for (const relativeFilePath of controllerFiles) {
      const filePath = path.resolve(rootDir, relativeFilePath);
      console.log(`Found controller file: ${filePath}`);

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

      console.log(`Processing ${serviceName}/${featureName}...`);

      // Read the file content
      const fileContent = fs.readFileSync(filePath, 'utf-8');

      // Parse TypeScript to extract API endpoints
      const endpoints = extractApiEndpoints(fileContent, serviceName);
      permissions.push(...endpoints);
    }

    // Filter out duplicates
    const uniquePermissions = permissions.filter(
      (permission, index, self) =>
        index === self.findIndex((p) => p.code === permission.code),
    );

    console.log(`Extracted ${uniquePermissions.length} unique permissions`);

    // Create all permissions in the database
    const createdPermissionIds: number[] = [];

    for (const permission of uniquePermissions) {
      try {
        // Check if permission already exists
        try {
          const existingPermission = await permissionRepository.findByCode(
            permission.code,
          );
          console.log(`Permission already exists: ${permission.code}`);
          createdPermissionIds.push(existingPermission.id);
        } catch {
          // Permission doesn't exist, create it
          const newPermission = await permissionRepository.create(permission);
          console.log(`Created permission: ${permission.code}`);
          createdPermissionIds.push(newPermission.id);
        }
      } catch (err) {
        console.error(`Error creating permission ${permission.code}:`, err);
      }
    }

    console.log('Permissions seeding completed!');

    // Part 2: Assign permissions to system admin users
    console.log('\nAssigning permissions to system admin users...');

    // Get all system admin users
    const systemAdmins = await userRepository.findAllBy(
      users.isSystemAdmin,
      true,
    );

    console.log(`Found ${systemAdmins.length} system admin users`);

    if (systemAdmins.length === 0) {
      console.log(
        'No system admin users found. Skipping permission assignment.',
      );
      return;
    }

    // Assign permissions to each system admin
    for (const admin of systemAdmins) {
      try {
        await userPermissionsRepository.assignPermissions(admin.id, {
          permissionIds: createdPermissionIds,
        });
        console.log(
          `Successfully assigned all permissions to system admin: ${admin.username} (ID: ${admin.id})`,
        );
      } catch (err) {
        console.error(
          `Error assigning permissions to admin ${admin.username} (ID: ${admin.id}):`,
          err,
        );
      }
    }

    console.log('Permission assignment to system admins completed!');
  } catch (error) {
    console.error('Error seeding permissions:', error);
    process.exit(1);
  }
}

/**
 * Extract API endpoints from a controller file
 */
function extractApiEndpoints(
  fileContent: string,
  serviceName: string,
): { code: string; name: string; description: string }[] {
  const permissions: { code: string; name: string; description: string }[] = [];

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
      node.initializer.expression.getText().includes('api')
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
          const permissionCode = `${serviceName}:${functionName}`;
          const permissionName = `${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} - ${functionName.charAt(0).toUpperCase() + functionName.slice(1)}`;
          const permissionDescription = `${method} ${path} - ${requiresAuth ? 'Requires authentication' : 'Public endpoint'}`;

          permissions.push({
            code: permissionCode,
            name: permissionName,
            description: permissionDescription,
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

// Run the script
seedPermissions().then(() => process.exit(0));
