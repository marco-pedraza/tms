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
  Map as MapIcon,
  MapPin,
  Navigation,
  Package,
  Palette,
  Route,
  Settings,
  Star,
  Tag,
  Truck,
  UserRoundSearch,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import routes from '@/services/routes';
import SidebarLink from './sidebar-link';
import SidebarSection from './sidebar-section';

export default function Sidebar() {
  const tSidebar = useTranslations('sidebar');

  return (
    <nav className="grid items-start gap-2 px-4 py-4">
      <Link
        href={routes.index}
        className="mb-6 flex items-center rounded-md px-3 py-2 text-2xl font-bold text-primary hover:text-primary/90"
      >
        <span>{tSidebar('title')}</span>
      </Link>

      <SidebarSection
        title={tSidebar('inventory.title')}
        icon={<Package className="h-4 w-4" />}
        defaultOpen={true}
      >
        <SidebarSection
          title={tSidebar('inventory.localities.title')}
          icon={<MapPin className="h-4 w-4" />}
        >
          <SidebarLink
            href={routes.countries.index}
            icon={Globe}
            label={tSidebar('inventory.localities.countries')}
          />
          <SidebarLink
            href={routes.states.index}
            icon={MapIcon}
            label={tSidebar('inventory.localities.states')}
          />
          <SidebarLink
            href={routes.cities.index}
            icon={Building}
            label={tSidebar('inventory.localities.cities')}
          />
          <SidebarLink
            href={routes.populations.index}
            icon={Building}
            label={tSidebar('inventory.localities.populations')}
          />
          <SidebarLink
            href={routes.nodes.index}
            icon={Building2}
            label={tSidebar('inventory.localities.nodes')}
          />
          <SidebarLink
            href={routes.installationTypes.index}
            icon={Settings}
            label={tSidebar('inventory.localities.installationTypes')}
          />
          <SidebarLink
            href={routes.events.index}
            icon={Calendar}
            label={tSidebar('inventory.localities.events')}
          />
          <SidebarLink
            href={routes.labels.index}
            icon={Tag}
            label={tSidebar('inventory.localities.labels')}
          />
        </SidebarSection>

        <SidebarSection
          title={tSidebar('inventory.operators.title')}
          icon={<Users className="h-4 w-4" />}
        >
          <SidebarLink
            href={routes.transporters.index}
            icon={Briefcase}
            label={tSidebar('inventory.operators.transporters')}
          />
          <SidebarLink
            href={routes.serviceTypes.index}
            icon={Flag}
            label={tSidebar('inventory.operators.serviceTypes')}
          />
          <SidebarLink
            href={routes.busLines.index}
            icon={Bus}
            label={tSidebar('inventory.operators.busLines')}
          />
        </SidebarSection>

        {/* <SidebarLink
          href={routes.routes.index}
          icon={Route}
          label={tSidebar('inventory.routes')}
        />
        <SidebarLink
          href={routes.services.index}
          icon={Bus}
          label={tSidebar('inventory.services')}
        />
        <SidebarLink
          href={routes.busModels.index}
          icon={Bus}
          label={tSidebar('inventory.busModels')}
        /> */}
        <SidebarSection
          title={tSidebar('inventory.fleet.title')}
          icon={<Bus className="h-4 w-4" />}
        >
          <SidebarLink
            href={routes.buses.index}
            icon={Bus}
            label={tSidebar('inventory.fleet.buses')}
          />
          <SidebarLink
            href={routes.busModels.index}
            icon={Truck}
            label={tSidebar('inventory.fleet.busModels')}
          />
          <SidebarLink
            href={routes.seatDiagrams.index}
            icon={LayoutGrid}
            label={tSidebar('inventory.fleet.seatDiagrams')}
          />
          <SidebarLink
            href={routes.drivers.index}
            icon={Users}
            label={tSidebar('inventory.fleet.drivers')}
          />
          <SidebarLink
            href={routes.technologies.index}
            icon={Cpu}
            label={tSidebar('inventory.fleet.technologies')}
          />
          <SidebarLink
            href={routes.chromatics.index}
            icon={Palette}
            label={tSidebar('inventory.fleet.chromatics')}
          />
        </SidebarSection>

        <SidebarSection
          title={tSidebar('inventory.routing.title')}
          icon={<Route className="h-4 w-4" />}
        >
          <SidebarLink
            href={routes.pathways.index}
            icon={Navigation}
            label={tSidebar('inventory.routing.pathways')}
          />
        </SidebarSection>

        <SidebarSection
          title={tSidebar('inventory.generalConfig.title')}
          icon={<Cog className="h-4 w-4" />}
        >
          <SidebarLink
            href={routes.amenities.index}
            icon={Star}
            label={tSidebar('inventory.generalConfig.amenities')}
          />
        </SidebarSection>
      </SidebarSection>

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

      <SidebarSection
        title={tSidebar('users.title')}
        icon={<House className="h-4 w-4" />}
        defaultOpen={true}
      >
        <SidebarLink
          href={routes.users.index}
          icon={UserRoundSearch}
          label={tSidebar('users.users')}
        />
      </SidebarSection>
    </nav>
  );
}
