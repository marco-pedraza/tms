'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import CitySkeleton from '@/cities/components/city-skeleton';
import useCityDetailsParams from '@/cities/hooks/use-city-details-params';
import useCityMutations from '@/cities/hooks/use-city-mutations';
import useQueryCity from '@/cities/hooks/use-query-city';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import routes from '@/services/routes';
import createGoogleMapsLink from '@/utils/create-google-maps-link';

export default function CityDetailsPage() {
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');
  const { cityId, isValidId } = useCityDetailsParams();
  const { data: city, isLoading } = useQueryCity({
    cityId,
    enabled: isValidId,
  });
  const { delete: deleteCity } = useCityMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!cityId) return;
    deleteCity.mutateWithToast(cityId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <CitySkeleton />;
  }

  if (!city) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={city.name}
        description={tCities('details.description')}
        backHref={routes.cities.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.cities.getEditRoute(city.id.toString())}
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
              <dd>{city.state.name}</dd>

              <dt className="font-medium">{tCities('fields.timezone')}:</dt>
              <dd>{city.timezone}</dd>

              <dt className="font-medium">{tCommon('fields.slug')}:</dt>
              <dd>{city.slug}</dd>

              <dt className="font-medium">{tCommon('fields.coordinates')}:</dt>
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
