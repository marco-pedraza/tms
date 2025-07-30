'use client';

import { useTranslations } from 'next-intl';
import { amenities } from '@repo/ims-client';
import useQueryAmenities from '@/amenities/hooks/use-query-amenities';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import { DataTable, DataTableColumnDef } from '@/components/data-table';
import { FilterConfig } from '@/components/data-table/data-table-header';
import IsActiveBadge from '@/components/is-active-badge';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import useServerTableEvents from '@/hooks/use-server-table-events';
import useTableUrlState from '@/hooks/use-table-url-state';
import routes from '@/services/routes';
import {
  UseAmenitiesTranslationsResult,
  UseCommonTranslationsResult,
} from '@/types/translations';
import { createEnumArray } from '@/utils/create-enum-array';
import useAmenitiesMutations from '../hooks/use-amenities-mutations';
import AmenityCategoryBadge from './amenity-category-badge';

// Create a mapping object for AmenityCategory to use with createEnumArray
const amenityCategoryMap: { [key in amenities.AmenityCategory]: undefined } = {
  basic: undefined,
  comfort: undefined,
  technology: undefined,
  security: undefined,
  accessibility: undefined,
  services: undefined,
};

/**
 * Generate category filter options automatically from AmenityCategory type, sorted alphabetically by label
 */
function generateCategoryOptions(tAmenities: UseAmenitiesTranslationsResult) {
  const categories = createEnumArray(amenityCategoryMap);
  return categories
    .map((category) => ({
      label: tAmenities(`categories.${category}`),
      value: category,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

interface AmenitiesColumnsFactoryProps {
  tCommon: UseCommonTranslationsResult;
  tAmenities: UseAmenitiesTranslationsResult;
}

export function amenitiesColumnsFactory({
  tCommon,
  tAmenities,
}: AmenitiesColumnsFactoryProps): DataTableColumnDef<amenities.Amenity>[] {
  return [
    {
      accessorKey: 'name',
      header: tCommon('fields.name'),
      sortable: true,
    },
    {
      accessorKey: 'iconName',
      header: tAmenities('fields.iconName'),
      sortable: true,
      cell: ({ row }) => {
        const iconName = row.original.iconName;

        if (!iconName) {
          return (
            <span className="text-muted-foreground text-sm">
              {tAmenities('errors.noIcon')}
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <DynamicLucideIcon
              name={iconName}
              className="h-4 w-4"
              fallback={<span className="text-muted-foreground">?</span>}
            />
            <span className="font-medium text-sm">{iconName}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'category',
      header: tCommon('fields.category'),
      sortable: true,
      cell: ({ row }) => {
        const category = row.original.category;
        return <AmenityCategoryBadge category={category} />;
      },
    },
    {
      accessorKey: 'active',
      header: tCommon('fields.status'),
      sortable: true,
      cell: ({ row }) => {
        const active = row.original.active;
        return <IsActiveBadge isActive={active} />;
      },
    },
    {
      accessorKey: 'description',
      header: tCommon('fields.description'),
      sortable: false,
      cell: ({ row }) => {
        const description = row.original.description;
        return <div className="font-medium">{description}</div>;
      },
    },
  ];
}

export default function AmenitiesTable() {
  const tCommon = useTranslations('common');
  const tAmenities = useTranslations('amenities');
  const {
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
    searchUrlState,
    setSearchUrlState,
    filtersUrlState,
    setFiltersUrlState,
  } = useTableUrlState<amenities.Amenity>();
  const { data, isLoading, error, refetch } = useQueryAmenities({
    page: paginationUrlState.page,
    pageSize: paginationUrlState.pageSize,
    searchTerm: searchUrlState,
    orderBy: sortingUrlState,
    filters: filtersUrlState,
  });
  const { onSortingChange, onPaginationChange } = useServerTableEvents({
    paginationUrlState,
    sortingUrlState,
    setPaginationUrlState,
    setSortingUrlState,
  });
  const { delete: deleteAmenity } = useAmenitiesMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteAmenity.mutateWithToast,
    });

  const filtersConfig: FilterConfig[] = [
    {
      name: tCommon('fields.category'),
      key: 'category',
      options: generateCategoryOptions(tAmenities),
    },
    {
      name: tCommon('fields.status'),
      key: 'active',
      options: [
        { label: tCommon('status.active'), value: true },
        { label: tCommon('status.inactive'), value: false },
      ],
    },
  ];

  const columns = amenitiesColumnsFactory({ tCommon, tAmenities });

  return (
    <>
      <DataTable
        data={data?.data ?? []}
        columns={columns}
        isLoading={isLoading}
        hasError={!!error}
        onRetry={refetch}
        addHref={routes.amenities.new}
        pagination={{
          pageIndex: paginationUrlState.page - 1,
          pageSize: paginationUrlState.pageSize,
          pageCount: data?.pagination.totalPages ?? 0,
        }}
        onSortingChange={onSortingChange}
        sorting={sortingUrlState}
        initialSearchValue={searchUrlState}
        onSearchChange={setSearchUrlState}
        filtersConfig={filtersConfig}
        filtersState={filtersUrlState}
        onFiltersChange={setFiltersUrlState}
        onPaginationChange={onPaginationChange}
        onDelete={setDeleteId}
        routes={routes.amenities}
      />
      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onOpenChange={onCancelDelete}
        onConfirm={onConfirmDelete}
      />
    </>
  );
}
