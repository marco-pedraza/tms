'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { terminals } from '@repo/ims-client';
import useQueryCity from '@/cities/hooks/use-query-city';
import ActionButtons from '@/components/action-buttons';
import PageHeader from '@/components/page-header';
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
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import TerminalSkeleton from '@/terminals/components/terminal-skeleton';
import useQueryTerminal from '@/terminals/hooks/use-query-terminal';
import useTerminalDetailsParams from '@/terminals/hooks/use-terminal-details-params';
import useTerminalMutations from '@/terminals/hooks/use-terminal-mutations';
import createGoogleMapsLink from '@/utils/create-google-maps-link';

type OperatingHours = terminals.OperatingHours;

// Array with the correct order of weekdays
const DAYS_OF_WEEK = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export default function TerminalDetailsPage() {
  const tTerminals = useTranslations('terminals');
  const tCommon = useTranslations('common');
  const { terminalId, isValidId } = useTerminalDetailsParams();
  const { data: terminal, isLoading } = useQueryTerminal({
    terminalId,
    enabled: isValidId,
  });
  const { deleteTerminal } = useTerminalMutations();
  const { data: city } = useQueryCity({
    cityId: terminal?.cityId ?? -1,
    enabled: !!terminal?.cityId,
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!terminalId) return;
    deleteTerminal.mutateWithToast(terminalId);
  };

  // Function to sort weekdays in the operating hours object
  const getOrderedOperatingHours = (
    unorderedHours: Partial<OperatingHours>,
  ): OperatingHours => {
    const ordered: OperatingHours = {};

    // Iterate over the defined order of days
    DAYS_OF_WEEK.forEach((day) => {
      if (unorderedHours[day]) {
        ordered[day] = unorderedHours[day];
      } else {
        // Add empty days to maintain complete order
        ordered[day] = [];
      }
    });

    return ordered;
  };

  if (isLoading) {
    return <TerminalSkeleton />;
  }

  if (!terminal) {
    return null;
  }

  // Prepare facilities for display
  const facilities = Array.isArray(terminal.facilities)
    ? terminal.facilities
    : [];

  // Format operating hours for display and ensure they're ordered
  const operatingHours = getOrderedOperatingHours(
    (terminal.operatingHours && typeof terminal.operatingHours === 'object'
      ? terminal.operatingHours
      : {}) as Partial<OperatingHours>,
  );

  return (
    <div>
      <PageHeader
        title={terminal.name}
        description={tTerminals('details.description')}
        backHref="/terminals"
      />

      <div className="flex justify-end mb-6">
        <ActionButtons
          editHref={`/terminals/${terminal.id}/edit`}
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
              <dd>{terminal.name}</dd>

              <dt className="font-medium">{tCommon('fields.code')}:</dt>
              <dd>{terminal.code}</dd>

              <dt className="font-medium">{tTerminals('fields.address')}:</dt>
              <dd>{terminal.address}</dd>

              <dt className="font-medium">
                {tTerminals('fields.contactphone')}:
              </dt>
              <dd>{terminal.contactphone || '-'}</dd>

              <dt className="font-medium">{tTerminals('fields.city')}:</dt>
              <dd>{city?.name}</dd>

              <dt className="font-medium">{tCommon('fields.slug')}:</dt>
              <dd>{terminal.slug}</dd>

              <dt className="font-medium">{tCommon('fields.status')}:</dt>
              <dd>
                {terminal.active ? (
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
            <CardTitle>Location & {tTerminals('fields.facilities')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4">
              <dt className="font-medium">{tCommon('fields.coordinates')}:</dt>
              <dd>
                <a
                  href={createGoogleMapsLink(
                    terminal.latitude,
                    terminal.longitude,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center hover:text-primary"
                >
                  {terminal.latitude}, {terminal.longitude}
                  <ExternalLink className="ml-1 h-4 w-4" />
                </a>
              </dd>

              <dt className="font-medium">
                {tTerminals('fields.facilities')}:
              </dt>
              <dd>
                <div className="flex flex-wrap gap-1">
                  {facilities.map((facility, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {facility.name}
                    </Badge>
                  ))}
                  {facilities.length === 0 && '-'}
                </div>
              </dd>
            </dl>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{tTerminals('fields.operatingHours')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(operatingHours).map(([day, slots]) => {
                // Check if there are any slots for this day
                const hasSlots = Array.isArray(slots) && slots.length > 0;

                return (
                  <div key={day} className="flex justify-between">
                    <span className="font-medium capitalize">
                      {tCommon(`days.${day}`)}:
                    </span>
                    <span>
                      {hasSlots
                        ? slots.map((slot, index) => (
                            <div key={index}>
                              {slot.open} - {slot.close}
                              {index < slots.length - 1 && ', '}
                            </div>
                          ))
                        : tTerminals('operatingHours.closed')}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{tCommon('sections.systemInfo')}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[1fr_2fr] gap-4 md:grid-cols-[1fr_2fr_1fr_2fr]">
              <dt className="font-medium">{tCommon('fields.id')}:</dt>
              <dd>{terminal.id}</dd>

              <dt className="font-medium">{tCommon('fields.createdAt')}:</dt>
              <dd>
                {terminal.createdAt
                  ? new Date(terminal.createdAt).toLocaleString()
                  : '-'}
              </dd>

              <dt className="font-medium">{tCommon('fields.updatedAt')}:</dt>
              <dd>
                {terminal.updatedAt
                  ? new Date(terminal.updatedAt).toLocaleString()
                  : '-'}
              </dd>
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
