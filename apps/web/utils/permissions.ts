import type { permissions } from '@repo/ims-client';

/**
 * Maps route patterns to module permissions
 * Routes are matched by pathname prefix
 */
export const ROUTE_TO_MODULE: Record<string, string> = {
  '/countries': 'inventory_countries',
  '/states': 'inventory_states',
  '/cities': 'inventory_cities',
  '/populations': 'inventory_populations',
  '/nodes': 'inventory_nodes',
  '/installation-types': 'inventory_installation_types',
  '/events': 'inventory_events',
  '/labels': 'inventory_labels',
  '/transporters': 'inventory_transporters',
  '/service-types': 'inventory_service_types',
  '/bus-lines': 'inventory_bus_lines',
  '/buses': 'inventory_buses',
  '/bus-models': 'inventory_bus_models',
  '/seat-diagrams': 'inventory_seat_diagrams',
  '/drivers': 'inventory_drivers',
  '/technologies': 'inventory_technologies',
  '/chromatics': 'inventory_chromatics',
  '/pathways': 'inventory_pathways',
  '/routes': 'inventory_routes',
  '/amenities': 'inventory_amenities',
  '/roles': 'users_roles',
  '/users': 'users_users',
};

/**
 * Gets the module permission required for a route
 */
export function getModuleFromRoute(pathname: string): string | null {
  // Remove trailing slashes and normalize
  const normalizedPath = pathname.replace(/\/+$/, '');

  // Find the matching route (check for exact match or prefix match)
  for (const [route, module] of Object.entries(ROUTE_TO_MODULE)) {
    if (normalizedPath === route || normalizedPath.startsWith(`${route}/`)) {
      return module;
    }
  }

  return null;
}

/**
 * Checks if user has access to a specific route
 */
export function canAccessRoute(
  pathname: string,
  permissions: permissions.Permission[],
  isSystemAdmin = false,
): boolean {
  if (isSystemAdmin) return true;

  // Allow access to home page for all authenticated users
  if (pathname === '/') return true;

  const modulePermission = getModuleFromRoute(pathname);
  if (!modulePermission) return false;

  return permissions.some((p) => p.code === modulePermission);
}

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = ['/auth/login', '/access-denied'];

/**
 * Checks if a route is public
 */
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
