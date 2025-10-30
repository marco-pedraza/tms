'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@tanstack/react-form';
import { MapPin, Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import useForm from '@/hooks/use-form';
import { PathwayOption, TollRaw } from '@/schemas/pathway-options';

interface FormValues {
  options?: PathwayOption[];
}

/**
 * Creates a default toll booth configuration
 */
const createDefaultTollBooth = (): TollRaw => ({
  nodeId: '',
  passTimeMin: '',
  distance: '',
});

interface PathwayOptionItemProps {
  index: number;
  form: ReturnType<typeof useForm>;
  onRemove: (index: number) => void;
  nodes?: {
    id: number;
    name: string;
    code: string;
    tollPrice: number;
    iaveEnabled: boolean;
  }[];
}

/**
 * Component for rendering a single pathway option with all its fields
 */
export default function PathwayOptionItem({
  index,
  form,
  onRemove,
  nodes = [],
}: PathwayOptionItemProps) {
  // Subscribe to reactive values for proper re-rendering
  const isPassThrough = useStore(
    form.store,
    (state) =>
      (state.values as FormValues)?.options?.[index]?.isPassThrough as
        | boolean
        | undefined,
  );
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  return (
    <div className="border border-gray-200 rounded-lg p-6 bg-white">
      {/* Option Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          {tPathways('pathwayOptions.fields.option', { index: index + 1 })}
        </h3>
        <div className="flex items-center gap-2">
          {/* Default Option Toggle */}
          <form.AppField
            name={`options[${index}].isDefault`}
            listeners={{
              onChange: (field) => {
                if (field.value) {
                  // Turn off all other options' isDefault when this one is set to true
                  (form.store.state.values as FormValues).options?.forEach(
                    (_: unknown, optionIndex: number) => {
                      if (optionIndex !== index) {
                        form.setFieldValue(
                          `options[${optionIndex}].isDefault`,
                          false,
                        );
                      }
                    },
                  );
                }
              },
            }}
          >
            {(field) => (
              <div className="flex items-center gap-2">
                <field.SwitchInput
                  label={tPathways('pathwayOptions.fields.isDefault')}
                  disabled={field.state.value as boolean}
                />
              </div>
            )}
          </form.AppField>
          {/* Remove Option Button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              onRemove(index);
            }}
            className="text-gray-400 hover:text-red-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Option Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Name */}
        <form.AppField name={`options[${index}].name`}>
          {(field) => (
            <field.TextInput
              label={tPathways('pathwayOptions.fields.name')}
              placeholder={tPathways('pathwayOptions.placeholders.name')}
              isRequired
            />
          )}
        </form.AppField>

        {/* Description */}
        <form.AppField name={`options[${index}].description`}>
          {(field) => (
            <field.TextInput
              label={tPathways('pathwayOptions.fields.description')}
              placeholder={tPathways('pathwayOptions.placeholders.description')}
            />
          )}
        </form.AppField>

        {/* Distance */}
        <form.AppField name={`options[${index}].distanceKm`}>
          {(field) => (
            <field.NumberInput
              label={tPathways('pathwayOptions.fields.distance')}
              placeholder={tPathways('pathwayOptions.placeholders.distance')}
              type="number"
              isRequired
            />
          )}
        </form.AppField>

        {/* Typical Time */}
        <form.AppField name={`options[${index}].typicalTimeMin`}>
          {(field) => (
            <field.NumberInput
              label={tPathways('pathwayOptions.fields.typicalTime')}
              placeholder={tPathways('pathwayOptions.placeholders.typicalTime')}
              isRequired
              type="number"
              min="0"
            />
          )}
        </form.AppField>

        {/* Average Speed */}
        <form.AppField name={`options[${index}].avgSpeedKmh`}>
          {(field) => (
            <field.NumberInput
              label={tPathways('pathwayOptions.fields.avgSpeed')}
              placeholder={tPathways('pathwayOptions.placeholders.avgSpeed')}
              isRequired
              type="number"
              min="0"
            />
          )}
        </form.AppField>
      </div>

      {/* Passage Route Toggle */}
      <div className="flex flex-col gap-4 mb-6">
        <form.AppField name={`options[${index}].isPassThrough`}>
          {(field) => (
            <div className="flex items-center gap-2">
              <field.SwitchInput
                label={tPathways('pathwayOptions.fields.isPassThrough')}
              />
            </div>
          )}
        </form.AppField>

        {isPassThrough && (
          <form.AppField name={`options[${index}].passThroughTimeMin`}>
            {(field) => (
              <div className="flex flex-col gap-2">
                <field.NumberInput
                  label={tPathways('pathwayOptions.fields.passThroughTime')}
                  type="number"
                  min="0"
                  isRequired={isPassThrough}
                />
                <span className="text-sm text-gray-500">
                  {tPathways('pathwayOptions.fields.passThroughTimeInfo')}
                </span>
              </div>
            )}
          </form.AppField>
        )}
      </div>

      {/* Toll Booths Section */}
      <TollBoothSection index={index} form={form} nodes={nodes} />

      {/* Active Toggle */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t">
        <form.AppField name={`options[${index}].active`}>
          {(field) => (
            <div className="flex items-center gap-2">
              <field.SwitchInput label="" />
              <label className="text-sm font-medium text-gray-700">
                {tCommon('fields.active')}
              </label>
            </div>
          )}
        </form.AppField>
      </div>
    </div>
  );
}

/**
 * Component for managing toll booths within a pathway option
 */
function TollBoothSection({
  index,
  form,
  nodes = [],
}: {
  index: number;
  form: ReturnType<typeof useForm>;
  nodes?: {
    id: number;
    name: string;
    code: string;
    tollPrice: number;
    iaveEnabled: boolean;
  }[];
}) {
  const tPathways = useTranslations('pathways');
  const tCommon = useTranslations('common');
  // Subscribe to tolls array so UI updates when it changes
  const tolls = useStore(
    form.store,
    (state) => (state.values as FormValues)?.options?.[index]?.tolls || [],
  ) as unknown as TollRaw[];

  const [tollBoothDetails, setTollBoothDetails] = useState<
    Map<number, { price: number; iave: boolean }>
  >(new Map());

  /**
   * Initialize tollbooth details when tolls array changes
   * This handles both initial load (editing mode) and new additions
   */
  useEffect(() => {
    const newDetails = new Map<number, { price: number; iave: boolean }>();
    tolls.forEach((toll, index) => {
      if (toll.nodeId) {
        const node = nodes.find(
          (node) => node.id.toString() === toll.nodeId.toString(),
        );
        if (node) {
          newDetails.set(index, {
            price: node.tollPrice,
            iave: node.iaveEnabled,
          });
        }
      }
    });
    setTollBoothDetails(newDetails);
  }, [tolls, nodes]);

  /**
   * Updates the tollbooth details for a specific toll index
   */
  function updateTollBoothDetails(tollIndex: number, nodeId: string) {
    const node = nodes.find((node) => node.id.toString() === nodeId);
    if (node) {
      setTollBoothDetails((prev) => {
        const newMap = new Map(prev);
        newMap.set(tollIndex, {
          price: node.tollPrice,
          iave: node.iaveEnabled,
        });
        return newMap;
      });
    }
  }

  /**
   * Formats a price value to Mexican Peso currency format
   */
  function priceFormat(price: number) {
    return price.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  }

  return (
    <div className="border-t pt-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-4 w-4 text-gray-500" />
        <h4 className="font-medium text-gray-900">
          {tPathways('pathwayOptions.sections.tollBooths')}
        </h4>
      </div>

      {tolls.length === 0 ? (
        <p className="text-gray-500 italic text-sm mb-4">
          {tPathways('pathwayOptions.placeholders.noTollBooths')}
        </p>
      ) : (
        <div className="space-y-3 mb-4">
          {tolls.map((_, tollIndex) => (
            <div
              key={tollIndex}
              className="flex flex-col p-2 border border-gray-200 rounded-md text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3">
                <form.AppField
                  name={`options[${index}].tolls[${tollIndex}].nodeId`}
                  listeners={{
                    onChange: (field) => {
                      updateTollBoothDetails(tollIndex, field.value as string);
                    },
                  }}
                >
                  {(field) => (
                    <field.SelectInput
                      label={tPathways('pathwayOptions.fields.tollBooth')}
                      placeholder={tPathways(
                        'pathwayOptions.placeholders.tollBooth',
                      )}
                      items={nodes.map((node) => ({
                        id: node.id.toString(),
                        name: `${node.name} (${node.code})`,
                        value: node.id.toString(),
                      }))}
                      isRequired
                      className="w-full"
                    />
                  )}
                </form.AppField>

                <form.AppField
                  name={`options[${index}].tolls[${tollIndex}].distance`}
                >
                  {(field) => (
                    <field.NumberInput
                      label={tPathways('pathwayOptions.fields.distance')}
                      placeholder={tPathways(
                        'pathwayOptions.placeholders.distance',
                      )}
                      isRequired
                      className="w-full"
                    />
                  )}
                </form.AppField>

                <div className="space-y-2 flex items-end gap-2">
                  <form.AppField
                    name={`options[${index}].tolls[${tollIndex}].passTimeMin`}
                  >
                    {(field) => (
                      <field.NumberInput
                        label={tPathways('pathwayOptions.fields.passTime')}
                        placeholder={tPathways(
                          'pathwayOptions.placeholders.passTime',
                        )}
                        isRequired
                        className="w-full"
                      />
                    )}
                  </form.AppField>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      form.removeFieldValue(
                        `options[${index}].tolls` as never,
                        tollIndex,
                      );
                    }}
                    className="text-gray-400 hover:text-red-600 p-1 mb-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {tollBoothDetails.get(tollIndex) && (
                <div className="flex flex-row gap-2 items-center px-3">
                  <div>
                    {tPathways('details.price')}{' '}
                    {priceFormat(tollBoothDetails.get(tollIndex)?.price ?? 0)}
                  </div>
                  <div>
                    {tPathways('details.iave')}{' '}
                    {tollBoothDetails.get(tollIndex)?.iave
                      ? tCommon('status.yes')
                      : tCommon('status.no')}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() =>
          form.pushFieldValue(
            `options[${index}].tolls` as never,
            createDefaultTollBooth() as never,
          )
        }
        className="flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        {tPathways('actions.addTollBooth')}
      </Button>
    </div>
  );
}
