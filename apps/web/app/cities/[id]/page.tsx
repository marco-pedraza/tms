'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ExternalLink, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCityMutations } from '@/cities/hooks/use-city-mutations';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import imsClient from '@/lib/ims-client';
import { createGoogleMapsLink } from '@/lib/utils';

export default function CityDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');
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
        throw new Error(tCommon('errors.invalidId'));
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
          {tCities('errors.notFound.title')}
        </h2>
        <p className="text-muted-foreground">
          {tCities('errors.notFound.description')}
        </p>
        <Button
          variant="outline"
          onClick={() => {
            router.push('/cities');
          }}
        >
          {tCities('actions.backToList')}
        </Button>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={city.name}
        description={tCities('details.description')}
        backHref="/cities"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/cities/${city.id}/edit`}
          onDelete={handleDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{city.name}</dd>

              <dt className="font-medium">{tCities('fields.state')}:</dt>
              <dd>{city.stateId}</dd>

              <dt className="font-medium">{tCities('fields.timezone')}:</dt>
              <dd>{city.timezone}</dd>

              <dt className="font-medium">{tCommon('fields.slug')}:</dt>
              <dd>{city.slug}</dd>

              <dt className="font-medium">{tCities('fields.coordinates')}:</dt>
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

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {city.active ? (
                  <Badge variant="outline" className="bg-green-100">
                    {tCommon('status.active')}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="bg-red-100">
                    {tCommon('status.inactive')}
                  </Badge>
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{city.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {city.createdAt
                  ? new Date(city.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {city.updatedAt
                  ? new Date(city.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
