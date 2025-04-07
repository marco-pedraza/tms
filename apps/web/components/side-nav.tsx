'use client';

import type React from 'react';

import Link from 'next/link';
import {
  Globe,
  Map,
  Building,
  Building2,
  Bus,
  Briefcase,
  Route,
  Settings,
  Users,
  Navigation,
  FileText,
  ChevronDown,
  ChevronRight,
  Package,
  PlaneLanding,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/utils/cn';

interface SideNavSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function SideNavSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: SideNavSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
      >
        <div className="flex items-center">
          {icon}
          <span className="ml-2">{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      <div className={cn('pl-4 space-y-1', isOpen ? 'block' : 'hidden')}>
        {children}
      </div>
    </div>
  );
}

export function SideNav() {
  return (
    <nav className="grid items-start gap-2 px-4 py-4">
      {/* Añadir título con enlace a la página principal */}
      <Link
        href="/"
        className="mb-6 flex items-center rounded-md px-3 py-2 text-2xl font-bold text-primary hover:text-primary/90"
      >
        <span>IMS.ai</span>
      </Link>

      <SideNavSection
        title="Inventario"
        icon={<Package className="h-4 w-4" />}
        defaultOpen={true}
      >
        <Link
          href="/countries"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Globe className="mr-2 h-4 w-4" />
          <span>Países</span>
        </Link>
        <Link
          href="/states"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Map className="mr-2 h-4 w-4" />
          <span>Estados</span>
        </Link>
        <Link
          href="/cities"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Building className="mr-2 h-4 w-4" />
          <span>Ciudades</span>
        </Link>
        <Link
          href="/terminals"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Building2 className="mr-2 h-4 w-4" />
          <span>Terminales</span>
        </Link>
        <Link
          href="/transporters"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Briefcase className="mr-2 h-4 w-4" />
          <span>Grupos de Transporte</span>
        </Link>
        <Link
          href="/buslines"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Bus className="mr-2 h-4 w-4" />
          <span>Líneas de Autobus</span>
        </Link>
        <Link
          href="/routes"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Route className="mr-2 h-4 w-4" />
          <span>Rutas</span>
        </Link>
        <Link
          href="/pathways"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Navigation className="mr-2 h-4 w-4" />
          <span>Trayectos</span>
        </Link>
        <Link
          href="/pathway-services"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Servicios de Trayecto</span>
        </Link>
        <Link
          href="/services"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Bus className="mr-2 h-4 w-4" />
          <span>Servicios</span>
        </Link>
        <Link
          href="/drivers"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Users className="mr-2 h-4 w-4" />
          <span>Conductores</span>
        </Link>
        <Link
          href="/bus-models"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Settings className="mr-2 h-4 w-4" />
          <span>Modelos de Autobus</span>
        </Link>
        <Link
          href="/buses"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <Bus className="mr-2 h-4 w-4" />
          <span>Autobuses</span>
        </Link>
      </SideNavSection>

      <SideNavSection
        title="Planeación"
        icon={<PlaneLanding className="h-4 w-4" />}
        defaultOpen={true}
      >
        <Link
          href="/bus-plans"
          className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground"
        >
          <FileText className="mr-2 h-4 w-4" />
          <span>Roles</span>
        </Link>
      </SideNavSection>
    </nav>
  );
}
