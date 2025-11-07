import Link from 'next/link';
import { Briefcase, Building, Bus, Globe, Map as MapIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import routes from '@/services/routes';

export default async function HomePage() {
  const t = await getTranslations('countries');
  const tStates = await getTranslations('states');
  const tCities = await getTranslations('cities');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Sistema de inventario de Reserhub</h1>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">{t('title')}</CardTitle>
            <Globe className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {t('description')}
            </p>
            <Link href={routes.countries.index}>
              <Button className="w-full">Ver {t('title')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              {tStates('title')}
            </CardTitle>
            <MapIcon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {tStates('description')}
            </p>
            <Link href={routes.states.index}>
              <Button className="w-full">Ver {tStates('title')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              {tCities('title')}
            </CardTitle>
            <Building className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              {tCities('description')}
            </p>
            <Link href={routes.cities.index}>
              <Button className="w-full">Ver {tCities('title')}</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Grupos de Transporte
            </CardTitle>
            <Briefcase className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Administra información de grupos de transporte
            </p>
            <Link href={routes.transporters.index}>
              <Button className="w-full">Ver Grupos de Transporte</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-medium">
              Líneas de Autobus
            </CardTitle>
            <Bus className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Administra información de líneas de autobus
            </p>
            <Link href={routes.busLines.index}>
              <Button className="w-full">Ver Líneas de Autobus</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
