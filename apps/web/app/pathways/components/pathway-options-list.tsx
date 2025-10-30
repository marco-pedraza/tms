'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import useForm from '@/hooks/use-form';
import PathwayOptionItem from '@/pathways/components/pathway-option-item';
import { PathwayOption, PathwayOptionRaw } from '@/schemas/pathway-options';

interface PathwayOptionsListProps {
  form: ReturnType<typeof useForm>;
  options: PathwayOption[];
  newOption: PathwayOptionRaw;
  nodes?: {
    id: number;
    name: string;
    code: string;
    tollPrice: number;
    iaveEnabled: boolean;
  }[];
}

/**
 * Component for managing the list of pathway options
 */
export default function PathwayOptionsList({
  form,
  options,
  newOption,
  nodes = [],
}: PathwayOptionsListProps) {
  const tPathways = useTranslations('pathways');
  return (
    <>
      {options?.map((_, index) => (
        <PathwayOptionItem
          key={index}
          index={index}
          form={form}
          nodes={nodes}
          onRemove={(index) => {
            const field = form.getFieldValue('options') as PathwayOption[];
            if (field[index]?.isDefault ?? false) {
              toast.error(
                tPathways(
                  'pathwayOptions.errors.cannotRemoveDefaultOption',
                ) as string,
              );
              return;
            }
            form.removeFieldValue('options' as never, index as never);
          }}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          form.pushFieldValue('options' as never, newOption as never);
        }}
        className="w-full flex items-center justify-center gap-2 py-3 border-gray-300 hover:border-gray-400"
      >
        <Plus className="h-4 w-4" />
        {tPathways('actions.addOption')}
      </Button>
    </>
  );
}
