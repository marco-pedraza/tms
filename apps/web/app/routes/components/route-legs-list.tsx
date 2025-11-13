'use client';

import { useMemo, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { Plus } from 'lucide-react';
import { Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { pathways } from '@repo/ims-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import useForm from '@/hooks/use-form';
import useQueryAllPathways from '@/pathways/hooks/use-query-all-pathways';
import RouteLegItem from './route-leg-item';

interface RouteLegsListProps {
  form: ReturnType<typeof useForm>;
  legContinuityErrors: Map<
    number,
    { expectedOrigin: string; actualOrigin: string }
  >;
  className?: string;
}

interface RouteLegRaw {
  pathwayId: string;
  pathwayOptionId: string;
  position: number;
}

export default function RouteLegsList({
  form,
  legContinuityErrors,
  className,
}: RouteLegsListProps) {
  const tRoutes = useTranslations('routes');
  const { data: pathwaysData } = useQueryAllPathways();
  const [selectedPathwayId, setSelectedPathwayId] = useState<string>('');

  const legs = useStore(
    form.store,
    (state) => (state.values as { legs?: RouteLegRaw[] })?.legs ?? [],
  ) as RouteLegRaw[];

  // Get the last leg's destination to show validation message
  const lastLegDestination = useMemo(() => {
    if (legs.length === 0) return null;

    const lastLeg = legs[legs.length - 1];
    if (!lastLeg) return null;

    const lastPathway = pathwaysData?.data.find(
      (p) => p.id.toString() === lastLeg.pathwayId,
    ) as pathways.PathwayWithRelations | undefined;
    return lastPathway?.destination;
  }, [legs, pathwaysData]);

  const handleAddLeg = () => {
    if (!selectedPathwayId) return;

    const pathway = pathwaysData?.data.find(
      (p) => p.id.toString() === selectedPathwayId,
    );
    if (!pathway) return;

    // Get options for the pathway - we'll use the first available option
    // The user can change it later in the RouteLegItem
    const newLeg: RouteLegRaw = {
      pathwayId: selectedPathwayId,
      pathwayOptionId: '', // Will be set when options are loaded
      position: legs.length + 1,
    };

    const currentLegs = (form.getFieldValue('legs') as RouteLegRaw[]) || [];
    form.setFieldValue('legs', [...currentLegs, newLeg]);
    setSelectedPathwayId('');
  };

  const handleRemoveLeg = (index: number) => {
    const currentLegs = (form.getFieldValue('legs') as RouteLegRaw[]) || [];
    const updatedLegs = currentLegs
      .filter((_, i) => i !== index)
      .map((leg, i) => ({ ...leg, position: i + 1 }));
    form.setFieldValue('legs', updatedLegs);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const currentLegs = (form.getFieldValue('legs') as RouteLegRaw[]) || [];
    const leg1 = currentLegs[index];
    const leg2 = currentLegs[index - 1];
    if (!leg1 || !leg2) return;
    const updatedLegs = [...currentLegs];
    updatedLegs[index - 1] = leg1;
    updatedLegs[index] = leg2;
    updatedLegs.forEach((leg, i) => {
      leg.position = i + 1;
    });
    form.setFieldValue('legs', updatedLegs);
  };

  const handleMoveDown = (index: number) => {
    const currentLegs = (form.getFieldValue('legs') as RouteLegRaw[]) || [];
    if (index === currentLegs.length - 1) return;
    const leg1 = currentLegs[index];
    const leg2 = currentLegs[index + 1];
    if (!leg1 || !leg2) return;
    const updatedLegs = [...currentLegs];
    updatedLegs[index] = leg2;
    updatedLegs[index + 1] = leg1;
    updatedLegs.forEach((leg, i) => {
      leg.position = i + 1;
    });
    form.setFieldValue('legs', updatedLegs);
  };

  const handleOptionChange = (legIndex: number, optionId: string) => {
    const currentLegs = (form.getFieldValue('legs') as RouteLegRaw[]) || [];
    const leg = currentLegs[legIndex];
    if (!leg?.pathwayId) return;
    const updatedLegs = [...currentLegs];
    updatedLegs[legIndex] = {
      pathwayId: leg.pathwayId,
      pathwayOptionId: optionId,
      position: leg.position,
    };
    form.setFieldValue('legs', updatedLegs);
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{tRoutes('routeLegs.title')}</CardTitle>
        <CardDescription>{tRoutes('routeLegs.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add Segment Section */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <Select
              value={selectedPathwayId}
              onValueChange={setSelectedPathwayId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue
                  placeholder={tRoutes('routeLegs.selectPlaceholder')}
                />
              </SelectTrigger>
              <SelectContent>
                {pathwaysData?.data?.map((pathway) => {
                  const pathwayWithRelations =
                    pathway as pathways.PathwayWithRelations;
                  return (
                    <SelectItem key={pathway.id} value={pathway.id.toString()}>
                      {pathway.name} ({pathwayWithRelations.origin?.code} →{' '}
                      {pathwayWithRelations.destination?.code})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              type="button"
              onClick={handleAddLeg}
              disabled={!selectedPathwayId}
              className="bg-blue-700 hover:bg-blue-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              {tRoutes('routeLegs.addButton')}
            </Button>
          </div>

          {/* Validation Message */}
          {lastLegDestination && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>{tRoutes('routeLegs.validation.title')}</AlertTitle>
              <AlertDescription>
                {tRoutes('routeLegs.validation.message', {
                  city: lastLegDestination.name,
                })}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Selected Segments */}
        {legs.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-semibold">
              {tRoutes('routeLegs.selectedTitle')}
            </h3>
            {legs.map((leg, index) => {
              const error = legContinuityErrors.get(index);
              return (
                <RouteLegItem
                  key={index}
                  leg={leg}
                  index={index}
                  form={form}
                  onRemove={handleRemoveLeg}
                  onMoveUp={handleMoveUp}
                  onMoveDown={handleMoveDown}
                  onOptionChange={handleOptionChange}
                  continuityError={error}
                />
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
