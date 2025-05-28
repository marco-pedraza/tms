'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import ActionButtons from '@/components/action-buttons';
import ConfirmDeleteDialog from '@/components/confirm-delete-dialog';
import PageHeader from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import routes from '@/services/routes';
import TransporterBusLinesTable from '@/transporters/components/transporter-bus-lines-table';
import TransporterSkeleton from '@/transporters/components/transporter-skeleton';
import useQueryTransporter from '@/transporters/hooks/use-query-transporter';
import useTransporterDetailsParams from '@/transporters/hooks/use-transporter-details-params';
import useTransporterMutations from '@/transporters/hooks/use-transporter-mutations';

export default function TransporterPage() {
  const tTransporters = useTranslations('transporters');
  const tCommon = useTranslations('common');
  const { transporterId, isValidId } = useTransporterDetailsParams();
  const { data: transporter, isLoading } = useQueryTransporter({
    transporterId,
    enabled: isValidId,
  });
  const { deleteTransporter } = useTransporterMutations();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteTransporter.mutateWithToast(transporterId);
    setIsDeleteDialogOpen(false);
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
              <dt className="font-medium">{tCommon('fields.name')}</dt>
              <dd>{transporter.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}</dt>
              <dd>{transporter.code}</dd>

              <dt className="font-medium">{tCommon('fields.description')}</dt>
              <dd>{transporter.description}</dd>

              <dt className="font-medium">{tCommon('fields.website')}</dt>
              <dd>
                {transporter.website ? (
                  <a
                    href={transporter.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {transporter.website}
                  </a>
                ) : (
                  '-'
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.status')}</dt>
              <dd>
                {transporter.active ? (
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
            <CardTitle>{tCommon('sections.contactInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.email')}</dt>
              <dd>
                {transporter.email ? (
                  <a
                    href={`mailto:${transporter.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {transporter.email}
                  </a>
                ) : (
                  '-'
                )}
              </dd>

              <dt className="font-medium">{tCommon('fields.phone')}</dt>
              <dd>{transporter.phone}</dd>

              <dt className="font-medium">
                {tTransporters('fields.headquarterCity')}
              </dt>
              <dd>{transporter.headquarterCity?.name ?? '-'}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}</dt>
              <dd>{new Date(transporter.createdAt ?? '').toLocaleString()}</dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}</dt>
              <dd>{new Date(transporter.updatedAt ?? '').toLocaleString()}</dd>
            </dl>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>{tTransporters('sections.busLines')}</CardTitle>
        </CardHeader>
        <CardContent>
          <TransporterBusLinesTable />
        </CardContent>
      </Card>

      <ConfirmDeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
