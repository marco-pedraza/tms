'use client';

import type React from 'react';
import Link from 'next/link';
import {
  // Briefcase,
  Building,
  Building2,
  Calendar,
  //Bus,
  Globe,
  Map,
  MapPin,
  Package,
  Settings,
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
          defaultOpen={true}
        >
          <SidebarLink
            href={routes.countries.index}
            icon={Globe}
            label={tSidebar('inventory.localities.countries')}
          />
          <SidebarLink
            href={routes.states.index}
            icon={Map}
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
        </SidebarSection>

        {/* <SidebarLink
          href={routes.terminals.index}
          icon={Building2}
          label={tSidebar('inventory.terminals')}
        /> */}
        {/* <SidebarLink
          href={routes.transporters.index}
          icon={Briefcase}
          label={tSidebar('inventory.transporters')}
        /> */}
        {/* <SidebarLink
          href={routes.serviceTypes.index}
          icon={Briefcase}
          label={tSidebar('inventory.serviceTypes')}
        /> */}
        {/* <SidebarLink
          href={routes.busLines.index}
          icon={Bus}
          label={tSidebar('inventory.busLines')}
        /> */}
        {/* <SidebarLink
          href={routes.drivers.index}
          icon={Users}
          label={tSidebar('inventory.drivers')}
        /> */}

        {/* <SidebarLink
          href={routes.routes.index}
          icon={Route}
          label={tSidebar('inventory.routes')}
        />
        <SidebarLink
          href={routes.pathways.index}
          icon={Navigation}
          label={tSidebar('inventory.pathways')}
        />
        <SidebarLink
          href={routes.pathwayServices.index}
          icon={Settings}
          label={tSidebar('inventory.pathwayServices')}
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
        />
        <SidebarLink
          href={routes.buses.index}
          icon={Bus}
          label={tSidebar('inventory.buses')}
        /> */}
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
    </nav>
  );
}
