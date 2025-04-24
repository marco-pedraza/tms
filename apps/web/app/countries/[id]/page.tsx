'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCountryDetailsParams from '@/countries/hooks/use-country-details-params';
import { useCountryMutations } from '@/countries/hooks/use-country-mutations';
import useQueryCountry from '@/countries/hooks/use-query-country';

export default function CountryDetailsPage() {
  const tCountries = useTranslations('countries');
  const tCommon = useTranslations('common');
  const { countryId, isValidId } = useCountryDetailsParams();
  const { data: country, isLoading } = useQueryCountry({
    countryId,
    enabled: isValidId,
  });
  const { deleteCountry } = useCountryMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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

  if (!country) {
    return null;
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

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
