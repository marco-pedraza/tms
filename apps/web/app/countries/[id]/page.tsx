'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['countries', 'common']);
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
    mutationFn: async () => {
      const result = await imsClient.inventory.deleteCountry(countryId);
      queryClient.invalidateQueries({ queryKey: ['countries'] });
      router.replace('/countries');
      return result;
    },
  });

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    toast.promise(deleteCountryMutation.mutateAsync(), {
      loading: t('countries:messages.delete.loading'),
      success: t('countries:messages.delete.success'),
      error: t('countries:messages.delete.error'),
    });
  };

  if (isLoading) {
    return <div>{t('common:states.loading')}</div>;
  }

  if (error && isAPIError(error) && error.code === 'not_found') {
    return (
      <NotFound
        title={t('countries:errors.notFound.title')}
        description={t('countries:errors.notFound.description')}
        backHref="/countries"
        backLabel={t('countries:actions.backToList')}
      />
    );
  }

  if (!country) {
    return <div>{t('common:errors.unexpected')}</div>;
  }

  return (
    <div>
      <PageHeader
        title={country.name}
        description={t('countries:details.description')}
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
            <CardTitle>{t('countries:details.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('countries:form.name')}:</dt>
              <dd>{country.name}</dd>

              <dt className="font-medium">{t('countries:form.code')}:</dt>
              <dd>{country.code}</dd>

              <dt className="font-medium">{t('countries:form.status')}:</dt>
              <dd>
                {country.active ? (
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
            <CardTitle>{t('countries:details.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{t('common:fields.id')}:</dt>
              <dd>{country.id}</dd>

              <dt className="font-medium">{t('common:fields.createdAt')}:</dt>
              <dd>{new Date(country.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{t('common:fields.updatedAt')}:</dt>
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
              {t('countries:messages.delete.confirm')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('countries:messages.delete.description')}
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
