import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../components/button';
import { Card } from '../components/card';
import Filter from '../components/icons/Filter';
import Location from '../components/icons/Location';
import { SearchBar } from '../components/searchbar';
import { SectionHeader } from '../components/section-header';
import { Select } from '../components/select';
import { Switch } from '../components/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/table';

interface Country {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
}

function SectionExample() {
  const [countries, setCountries] = useState<Country[]>([
    { id: 1, name: 'México', code: 'MX', isActive: true },
    { id: 2, name: 'Estados Unidos', code: 'US', isActive: true },
    { id: 3, name: 'Canadá', code: 'CA', isActive: false },
    { id: 4, name: 'Colombia', code: 'CO', isActive: true },
    { id: 5, name: 'Argentina', code: 'AR', isActive: false },
    { id: 6, name: 'Brasil', code: 'BR', isActive: true },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  function handleToggleCountry(id: number) {
    setCountries((prev) =>
      prev.map((country) =>
        country.id === id
          ? { ...country, isActive: !country.isActive }
          : country,
      ),
    );
  }

  const filteredCountries = countries.filter((country) => {
    const matchesSearch = country.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' && country.isActive) ||
      (statusFilter === 'inactive' && !country.isActive);
    return matchesSearch && matchesStatus;
  });

  const activeCountriesCount = countries.filter((c) => c.isActive).length;
  const addedThisMonth = 2; // Simulación de países agregados este mes

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 p-6">
      <SectionHeader
        title="Países"
        description="Crear un catálogo de países"
        rightContent={`${countries.length} Países`}
        icon={<Location />}
        badges={[
          `${countries.length} países`,
          `${activeCountriesCount} activos`,
          `${addedThisMonth} agregados este mes`,
        ]}
      />

      <Card>
        <div className="flex gap-4 items-center mb-8">
          <div className="w-[290px]">
            <SearchBar
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar país"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: '', label: 'Todos' },
              { value: 'active', label: 'Activo' },
              { value: 'inactive', label: 'Inactivo' },
            ]}
            placeholder="Estado"
            leftIcon={Filter}
            className="w-auto min-w-[150px]"
          />
          <div className="flex-1" />
          <Button>+ Agregar país</Button>
        </div>

        <Table stickyLastColumn={true}>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead className="w-[120px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCountries.map((country) => (
              <TableRow key={country.id}>
                <TableCell>
                  <Switch
                    checked={country.isActive}
                    onCheckedChange={() => handleToggleCountry(country.id)}
                  />
                </TableCell>
                <TableCell
                  className={`font-bold ${
                    !country.isActive ? 'opacity-50' : ''
                  }`}
                >
                  {country.name}
                </TableCell>
                <TableCell className={!country.isActive ? 'opacity-50' : ''}>
                  {country.code}
                </TableCell>
                <TableCell>
                  <div className="flex gap-0.5">
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Eye className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-primary hover:bg-primary-light/15 rounded transition-colors">
                      <Pencil className="w-[14px] h-[14px]" />
                    </button>
                    <button className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded transition-colors">
                      <Trash2 className="w-[14px] h-[14px]" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const meta = {
  title: 'Examples/Section Example',
  component: SectionExample,
  tags: ['autodocs'],
} satisfies Meta<typeof SectionExample>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Complete section example showing SectionHeader, filters, and a table with switchable states
 */
export const Default: Story = {
  render: () => <SectionExample />,
};
