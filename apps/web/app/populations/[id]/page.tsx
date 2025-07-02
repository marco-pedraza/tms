'use client';

import { useTranslations } from 'next-intl';
import { cities } from '@repo/ims-client';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable } from '@/components/data-table';
import { DataTableColumnDef } from '@/components/data-table';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import PopulationSkeleton from '@/populations/components/population-skeleton';
import usePopulationDetailsParams from '@/populations/hooks/use-population-details-params';
import usePopulationMutations from '@/populations/hooks/use-population-mutations';
import useQueryPopulation from '@/populations/hooks/use-query-population';
import routes from '@/services/routes';
import { UseTranslationsResult } from '@/types/translations';

const createPopulationCitiesColumns = ({
  tCommon,
  tCities,
}: {
  tCommon: UseTranslationsResult;
  tCities: UseTranslationsResult;
}): DataTableColumnDef<cities.City>[] => {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue('name')}</div>
      ),
    },
    {
      accessorKey: 'slug',
      header: tCommon('fields.slug'),
      cell: ({ row }) => <div>{row.getValue('slug')}</div>,
    },
    {
      accessorKey: 'timezone',
      header: tCities('fields.timezone'),
      cell: ({ row }) => <div>{row.getValue('timezone')}</div>,
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      accessorKey: 'createdAt',
      header: tCommon('fields.createdAt'),
      cell: ({ row }) => {
        const value = row.getValue('createdAt');
        return value ? new Date(value as string).toLocaleDateString() : '-';
      },
    },
  ];
};

export default function PopulationDetailsPage() {
  const tPopulations = useTranslations('populations');
  const tCities = useTranslations('cities');
  const tCommon = useTranslations('common');
  const { populationId, isValidId } = usePopulationDetailsParams();
  const {
    data: population,
    isLoading,
    error,
    refetch,
  } = useQueryPopulation({
    populationId,
    enabled: isValidId,
  });
  const { delete: deletePopulation } = usePopulationMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deletePopulation.mutateWithToast,
    });

  const onDelete = () => {
    if (!population) return;
    setDeleteId(population.id);
  };

  if (isLoading) {
    return <PopulationSkeleton />;
  }

  if (!population) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={population.name}
        description={tPopulations('details.description')}
        backHref={routes.populations.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.populations.getEditRoute(population.id.toString())}
          onDelete={onDelete}
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
              <dd>{population.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{population.code}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {population.active ? (
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
              <dd>{population.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {population.createdAt
                  ? new Date(population.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {population.updatedAt
                  ? new Date(population.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tPopulations('sections.cities')}</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={population.cities ?? []}
            columns={createPopulationCitiesColumns({
              tCommon,
              tCities,
            })}
            isLoading={isLoading}
            hasError={!!error}
            onRetry={refetch}
            addHref={routes.populations.getEditRoute(population.id.toString())}
            // This table is read only, so we don't need to delete any cities
            onDelete={() => {}}
            routes={routes.cities}
            displayActionsColumn={false}
          />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </div>
  );
}
