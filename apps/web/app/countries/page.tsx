import { PageHeader } from '@/components/ui-components';
import CountriesTable from './countries-table';

export default function CountriesPage() {
  return (
    <div>
      <PageHeader
        title="Países"
        description="Administra información de países para el Sistema de Inventario de Autobuses"
        createHref="/countries/new"
        createLabel="Crear País"
      />
      <CountriesTable />
    </div>
  );
}
