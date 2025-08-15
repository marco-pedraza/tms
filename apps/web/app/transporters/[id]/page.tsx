'use client';

import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import IsActiveBadge from '@/components/is-active-badge';
import PageHeader from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import useCollectionItemDetailsParams from '@/hooks/use-collection-item-details-params';
import useDeleteDialog from '@/hooks/use-delete-dialog';
import routes from '@/services/routes';
import TransporterBusLinesTable from '@/transporters/components/transporter-bus-lines-table';
import TransporterSkeleton from '@/transporters/components/transporter-skeleton';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function TransporterDetailsPage() {
  const tTransporters = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { itemId: transporterId, isValidId } = useCollectionItemDetailsParams();

  const { data: transporter, isLoading } = useQueryTransporter({
    itemId: transporterId,
    enabled: isValidId,
  });
  const { delete: deleteTransporter } = useTransporterMutations();
  const { deleteId, setDeleteId, onConfirmDelete, onCancelDelete } =
    useDeleteDialog({
      onConfirm: deleteTransporter.mutateWithToast,
    });

  const onDelete = () => {
    if (!transporter) return;
    setDeleteId(transporter.id);
  };

  if (isLoading) {
    return <TransporterSkeleton />;
  }

  if (!transporter) {
    return null;
  }

  return (
    <div>
      <PageHeader
        title={transporter.name}
        description={tTransporters('details.description')}
        backHref={routes.transporters.index}
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={routes.transporters.getEditRoute(transporter.id.toString())}
          onDelete={onDelete}
          editLabel={tCommon('actions.edit')}
          deleteLabel={tCommon('actions.delete')}
        />
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{tCommon('sections.basicInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.name')}:</dt>
              <dd>{transporter.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{transporter.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}:</dt>
              <dd>{transporter.description || '-'}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                <IsActiveBadge isActive={transporter.active} />
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tTransporters('sections.companyInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">
                {tTransporters('fields.legalName')}:
              </dt>
              <dd>{transporter.legalName ?? '-'}</dd>

              <dt className="font-medium">
                {tTransporters('fields.licenseNumber')}:
              </dt>
              <dd>{transporter.licenseNumber ?? '-'}</dd>

              <dt className="font-medium">
                {tTransporters('fields.headquarterCity')}:
              </dt>
              <dd>{transporter.headquarterCity?.name ?? '-'}</dd>

              <dt className="font-medium">
                {tTransporters('fields.address')}:
              </dt>
              <dd>{transporter.address ?? '-'}</dd>

              <dt className="font-medium">
                {tTransporters('fields.logoUrl')}:
              </dt>
              <dd>
                {transporter.logoUrl ? (
                  <a
                    href={transporter.logoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-primary"
                  >
                    {tCommon('actions.view')}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                ) : (
                  '-'
                )}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tTransporters('sections.contactInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.email')}:</dt>
              <dd>
                {transporter.email ? (
                  <a
                    href={`mailto:${transporter.email}`}
                    className="hover:text-primary"
                  >
                    {transporter.email}
                  </a>
                ) : (
                  '-'
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.phone')}:</dt>
              <dd>
                {transporter.phone ? (
                  <a
                    href={`tel:${transporter.phone}`}
                    className="hover:text-primary"
                  >
                    {transporter.phone}
                  </a>
                ) : (
                  '-'
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.website')}:</dt>
              <dd>
                {transporter.website ? (
                  <a
                    href={transporter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-primary"
                  >
                    {transporter.website}
                    <ExternalLink className="ml-1 h-4 w-4" />
                  </a>
                ) : (
                  '-'
                )}
              </dd>

              <dt className="font-medium">
                {tTransporters('fields.contactInfo')}:
              </dt>
              <dd>{transporter.contactInfo || '-'}</dd>
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
              <dd>{transporter.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {transporter.createdAt
                  ? new Date(transporter.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {transporter.updatedAt
                  ? new Date(transporter.updatedAt).toLocaleString()
                  : '-'}
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{tTransporters('sections.busLines')}</CardTitle>
          </CardHeader>
          <CardContent>
            <TransporterBusLinesTable transporterId={transporter.id} />
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
