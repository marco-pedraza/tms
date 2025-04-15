'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PageHeader, ActionButtons } from '@/components/ui-components';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import { useCityMutations } from '../hooks/use-city-mutations';
import { Loader2 } from 'lucide-react';
import { createGoogleMapsLink } from '@/lib/utils';

export default function CityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation(['cities', 'common']);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { deleteCity } = useCityMutations();

  const cityId = parseInt(params.id as string, 10);

  const {
    data: city,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['cities', cityId],
    queryFn: async () => {
      if (!cityId || isNaN(cityId)) {
        throw new Error(t('common:errors.invalidId'));
      }
      return await imsClient.inventory.getCity(cityId);
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!cityId) return;
    deleteCity.mutateWithToast(cityId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error ?? !city) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4">
        <h2 className="text-xl font-semibold">
          {t('cities:errors.notFound.title')}
        </h2>
        <p className="text-muted-foreground">
          {t('cities:errors.notFound.description')}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            router.push('/cities');
          }}
        >
          {t('cities:actions.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={city.name}
        description={t('cities:details.description')}
        backHref="/cities"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/cities/${city.id}/edit`}
          onDelete={handleDelete}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('common:sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('common:fields.name')}:</dt>
              <dd>{city.name}</dd>

              <dt className="font-medium">{t('cities:fields.state')}:</dt>
              <dd>{city.stateId}</dd>

              <dt className="font-medium">{t('cities:fields.timezone')}:</dt>
              <dd>{city.timezone}</dd>

              <dt className="font-medium">{t('common:fields.slug')}:</dt>
              <dd>{city.slug}</dd>

              <dt className="font-medium">{t('cities:fields.coordinates')}:</dt>
              <dd>
                <a
                  href={createGoogleMapsLink(city.latitude, city.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  {city.latitude}, {city.longitude}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </dd>

              <dt className="font-medium">{t('common:fields.status')}:</dt>
              <dd>
                {city.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {t('common:status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {t('common:status.inactive')}
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('common:sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('common:fields.id')}:</dt>
              <dd>{city.id}</dd>

              <dt className="font-medium">{t('common:fields.createdAt')}:</dt>
              <dd>
                {city.createdAt
                  ? new Date(city.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{t('common:fields.updatedAt')}:</dt>
              <dd>
                {city.updatedAt
                  ? new Date(city.updatedAt).toLocaleString()
                  : '-'}
              </dd>
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
            <AlertDialogTitle>
              {t('common:crud.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('common:crud.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {t('common:actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
