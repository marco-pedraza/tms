'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import PageHeader from '@/components/page-header';
import ActionButtons from '@/components/action-buttons';
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
import { useQuery } from '@tanstack/react-query';
import imsClient from '@/lib/imsClient';
import { isAPIError } from '@repo/ims-client';
import NotFound from '@/components/not-found';
import { useCountryMutations } from '@/app/countries/hooks/use-country-mutations';

export default function CountryDetailsPage() {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');

  const params = useParams();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const countryId = parseInt(params.id as string, 10);
  const { deleteCountry } = useCountryMutations();

  const {
    data: country,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['countries', countryId],
    queryFn: async () => await imsClient.inventory.getCountry(countryId),
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteCountry.mutateWithToast(countryId);
    setIsDeleteDialogOpen(false);
  };

  if (isLoading) {
    return <div>{tCommon('states.loading')}</div>;
  }

  if (error && isAPIError(error) && error.code === 'not_found') {
    return (
      <NotFound
        title={tCountries('errors.notFound.title')}
        description={tCountries('errors.notFound.description')}
        backHref="/countries"
        backLabel={tCountries('actions.backToList')}
      />
    );
  }

  if (!country) {
    return <div>{tCommon('errors.unexpected')}</div>;
  }

  return (
    <div>
      <PageHeader
        title={country.name}
        description={tCountries('details.description')}
        backHref="/countries"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/countries/${country.id}/edit`}
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
              <dd>{country.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{country.code}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {country.active ? (
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
              <dd>{country.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>{new Date(country.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
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
            <AlertDialogTitle>
              {tCommon('crud.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {tCommon('crud.delete.description')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
