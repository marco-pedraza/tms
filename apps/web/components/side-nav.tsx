import Link from 'next/link';
import {
  Globe,
  Map,
  Building,
  Building2,
  Bus,
  Briefcase,
  Route,
} from 'lucide-react';

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
    </nav>
  );
}
