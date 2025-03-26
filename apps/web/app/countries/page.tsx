'use client';

import { useState } from 'react';
import { PageHeader, ActionButtons } from '@/components/ui-components';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import client from '@/lib/imsClient';
import { useQuery } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';

export default function CountriesPage() {
  const {
    data: countriesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['countries'],
    queryFn: async () =>
      await client.inventory.listCountries({
        page: 1,
        pageSize: 10,
        sortBy: 'name',
        sortDirection: 'asc',
      }),
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const filteredData =
    countriesData?.data?.filter(
      (country) =>
        country.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        country.code.toLowerCase().includes(searchTerm.toLowerCase()),
    ) ?? [];

  const handleDelete = (id: string) => {
    setDeleteId(id);
  };

  const confirmDelete = () => {
    if (deleteId) {
      // @todo implement delete
      setDeleteId(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Países"
        description="Administra información de países para el Sistema de Inventario de Autobuses"
        createHref="/countries/new"
        createLabel="Crear País"
      />

      <div className="flex items-center py-4">
        <Input
          placeholder="Search countries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center place-items-center"
                >
                  <Loader2 className="h-4 w-4 animate-spin" />
                </TableCell>
              </TableRow>
            )}
            {error && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Error loading countries
                </TableCell>
              </TableRow>
            )}

            {!isLoading && !error && filteredData.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No countries found.
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              !error &&
              filteredData.length > 0 &&
              filteredData.map((country) => (
                <TableRow key={country.id}>
                  <TableCell className="font-medium">{country.name}</TableCell>
                  <TableCell>{country.code}</TableCell>
                  <TableCell>
                    {country.active ? (
                      <Badge variant="outline" className="bg-green-100">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(country.createdAt ?? '').toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <ActionButtons
                      viewHref={`/countries/${country.id}`}
                      editHref={`/countries/${country.id}/edit`}
                      onDelete={() => handleDelete(country.id.toString())}
                      small
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              country and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
