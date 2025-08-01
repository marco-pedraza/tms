'use client';

import { useTranslations } from 'next-intl';
import AmenityCategoryBadge from '@/amenities/components/amenity-category-badge';
import AmenitySkeleton from '@/amenities/components/amenity-skeleton';
import useAmenitiesMutations from '@/amenities/hooks/use-amenities-mutations';
import useQueryAmenity from '@/amenities/hooks/use-query-amenity';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import DynamicLucideIcon from '@/components/ui/dynamic-lucide-icon';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';

export default function AmenityDetailsPage() {
  const tAmenities = useTranslations('amenities');
  const tCommon = useTranslations('common');
  const { itemId: amenityId, isValidId } = useCollectionItemDetailsParams();
  const { data: amenity, isLoading } = useQueryAmenity({
    amenityId,
    enabled: isValidId,
  });
  const { delete: deleteAmenity } = useAmenitiesMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteAmenity.mutateWithToast,
    });

  const onDelete = () => {
    if (!amenity) return;
    setDeleteId(amenity.id);
  };

  if (isLoading) {
    return <AmenitySkeleton />;
  }

  if (!amenity) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={amenity.name}
        description={tAmenities('details.description')}
        backHref={routes.amenities.index}
        backLabel={tAmenities('actions.backToList')}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.amenities.getEditRoute(amenity.id.toString())}
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
              <dd className="font-medium">{amenity.name}</dd>

              <dt className="font-medium">{tCommon('fields.category')}:</dt>
              <dd>
                <AmenityCategoryBadge category={amenity.category} />
              </dd>

              <dt className="font-medium">{tAmenities('fields.iconName')}:</dt>
              <dd>
                {amenity.iconName ? (
                  <div className="flex items-center gap-2">
                    <DynamicLucideIcon
                      name={amenity.iconName}
                      className="h-4 w-4"
                      fallback={
                        <span className="text-muted-foreground">?</span>
                      }
                    />
                    <span className="font-medium text-sm">
                      {amenity.iconName}
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    {tAmenities('errors.noIcon')}
                  </span>
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd className="text-sm">
                {amenity.description || (
                  <span className="text-muted-foreground text-sm">
                    {tCommon('fields.noDescription')}
                  </span>
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={amenity.active} />
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
              <dd className="text-sm">{amenity.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd className="text-sm">
                {amenity.createdAt
                  ? new Date(amenity.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd className="text-sm">
                {amenity.updatedAt
                  ? new Date(amenity.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <ConfirmDeleteDialog
        isOpen={!!deleteId}
        onConfirm={onConfirmDelete}
        onOpenChange={onCancelDelete}
      />
    </div>
  );
}
