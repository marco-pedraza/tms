'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, ActionButtons } from '@/components/ui-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import { toast } from 'sonner';
import { isAPIError } from '@repo/ims-client';
import NotFound from '@/components/ui-components/not-found';

export default function CountryDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const countryId = parseInt(params.id as string, 10);

  const {
    data: country,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['countries', countryId],
    queryFn: async () => await imsClient.inventory.getCountry(countryId),
  });

  const deleteCountryMutation = useMutation({
    mutationFn: async () => await imsClient.inventory.deleteCountry(countryId),
    onSuccess: () => {
      toast.success('País eliminado correctamente');
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      router.replace('/countries');
    },
    onError: (error) => {
      toast.error('No pudimos eliminar el país', {
        description: error.message,
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteCountryMutation.mutate();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error && isAPIError(error) && error.code === 'not_found') {
    return (
      <NotFound
        title="País no encontrado"
        description="No pudimos encontrar el país que buscas. Es posible que haya sido eliminado o que no exista."
        backHref="/countries"
        backLabel="Volver a países"
      />
    );
  }

  if (!country) {
    return <div>Error inesperado</div>;
  }

  return (
    <div>
      <PageHeader
        title={country.name}
        description="Detalles del país"
        backHref="/countries"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/countries/${country.id}/edit`}
          onDelete={handleDelete}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Información Básica</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">Nombre:</dt>
              <dd>{country.name}</dd>

              <dt className="font-medium">Código:</dt>
              <dd>{country.code}</dd>

              <dt className="font-medium">Estado:</dt>
              <dd>
                {country.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    Activo
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    Inactivo
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Información del Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">ID:</dt>
              <dd>{country.id}</dd>

              <dt className="font-medium">Creado:</dt>
              <dd>{new Date(country.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">Última Actualización:</dt>
              <dd>{new Date(country.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente el
              país y todos los datos asociados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
