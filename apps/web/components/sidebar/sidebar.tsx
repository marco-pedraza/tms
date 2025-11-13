'use client';

import type React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  Building,
  Building2,
  Bus,
  Calendar,
  Cog,
  Cpu,
  Flag,
  Globe,
  House,
  LayoutGrid,
  LogOut,
  Map as MapIcon,
  MapPin,
  Navigation,
  Package,
  Palette,
  Route,
  Settings,
  ShieldCheck,
  Star,
  Tag,
  Truck,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useUserPermissions } from '@/hooks/use-user-permissions';
import routes from '@/services/routes';
import SidebarLink from './sidebar-link';
import SidebarSection from './sidebar-section';

export default function Sidebar() {
  const tSidebar = useTranslations('sidebar');
  const tAuth = useTranslations('auth');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();
  const { hasModuleAccess, hasAnyAccess, isLoading } = useUserPermissions();

  // Define module access checks
  const hasLocalitiesAccess = hasAnyAccess([
    'inventory_countries',
    'inventory_states',
    'inventory_cities',
    'inventory_populations',
    'inventory_nodes',
    'inventory_installation_types',
    'inventory_events',
    'inventory_labels',
  ]);

  const hasOperatorsAccess = hasAnyAccess([
    'inventory_transporters',
    'inventory_service_types',
    'inventory_bus_lines',
  ]);

  const hasFleetAccess = hasAnyAccess([
    'inventory_buses',
    'inventory_bus_models',
    'inventory_seat_diagrams',
    'inventory_drivers',
    'inventory_technologies',
    'inventory_chromatics',
  ]);

  const hasRoutingAccess = hasAnyAccess([
    'inventory_pathways',
    'inventory_routes',
  ]);
  const hasConfigAccess = hasModuleAccess('inventory_amenities');
  const hasUsersAccess = hasAnyAccess([
    'users_roles',
    'users_users',
    'users_departments',
  ]);

  const hasInventoryAccess =
    hasLocalitiesAccess ||
    hasOperatorsAccess ||
    hasFleetAccess ||
    hasRoutingAccess ||
    hasConfigAccess;

  if (isLoading) {
    return (
      <nav className="flex flex-col h-full gap-2 px-4 py-4">
        <div className="mb-6 flex items-center rounded-md px-3 py-2 text-2xl font-bold text-primary">
          <span>{tSidebar('title')}</span>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="text-sm text-muted-foreground">
            {tCommon('loading')}
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="flex flex-col h-full gap-2 px-4 py-4">
      <Link
        href={routes.index}
        className="mb-6 flex items-center rounded-md px-3 py-2 text-2xl font-bold text-primary hover:text-primary/90"
      >
        <span>{tSidebar('title')}</span>
      </Link>

      {hasInventoryAccess && (
        <SidebarSection
          title={tSidebar('inventory.title')}
          icon={<Package className="h-4 w-4" />}
          defaultOpen={true}
        >
          {hasLocalitiesAccess && (
            <SidebarSection
              title={tSidebar('inventory.localities.title')}
              icon={<MapPin className="h-4 w-4" />}
            >
              {hasModuleAccess('inventory_countries') && (
                <SidebarLink
                  href={routes.countries.index}
                  icon={Globe}
                  label={tSidebar('inventory.localities.countries')}
                />
              )}
              {hasModuleAccess('inventory_states') && (
                <SidebarLink
                  href={routes.states.index}
                  icon={MapIcon}
                  label={tSidebar('inventory.localities.states')}
                />
              )}
              {hasModuleAccess('inventory_cities') && (
                <SidebarLink
                  href={routes.cities.index}
                  icon={Building}
                  label={tSidebar('inventory.localities.cities')}
                />
              )}
              {hasModuleAccess('inventory_populations') && (
                <SidebarLink
                  href={routes.populations.index}
                  icon={Building}
                  label={tSidebar('inventory.localities.populations')}
                />
              )}
              {hasModuleAccess('inventory_nodes') && (
                <SidebarLink
                  href={routes.nodes.index}
                  icon={Building2}
                  label={tSidebar('inventory.localities.nodes')}
                />
              )}
              {hasModuleAccess('inventory_installation_types') && (
                <SidebarLink
                  href={routes.installationTypes.index}
                  icon={Settings}
                  label={tSidebar('inventory.localities.installationTypes')}
                />
              )}
              {hasModuleAccess('inventory_events') && (
                <SidebarLink
                  href={routes.events.index}
                  icon={Calendar}
                  label={tSidebar('inventory.localities.events')}
                />
              )}
              {hasModuleAccess('inventory_labels') && (
                <SidebarLink
                  href={routes.labels.index}
                  icon={Tag}
                  label={tSidebar('inventory.localities.labels')}
                />
              )}
            </SidebarSection>
          )}

          {hasOperatorsAccess && (
            <SidebarSection
              title={tSidebar('inventory.operators.title')}
              icon={<Users className="h-4 w-4" />}
            >
              {hasModuleAccess('inventory_transporters') && (
                <SidebarLink
                  href={routes.transporters.index}
                  icon={Briefcase}
                  label={tSidebar('inventory.operators.transporters')}
                />
              )}
              {hasModuleAccess('inventory_service_types') && (
                <SidebarLink
                  href={routes.serviceTypes.index}
                  icon={Flag}
                  label={tSidebar('inventory.operators.serviceTypes')}
                />
              )}
              {hasModuleAccess('inventory_bus_lines') && (
                <SidebarLink
                  href={routes.busLines.index}
                  icon={Bus}
                  label={tSidebar('inventory.operators.busLines')}
                />
              )}
            </SidebarSection>
          )}

          {hasFleetAccess && (
            <SidebarSection
              title={tSidebar('inventory.fleet.title')}
              icon={<Bus className="h-4 w-4" />}
            >
              {hasModuleAccess('inventory_buses') && (
                <SidebarLink
                  href={routes.buses.index}
                  icon={Bus}
                  label={tSidebar('inventory.fleet.buses')}
                />
              )}
              {hasModuleAccess('inventory_bus_models') && (
                <SidebarLink
                  href={routes.busModels.index}
                  icon={Truck}
                  label={tSidebar('inventory.fleet.busModels')}
                />
              )}
              {hasModuleAccess('inventory_seat_diagrams') && (
                <SidebarLink
                  href={routes.seatDiagrams.index}
                  icon={LayoutGrid}
                  label={tSidebar('inventory.fleet.seatDiagrams')}
                />
              )}
              {hasModuleAccess('inventory_drivers') && (
                <SidebarLink
                  href={routes.drivers.index}
                  icon={Users}
                  label={tSidebar('inventory.fleet.drivers')}
                />
              )}
              {hasModuleAccess('inventory_technologies') && (
                <SidebarLink
                  href={routes.technologies.index}
                  icon={Cpu}
                  label={tSidebar('inventory.fleet.technologies')}
                />
              )}
              {hasModuleAccess('inventory_chromatics') && (
                <SidebarLink
                  href={routes.chromatics.index}
                  icon={Palette}
                  label={tSidebar('inventory.fleet.chromatics')}
                />
              )}
            </SidebarSection>
          )}

          {hasRoutingAccess && (
            <SidebarSection
              title={tSidebar('inventory.routing.title')}
              icon={<Route className="h-4 w-4" />}
            >
              {hasModuleAccess('inventory_pathways') && (
                <SidebarLink
                  href={routes.pathways.index}
                  icon={Navigation}
                  label={tSidebar('inventory.routing.pathways')}
                />
              )}
              {hasModuleAccess('inventory_routes') && (
                <SidebarLink
                  href={routes.routes.index}
                  icon={Route}
                  label={tSidebar('inventory.routing.routes')}
                />
              )}
            </SidebarSection>
          )}

          {hasConfigAccess && (
            <SidebarSection
              title={tSidebar('inventory.generalConfig.title')}
              icon={<Cog className="h-4 w-4" />}
            >
              {hasModuleAccess('inventory_amenities') && (
                <SidebarLink
                  href={routes.amenities.index}
                  icon={Star}
                  label={tSidebar('inventory.generalConfig.amenities')}
                />
              )}
            </SidebarSection>
          )}
        </SidebarSection>
      )}

      {/* <SidebarSection
        title={tSidebar('planning.title')}
        icon={<PlaneLanding className="h-4 w-4" />}
        defaultOpen={true}
      >
        <SidebarLink
          href={routes.busPlans.index}
          icon={FileText}
          label={tSidebar('planning.busPlans')}
        />
      </SidebarSection> */}

      {hasUsersAccess && (
        <SidebarSection
          title={tSidebar('users.title')}
          icon={<House className="h-4 w-4" />}
          defaultOpen={true}
        >
          {hasModuleAccess('users_roles') && (
            <SidebarLink
              href={routes.roles.index}
              icon={ShieldCheck}
              label={tSidebar('users.roles')}
            />
          )}
          {hasModuleAccess('users_users') && (
            <SidebarLink
              href={routes.users.index}
              icon={UserRoundSearch}
              label={tSidebar('users.users')}
            />
          )}
          {hasModuleAccess('users_departments') && (
            <SidebarLink
              href={routes.departments.index}
              icon={Building2}
              label={tSidebar('users.departments')}
            />
          )}
        </SidebarSection>
      )}

      {/* User Info and Logout */}
      {session?.user && (
        <div className="mt-4 border-t pt-4">
          <div className="px-3 py-2 text-sm text-muted-foreground">
            <div className="font-medium text-foreground">
              {session.user.firstName} {session.user.lastName}
            </div>
            <div className="text-xs">{session.user.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/login' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
          >
            <LogOut className="h-4 w-4" />
            {tAuth('messages.logout.action')}
          </button>
        </div>
      )}
    </nav>
  );
}
